const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createOrder = async (req, res) => {
  try {
    const { courseId, amount } = req.body;
    if (!courseId || !amount) {
      return res.status(400).json({ error: 'courseId and amount required' });
    }

    const shortId = courseId.replace(/-/g, '').slice(0, 8);
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `rcpt_${shortId}_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    console.log('Order created:', order.id);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    const msg = error.error?.description || error.message || 'Unknown error';
    console.error('Create order error:', msg, error.statusCode);
    res.status(500).json({ error: msg });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, courseId, userId, userEmail, amount } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const purchaseId = uuidv4();
    await pool.query(
      `INSERT INTO purchases (purchase_id, user_id, user_email, course_id, payment_id, order_id, amount, payment_status, purchased_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', NOW())`,
      [purchaseId, userId, userEmail || '', courseId, paymentId, orderId, amount || 0]
    );

    await pool.query(
      'INSERT INTO user_purchases (user_id, course_id, purchase_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, course_id) DO NOTHING',
      [userId, courseId, purchaseId]
    );

    res.json({
      success: true,
      message: 'Payment verified successfully',
      purchaseId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserPurchases = async (req, res) => {
  try {
    const userId = req.user.uid;

    const purchaseResult = await pool.query(
      'SELECT * FROM purchases WHERE user_id = $1 ORDER BY purchased_at DESC',
      [userId]
    );

    const purchases = purchaseResult.rows.map(p => ({
      purchaseId: p.purchase_id,
      userId: p.user_id,
      userEmail: p.user_email,
      courseId: p.course_id,
      paymentId: p.payment_id,
      orderId: p.order_id,
      amount: parseFloat(p.amount),
      paymentStatus: p.payment_status,
      purchasedAt: p.purchased_at
    }));

    const courseIds = [...new Set(purchases.map(p => p.courseId))];
    const coursesMap = {};

    for (const courseId of courseIds) {
      const courseResult = await pool.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
      if (courseResult.rows.length > 0) {
        const c = courseResult.rows[0];
        coursesMap[courseId] = {
          courseId: c.course_id,
          title: c.title,
          description: c.description,
          thumbnail: c.thumbnail,
          category: c.category,
          price: parseFloat(c.price),
          difficulty: c.difficulty,
          isFree: c.is_free,
          createdAt: c.created_at
        };
      }
    }

    res.json({ purchases, courses: coursesMap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.grantCourse = async (req, res) => {
  try {
    const { email, courseId } = req.body;
    if (!email || !courseId) {
      return res.status(400).json({ error: 'Email and courseId required' });
    }

    const { admin } = require('../firebase/admin');
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
    } catch {
      return res.status(404).json({ error: 'User not found in Firebase' });
    }
    const uid = userRecord.uid;

    const courseCheck = await pool.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const existing = await pool.query(
      'SELECT * FROM user_purchases WHERE user_id = $1 AND course_id = $2',
      [uid, courseId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already enrolled in this course' });
    }

    const purchaseId = uuidv4();
    await pool.query(
      `INSERT INTO purchases (purchase_id, user_id, user_email, course_id, payment_id, order_id, amount, payment_status, purchased_at)
       VALUES ($1, $2, $3, $4, 'granted', 'granted', 0, 'completed', NOW())`,
      [purchaseId, uid, email, courseId]
    );

    await pool.query(
      'INSERT INTO user_purchases (user_id, course_id, purchase_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [uid, courseId, purchaseId]
    );

    res.json({ success: true, message: `Course granted to ${email}`, purchaseId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.webhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    if (event === 'payment.captured') {
      const payment = req.body.payload.payment.entity;
      const purchaseId = uuidv4();
      await pool.query(
        `INSERT INTO purchases (purchase_id, payment_id, order_id, amount, payment_status, purchased_at)
         VALUES ($1, $2, $3, $4, 'completed', NOW())`,
        [purchaseId, payment.id, payment.order_id, payment.amount / 100]
      );
    }

    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
