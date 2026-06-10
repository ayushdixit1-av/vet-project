const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.getPackages = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, credits, price, description, popular FROM credit_packages WHERE active = true ORDER BY price ASC'
    );
    res.json({ packages: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyCredits = async (req, res) => {
  try {
    const userId = req.user.uid;
    const result = await pool.query(
      'SELECT credits FROM user_credits WHERE user_id = $1',
      [userId]
    );
    const credits = parseFloat(result.rows[0]?.credits || 0);

    const txnResult = await pool.query(
      `SELECT type, credits, balance_after, description, created_at
       FROM credit_transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );

    res.json({ credits, transactions: txnResult.rows, needsPurchase: credits < 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const { packageId } = req.body;
    if (!packageId) {
      return res.status(400).json({ error: 'packageId required' });
    }

    const pkg = await pool.query(
      'SELECT id, name, credits, price FROM credit_packages WHERE id = $1 AND active = true',
      [packageId]
    );
    if (pkg.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const pkgData = pkg.rows[0];
    const receiptId = `cred_${Date.now()}_${req.user.uid.slice(0, 8)}`;

    const order = await razorpay.orders.create({
      amount: parseFloat(pkgData.price) * 100,
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      package: { id: pkgData.id, name: pkgData.name, credits: pkgData.credits }
    });
  } catch (err) {
    const msg = err.error?.description || err.message || 'Unknown error';
    console.error('Credit purchase order error:', msg);
    res.status(500).json({ error: msg });
  }
};

exports.verifyPurchase = async (req, res) => {
  try {
    const { orderId, paymentId, signature, packageId } = req.body;
    const userId = req.user.uid;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const pkg = await pool.query(
      'SELECT id, name, credits FROM credit_packages WHERE id = $1 AND active = true',
      [packageId]
    );
    if (pkg.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const { credits, name } = pkg.rows[0];

    await pool.query(
      `INSERT INTO user_credits (user_id, credits, lifetime_used)
       VALUES ($1, $2, 0)
       ON CONFLICT (user_id) DO UPDATE
       SET credits = user_credits.credits + $2, updated_at = NOW()`,
      [userId, credits]
    );

    const balanceResult = await pool.query(
      'SELECT credits FROM user_credits WHERE user_id = $1',
      [userId]
    );
    const balanceAfter = parseFloat(balanceResult.rows[0].credits);

    const txnId = uuidv4();
    await pool.query(
      `INSERT INTO credit_transactions (user_id, type, credits, balance_after, description, reference_id)
       VALUES ($1, 'purchase', $2, $3, $4, $5)`,
      [userId, credits, balanceAfter, `Purchased ${name} (${credits} credits)`, paymentId]
    );

    res.json({
      success: true,
      message: `${credits} credits added to your account`,
      creditsAdded: credits,
      balance: balanceAfter
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.grantCredits = async (req, res) => {
  try {
    const { email, credits, reason } = req.body;
    if (!email || !credits) {
      return res.status(400).json({ error: 'email and credits required' });
    }

    const userResult = await pool.query('SELECT uid FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].uid;

    await pool.query(
      `INSERT INTO user_credits (user_id, credits, lifetime_used)
       VALUES ($1, $2, 0)
       ON CONFLICT (user_id) DO UPDATE
       SET credits = user_credits.credits + $2, updated_at = NOW()`,
      [userId, credits]
    );

    const balanceResult = await pool.query(
      'SELECT credits FROM user_credits WHERE user_id = $1',
      [userId]
    );
    const balanceAfter = parseFloat(balanceResult.rows[0].credits);

    await pool.query(
      `INSERT INTO credit_transactions (user_id, type, credits, balance_after, description)
       VALUES ($1, 'admin', $2, $3, $4)`,
      [userId, credits, balanceAfter, reason || `Admin grant: ${credits} credits`]
    );

    res.json({ success: true, message: `${credits} credits granted to ${email}`, balance: balanceAfter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};