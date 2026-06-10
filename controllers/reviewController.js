const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

exports.submitReview = async (req, res) => {
  try {
    const { rating, reviewText, qualification } = req.body;
    const userId = req.user.uid;
    const userName = req.user.name || 'Anonymous';

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) required' });
    }
    if (!reviewText || !reviewText.trim()) {
      return res.status(400).json({ error: 'Review text required' });
    }

    const existing = await pool.query(
      'SELECT * FROM reviews WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE reviews SET rating = $1, review_text = $2, user_name = $3, qualification = COALESCE($4, qualification) WHERE review_id = $5',
        [rating, reviewText.trim(), userName, qualification || '', existing.rows[0].review_id]
      );
      return res.json({ message: 'Review updated' });
    }

    const reviewId = uuidv4();
    await pool.query(
      'INSERT INTO reviews (review_id, user_id, user_name, qualification, rating, review_text, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [reviewId, userId, userName, qualification || '', rating, reviewText.trim()]
    );

    res.status(201).json({ message: 'Review submitted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews ORDER BY created_at DESC'
    );
    const reviews = result.rows.map(r => ({
      reviewId: r.review_id,
      userId: r.user_id,
      userName: r.user_name,
      qualification: r.qualification,
      rating: r.rating,
      reviewText: r.review_text,
      createdAt: r.created_at
    }));
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserReview = async (req, res) => {
  try {
    const userId = req.user.uid;
    const result = await pool.query(
      'SELECT * FROM reviews WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.json({ review: null });
    }
    const r = result.rows[0];
    res.json({
      review: {
        reviewId: r.review_id,
        userId: r.user_id,
        userName: r.user_name,
        qualification: r.qualification,
        rating: r.rating,
        reviewText: r.review_text,
        createdAt: r.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
