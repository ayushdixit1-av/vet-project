const pool = require('../db/pool');

exports.getFaqs = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM faqs ORDER BY sort_order ASC, faq_id ASC');
    res.json({ faqs: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createFaq = async (req, res) => {
  try {
    const { question, answer, sort_order } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Question and answer required' });
    const result = await pool.query(
      'INSERT INTO faqs (question, answer, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [question, answer, sort_order || 0]
    );
    res.status(201).json({ message: 'FAQ created', faq: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, sort_order } = req.body;
    await pool.query(
      'UPDATE faqs SET question = COALESCE($1, question), answer = COALESCE($2, answer), sort_order = COALESCE($3, sort_order), updated_at = NOW() WHERE faq_id = $4',
      [question, answer, sort_order, id]
    );
    res.json({ message: 'FAQ updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM faqs WHERE faq_id = $1', [id]);
    res.json({ message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
