const pool = require('../db/pool');

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

exports.getDiseases = async (req, res) => {
  try {
    const { search, species, status, page = 1, limit = 20, sort = 'created_at' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR overview ILIKE $${params.length} OR symptoms ILIKE $${params.length})`);
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

    const countResult = await pool.query(`SELECT COUNT(*) FROM diseases ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT d.*, (SELECT COUNT(*) FROM disease_relations WHERE disease_id = d.id AND related_type = 'article') AS article_count
       FROM diseases d ${where} ORDER BY ${sortCol} DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      diseases: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDiseaseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    await pool.query('UPDATE diseases SET view_count = view_count + 1 WHERE slug = $1', [slug]);
    const result = await pool.query('SELECT * FROM diseases WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Disease not found' });
    }
    res.json({ disease: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRelatedDiseases = async (req, res) => {
  try {
    const { slug } = req.params;
    const disease = await pool.query('SELECT species FROM diseases WHERE slug = $1', [slug]);
    if (disease.rows.length === 0) {
      return res.status(404).json({ error: 'Disease not found' });
    }
    const result = await pool.query(
      'SELECT * FROM diseases WHERE species = $1 AND slug != $2 ORDER BY view_count DESC LIMIT 6',
      [disease.rows[0].species, slug]
    );
    res.json({ diseases: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPopularDiseases = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM diseases ORDER BY view_count DESC LIMIT 6'
    );
    res.json({ diseases: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDisease = async (req, res) => {
  try {
    const { name, overview, symptoms, causes, diagnosis, treatment, prevention, species, images, references, status, seo_title, seo_description, seo_keywords } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    let slug = slugify(name);
    const existing = await pool.query('SELECT id FROM diseases WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      slug = slug + '-' + Date.now();
    }

    const result = await pool.query(
      `INSERT INTO diseases (name, slug, overview, symptoms, causes, diagnosis, treatment, prevention, species, images, references, status, seo_title, seo_description, seo_keywords, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW()) RETURNING id`,
      [name, slug, overview || '', symptoms || '', causes || '', diagnosis || '', treatment || '', prevention || '', species || '', JSON.stringify(images || []), references || '', status || 'draft', seo_title || '', seo_description || '', seo_keywords || '']
    );
    res.status(201).json({ message: 'Disease created', id: result.rows[0].id, slug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDisease = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, overview, symptoms, causes, diagnosis, treatment, prevention, species, images, references, status, seo_title, seo_description, seo_keywords } = req.body;
    await pool.query(
      `UPDATE diseases SET
        name = COALESCE($1, name), overview = COALESCE($2, overview),
        symptoms = COALESCE($3, symptoms), causes = COALESCE($4, causes),
        diagnosis = COALESCE($5, diagnosis), treatment = COALESCE($6, treatment),
        prevention = COALESCE($7, prevention), species = COALESCE($8, species),
        images = COALESCE($9::jsonb, images), references = COALESCE($10, references),
        status = COALESCE($11, status), seo_title = COALESCE($12, seo_title),
        seo_description = COALESCE($13, seo_description), seo_keywords = COALESCE($14, seo_keywords),
        updated_at = NOW()
       WHERE id = $15`,
      [name, overview, symptoms, causes, diagnosis, treatment, prevention, species, images ? JSON.stringify(images) : null, references, status, seo_title, seo_description, seo_keywords, id]
    );
    res.json({ message: 'Disease updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDisease = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM diseases WHERE id = $1', [id]);
    res.json({ message: 'Disease deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchDiseases = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query is required' });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchTerm = `%${q}%`;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM diseases WHERE name ILIKE $1 OR overview ILIKE $1 OR symptoms ILIKE $1',
      [searchTerm]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM diseases WHERE name ILIKE $1 OR overview ILIKE $1 OR symptoms ILIKE $1 ORDER BY view_count DESC LIMIT $2 OFFSET $3',
      [searchTerm, parseInt(limit), offset]
    );

    res.json({
      diseases: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
