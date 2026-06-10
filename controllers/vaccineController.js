const pool = require('../db/pool');

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

exports.getVaccines = async (req, res) => {
  try {
    const { search, species, status, page = 1, limit = 20, sort = 'created_at' } = req.query;
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
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const allowedSort = ['created_at', 'name', 'view_count', 'updated_at'];
    const sortCol = allowedSort.includes(sort) ? sort : 'created_at';

    const countResult = await pool.query(`SELECT COUNT(*) FROM vaccines ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM vaccines ${where} ORDER BY ${sortCol} DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      vaccines: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVaccineBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    await pool.query('UPDATE vaccines SET view_count = view_count + 1 WHERE slug = $1', [slug]);
    const result = await pool.query('SELECT * FROM vaccines WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vaccine not found' });
    }
    res.json({ vaccine: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createVaccine = async (req, res) => {
  try {
    const { name, description, species, indications, contraindications, dosage, schedule, route, manufacturer, images, references, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    let slug = slugify(name);
    const existing = await pool.query('SELECT id FROM vaccines WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      slug = slug + '-' + Date.now();
    }

    const result = await pool.query(
      `INSERT INTO vaccines (name, slug, description, species, indications, contraindications, dosage, schedule, route, manufacturer, images, references, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW()) RETURNING id`,
      [name, slug, description || '', species || '', indications || '', contraindications || '', dosage || '', schedule || '', route || '', manufacturer || '', JSON.stringify(images || []), references || '', status || 'draft']
    );
    res.status(201).json({ message: 'Vaccine created', id: result.rows[0].id, slug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateVaccine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, species, indications, contraindications, dosage, schedule, route, manufacturer, images, references, status } = req.body;
    await pool.query(
      `UPDATE vaccines SET
        name = COALESCE($1, name), description = COALESCE($2, description),
        species = COALESCE($3, species), indications = COALESCE($4, indications),
        contraindications = COALESCE($5, contraindications), dosage = COALESCE($6, dosage),
        schedule = COALESCE($7, schedule), route = COALESCE($8, route),
        manufacturer = COALESCE($9, manufacturer),
        images = COALESCE($10::jsonb, images), references = COALESCE($11, references),
        status = COALESCE($12, status), updated_at = NOW()
       WHERE id = $13`,
      [name, description, species, indications, contraindications, dosage, schedule, route, manufacturer, images ? JSON.stringify(images) : null, references, status, id]
    );
    res.json({ message: 'Vaccine updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteVaccine = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM vaccines WHERE id = $1', [id]);
    res.json({ message: 'Vaccine deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchVaccines = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchTerm = `%${q}%`;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM vaccines WHERE name ILIKE $1 OR description ILIKE $1',
      [searchTerm]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM vaccines WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY view_count DESC LIMIT $2 OFFSET $3',
      [searchTerm, parseInt(limit), offset]
    );

    res.json({
      vaccines: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
