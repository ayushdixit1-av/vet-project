const pool = require('../db/pool');

const generateSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

exports.getPages = async (req, res) => {
  try {
    const { category_id, subcategory_id, status } = req.query;
    const conditions = [];
    const params = [];
    let paramIndex = 0;

    if (category_id) {
      paramIndex++;
      params.push(category_id);
      conditions.push(`np.category_id = $${paramIndex}`);
    }

    if (subcategory_id) {
      paramIndex++;
      params.push(subcategory_id);
      conditions.push(`np.subcategory_id = $${paramIndex}`);
    }

    if (status) {
      paramIndex++;
      params.push(status);
      conditions.push(`np.status = $${paramIndex}`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await pool.query(`
      SELECT np.*, nc.name AS category_name, ns.name AS subcategory_name
      FROM note_pages np
      LEFT JOIN note_categories nc ON nc.id = np.category_id
      LEFT JOIN note_subcategories ns ON ns.id = np.subcategory_id
      ${where}
      ORDER BY np.sort_order ASC, np.title ASC
    `, params);

    res.json({ pages: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPageBySlug = async (req, res) => {
  try {
    const { slug, categorySlug } = req.params;
    const result = await pool.query(`
      SELECT np.*, nc.name AS category_name, ns.name AS subcategory_name
      FROM note_pages np
      JOIN note_categories nc ON nc.id = np.category_id
      LEFT JOIN note_subcategories ns ON ns.id = np.subcategory_id
      WHERE np.slug = $1 AND nc.slug = $2
    `, [slug, categorySlug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const page = result.rows[0];

    await pool.query('UPDATE note_pages SET view_count = view_count + 1 WHERE id = $1', [page.id]);

    res.json({ page });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPageById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT np.*, nc.name AS category_name, ns.name AS subcategory_name
      FROM note_pages np
      LEFT JOIN note_categories nc ON nc.id = np.category_id
      LEFT JOIN note_subcategories ns ON ns.id = np.subcategory_id
      WHERE np.id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Page not found' });
    res.json({ page: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createPage = async (req, res) => {
  try {
    const { category_id, subcategory_id, title, slug, content, html_content, status, sort_order } = req.body;
    if (!category_id || !title) return res.status(400).json({ error: 'category_id and title are required' });

    const finalSlug = slug || generateSlug(title);
    const result = await pool.query(
      `INSERT INTO note_pages (category_id, subcategory_id, title, slug, content, html_content, status, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [category_id, subcategory_id || null, title, finalSlug, content || '', html_content || '', status || 'active', sort_order || 0]
    );

    res.status(201).json({ page: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, subcategory_id, title, slug, content, html_content, status, sort_order } = req.body;

    const result = await pool.query(
      `UPDATE note_pages SET
        category_id = COALESCE($1, category_id),
        subcategory_id = $2,
        title = COALESCE($3, title),
        slug = COALESCE($4, slug),
        content = COALESCE($5, content),
        html_content = COALESCE($6, html_content),
        status = COALESCE($7, status),
        sort_order = COALESCE($8, sort_order),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [category_id, subcategory_id !== undefined ? subcategory_id : null, title, slug, content, html_content, status, sort_order, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Page not found' });
    res.json({ page: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM note_pages WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Page not found' });
    res.json({ message: 'Page deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
