const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

exports.getMcqs = async (req, res) => {
  try {
    const { category, subcategory, difficulty, status } = req.query;
    let query = 'SELECT * FROM mcqs';
    const params = [];
    const conditions = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (subcategory) {
      params.push(subcategory);
      conditions.push(`subcategory = $${params.length}`);
    }
    if (difficulty) {
      params.push(difficulty);
      conditions.push(`difficulty = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ mcqs: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMcqById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM mcqs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'MCQ not found' });
    }
    res.json({ mcq: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMcq = async (req, res) => {
  try {
    const { question, options, correct_answer, explanation, category, subcategory, difficulty, article_id, status } = req.body;
    if (!question || !options || !correct_answer) {
      return res.status(400).json({ error: 'Question, options, and correct_answer are required' });
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO mcqs (id, question, options, correct_answer, explanation, category, subcategory, difficulty, article_id, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())`,
      [id, question, JSON.stringify(options), correct_answer, explanation || '', category || '', subcategory || '', difficulty || 'medium', article_id || null, status || 'active']
    );

    res.status(201).json({ message: 'MCQ created', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMcq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, options, correct_answer, explanation, category, subcategory, difficulty, article_id, status } = req.body;

    const existing = await pool.query('SELECT * FROM mcqs WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'MCQ not found' });
    }

    await pool.query(
      `UPDATE mcqs SET
        question = COALESCE($1, question), options = COALESCE($2::jsonb, options),
        correct_answer = COALESCE($3, correct_answer), explanation = COALESCE($4, explanation),
        category = COALESCE($5, category), subcategory = COALESCE($6, subcategory),
        difficulty = COALESCE($7, difficulty), article_id = COALESCE($8, article_id),
        status = COALESCE($9, status), updated_at = NOW()
       WHERE id = $10`,
      [question, options ? JSON.stringify(options) : null, correct_answer, explanation, category, subcategory, difficulty, article_id, status, id]
    );

    res.json({ message: 'MCQ updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMcq = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM mcqs WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'MCQ not found' });
    }
    res.json({ message: 'MCQ deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMcqsByArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const result = await pool.query(
      'SELECT * FROM mcqs WHERE article_id = $1 ORDER BY created_at ASC',
      [articleId]
    );
    res.json({ mcqs: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMcqsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.query(
      'SELECT * FROM mcqs WHERE category = $1 ORDER BY difficulty ASC, created_at DESC',
      [category]
    );
    res.json({ mcqs: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
