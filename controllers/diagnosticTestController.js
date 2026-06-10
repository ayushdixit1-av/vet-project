const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

exports.getTests = async (req, res) => {
  try {
    const { species, status, search } = req.query;
    let query = 'SELECT * FROM diagnostic_tests';
    const params = [];
    const conditions = [];

    if (species) {
      params.push(species);
      conditions.push(`species = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json({ tests: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTestBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query('SELECT * FROM diagnostic_tests WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Diagnostic test not found' });
    }
    res.json({ test: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTest = async (req, res) => {
  try {
    const { name, slug, description, species, sample_type, normal_range, interpretation, cost_estimate, images, references, status } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });

    const id = uuidv4();
    await pool.query(
      `INSERT INTO diagnostic_tests (id, name, slug, description, species, sample_type, normal_range, interpretation, cost_estimate, images, references, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())`,
      [id, name, slug, description || '', species || '', sample_type || '', normal_range || '', interpretation || '', cost_estimate || null, images ? JSON.stringify(images) : '[]', references || '', status || 'draft']
    );
    res.status(201).json({ message: 'Diagnostic test created', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, species, sample_type, normal_range, interpretation, cost_estimate, images, references, status } = req.body;

    const existing = await pool.query('SELECT * FROM diagnostic_tests WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Diagnostic test not found' });
    }

    await pool.query(
      `UPDATE diagnostic_tests SET
        name = COALESCE($1, name), slug = COALESCE($2, slug),
        description = COALESCE($3, description), species = COALESCE($4, species),
        sample_type = COALESCE($5, sample_type), normal_range = COALESCE($6, normal_range),
        interpretation = COALESCE($7, interpretation), cost_estimate = COALESCE($8, cost_estimate),
        images = COALESCE($9::jsonb, images), references = COALESCE($10, references),
        status = COALESCE($11, status), updated_at = NOW()
       WHERE id = $12`,
      [name, slug, description, species, sample_type, normal_range, interpretation, cost_estimate, images ? JSON.stringify(images) : null, references, status, id]
    );
    res.json({ message: 'Diagnostic test updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM diagnostic_tests WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Diagnostic test not found' });
    }
    res.json({ message: 'Diagnostic test deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchTests = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const result = await pool.query(
      `SELECT * FROM diagnostic_tests
       WHERE name ILIKE $1 OR description ILIKE $1 OR species ILIKE $1 OR interpretation ILIKE $1
       ORDER BY name ASC LIMIT 20`,
      [`%${q}%`]
    );
    res.json({ tests: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
