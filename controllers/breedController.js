const pool = require('../db/pool');

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

exports.getBreeds = async (req, res) => {
  try {
    const { search, species, status, page = 1, limit = 20, sort = 'created_at' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR characteristics ILIKE $${params.length})`);
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

    const countResult = await pool.query(`SELECT COUNT(*) FROM breeds ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM breeds ${where} ORDER BY ${sortCol} DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      breeds: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBreedBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    await pool.query('UPDATE breeds SET view_count = view_count + 1 WHERE slug = $1', [slug]);
    const result = await pool.query('SELECT * FROM breeds WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Breed not found' });
    }
    res.json({ breed: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBreed = async (req, res) => {
  try {
    const { name, species, origin, characteristics, weight_range, height_range, lifespan, milk_yield, management, common_diseases, images, references, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    let slug = slugify(name);
    const existing = await pool.query('SELECT id FROM breeds WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      slug = slug + '-' + Date.now();
    }

    const result = await pool.query(
      `INSERT INTO breeds (name, slug, species, origin, characteristics, weight_range, height_range, lifespan, milk_yield, management, common_diseases, images, references, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW()) RETURNING id`,
      [name, slug, species || '', origin || '', characteristics || '', weight_range || '', height_range || '', lifespan || '', milk_yield || '', management || '', common_diseases || '', JSON.stringify(images || []), references || '', status || 'draft']
    );
    res.status(201).json({ message: 'Breed created', id: result.rows[0].id, slug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBreed = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, species, origin, characteristics, weight_range, height_range, lifespan, milk_yield, management, common_diseases, images, references, status } = req.body;
    await pool.query(
      `UPDATE breeds SET
        name = COALESCE($1, name), species = COALESCE($2, species),
        origin = COALESCE($3, origin), characteristics = COALESCE($4, characteristics),
        weight_range = COALESCE($5, weight_range), height_range = COALESCE($6, height_range),
        lifespan = COALESCE($7, lifespan), milk_yield = COALESCE($8, milk_yield),
        management = COALESCE($9, management), common_diseases = COALESCE($10, common_diseases),
        images = COALESCE($11::jsonb, images), references = COALESCE($12, references),
        status = COALESCE($13, status), updated_at = NOW()
       WHERE id = $14`,
      [name, species, origin, characteristics, weight_range, height_range, lifespan, milk_yield, management, common_diseases, images ? JSON.stringify(images) : null, references, status, id]
    );
    res.json({ message: 'Breed updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBreed = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM breeds WHERE id = $1', [id]);
    res.json({ message: 'Breed deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchBreeds = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchTerm = `%${q}%`;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM breeds WHERE name ILIKE $1 OR characteristics ILIKE $1',
      [searchTerm]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM breeds WHERE name ILIKE $1 OR characteristics ILIKE $1 ORDER BY view_count DESC LIMIT $2 OFFSET $3',
      [searchTerm, parseInt(limit), offset]
    );

    res.json({
      breeds: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
