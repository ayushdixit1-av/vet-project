const pool = require('../db/pool');

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

exports.getProcedures = async (req, res) => {
  try {
    const { search, species, category, status, page = 1, limit = 20, sort = 'created_at' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    if (species) {
      params.push(species);
      conditions.push(`species ILIKE $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const allowedSort = ['created_at', 'name', 'view_count', 'updated_at'];
    const sortCol = allowedSort.includes(sort) ? sort : 'created_at';

    const countResult = await pool.query(`SELECT COUNT(*) FROM procedures ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM procedures ${where} ORDER BY ${sortCol} DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      procedures: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProcedureBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    await pool.query('UPDATE procedures SET view_count = view_count + 1 WHERE slug = $1', [slug]);
    const result = await pool.query('SELECT * FROM procedures WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Procedure not found' });
    }
    res.json({ procedure: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProcedure = async (req, res) => {
  try {
    const { name, description, indications, contraindications, preparation, technique, aftercare, complications, species, category, images, references, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    let slug = slugify(name);
    const existing = await pool.query('SELECT id FROM procedures WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      slug = slug + '-' + Date.now();
    }

    const result = await pool.query(
      `INSERT INTO procedures (name, slug, description, indications, contraindications, preparation, technique, aftercare, complications, species, category, images, references, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW()) RETURNING id`,
      [name, slug, description || '', indications || '', contraindications || '', preparation || '', technique || '', aftercare || '', complications || '', species || '', category || '', JSON.stringify(images || []), references || '', status || 'draft']
    );
    res.status(201).json({ message: 'Procedure created', id: result.rows[0].id, slug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProcedure = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, indications, contraindications, preparation, technique, aftercare, complications, species, category, images, references, status } = req.body;
    await pool.query(
      `UPDATE procedures SET
        name = COALESCE($1, name), description = COALESCE($2, description),
        indications = COALESCE($3, indications), contraindications = COALESCE($4, contraindications),
        preparation = COALESCE($5, preparation), technique = COALESCE($6, technique),
        aftercare = COALESCE($7, aftercare), complications = COALESCE($8, complications),
        species = COALESCE($9, species), category = COALESCE($10, category),
        images = COALESCE($11::jsonb, images), references = COALESCE($12, references),
        status = COALESCE($13, status), updated_at = NOW()
       WHERE id = $14`,
      [name, description, indications, contraindications, preparation, technique, aftercare, complications, species, category, images ? JSON.stringify(images) : null, references, status, id]
    );
    res.json({ message: 'Procedure updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProcedure = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM procedures WHERE id = $1', [id]);
    res.json({ message: 'Procedure deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchProcedures = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchTerm = `%${q}%`;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM procedures WHERE name ILIKE $1 OR description ILIKE $1',
      [searchTerm]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM procedures WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY view_count DESC LIMIT $2 OFFSET $3',
      [searchTerm, parseInt(limit), offset]
    );

    res.json({
      procedures: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
