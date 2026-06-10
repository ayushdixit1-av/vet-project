const pool = require('../db/pool');

const generateSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

exports.getSubcategories = async (req, res) => {
  try {
    const { category_id, status } = req.query;

    if (!category_id) {
      return res.status(400).json({ error: 'category_id is required' });
    }

    const conditions = ['ns.category_id = $1'];
    const params = [category_id];
    let paramIndex = 1;

    if (status) {
      paramIndex++;
      params.push(status);
      conditions.push(`ns.status = $${paramIndex}`);
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const result = await pool.query(`
      SELECT ns.*,
        COALESCE((SELECT COUNT(*) FROM note_pages np WHERE np.subcategory_id = ns.id), 0) AS page_count
      FROM note_subcategories ns
      ${where}
      ORDER BY ns.sort_order ASC, ns.name ASC
    `, params);

    res.json({ subcategories: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubcategoryBySlug = async (req, res) => {
  try {
    const { slug, categorySlug } = req.params;
    const result = await pool.query(`
      SELECT ns.*,
        COALESCE((SELECT COUNT(*) FROM note_pages np WHERE np.subcategory_id = ns.id), 0) AS page_count
      FROM note_subcategories ns
      JOIN note_categories nc ON nc.id = ns.category_id
      WHERE ns.slug = $1 AND nc.slug = $2
    `, [slug, categorySlug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json({ subcategory: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSubcategory = async (req, res) => {
  try {
    const { category_id, name, slug, description, status, sort_order } = req.body;
    if (!category_id || !name) return res.status(400).json({ error: 'category_id and name are required' });

    const finalSlug = slug || generateSlug(name);
    const result = await pool.query(
      `INSERT INTO note_subcategories (category_id, name, slug, description, status, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [category_id, name, finalSlug, description || '', status || 'active', sort_order || 0]
    );

    res.status(201).json({ subcategory: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, status, sort_order } = req.body;

    const result = await pool.query(
      `UPDATE note_subcategories SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        status = COALESCE($4, status),
        sort_order = COALESCE($5, sort_order),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, slug, description, status, sort_order, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Subcategory not found' });
    res.json({ subcategory: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM note_subcategories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Subcategory not found' });
    res.json({ message: 'Subcategory deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
