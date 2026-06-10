const pool = require('../db/pool');

const generateSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

exports.getCategories = async (req, res) => {
  try {
    const { status } = req.query;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`nc.status = $${params.length}`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await pool.query(`
      SELECT nc.*,
        COALESCE((SELECT COUNT(*) FROM note_subcategories ns WHERE ns.category_id = nc.id), 0) AS subcategory_count,
        COALESCE((SELECT COUNT(*) FROM note_pages np WHERE np.category_id = nc.id), 0) AS page_count
      FROM note_categories nc
      ${where}
      ORDER BY nc.sort_order ASC, nc.name ASC
    `, params);

    res.json({ categories: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT nc.*,
        COALESCE((SELECT COUNT(*) FROM note_subcategories ns WHERE ns.category_id = nc.id), 0) AS subcategory_count,
        COALESCE((SELECT COUNT(*) FROM note_pages np WHERE np.category_id = nc.id), 0) AS page_count
      FROM note_categories nc
      WHERE nc.slug = $1
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, icon, thumbnail, status, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const finalSlug = slug || generateSlug(name);
    const result = await pool.query(
      `INSERT INTO note_categories (name, slug, description, icon, thumbnail, status, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, finalSlug, description || '', icon || 'file-text', thumbnail || '', status || 'active', sort_order || 0]
    );

    res.status(201).json({ category: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, thumbnail, status, sort_order } = req.body;

    const result = await pool.query(
      `UPDATE note_categories SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        icon = COALESCE($4, icon),
        thumbnail = COALESCE($5, thumbnail),
        status = COALESCE($6, status),
        sort_order = COALESCE($7, sort_order),
        updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [name, slug, description, icon, thumbnail, status, sort_order, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ category: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM note_categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
