const pool = require('../db/pool');

const generateSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

exports.getSubcategories = async (req, res) => {
  try {
    const { category_id } = req.query;
    const params = [];
    let query = `
      SELECT ks.*, kc.name AS category_name
      FROM knowledge_subcategories ks
      JOIN knowledge_categories kc ON ks.category_id = kc.id
    `;

    if (category_id) {
      params.push(category_id);
      query += ` WHERE ks.category_id = $${params.length}`;
    }

    query += ' ORDER BY ks.sort_order ASC, ks.name ASC';

    const result = await pool.query(query, params);
    res.json({ subcategories: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubcategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT ks.*, kc.name AS category_name
      FROM knowledge_subcategories ks
      JOIN knowledge_categories kc ON ks.category_id = kc.id
      WHERE ks.slug = $1
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json({ subcategory: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubcategoriesByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;

    const category = await pool.query('SELECT id FROM knowledge_categories WHERE slug = $1', [categorySlug]);
    if (category.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const result = await pool.query(`
      SELECT ks.*, kc.name AS category_name,
        COALESCE((SELECT COUNT(*) FROM articles a WHERE a.subcategory_id = ks.id), 0) AS article_count
      FROM knowledge_subcategories ks
      JOIN knowledge_categories kc ON ks.category_id = kc.id
      WHERE ks.category_id = $1
      ORDER BY ks.sort_order ASC, ks.name ASC
    `, [category.rows[0].id]);

    res.json({ subcategories: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSubcategory = async (req, res) => {
  try {
    const { category_id, name, slug, description, thumbnail, seo_title, seo_description, status, sort_order } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!category_id) return res.status(400).json({ error: 'category_id is required' });

    const catCheck = await pool.query('SELECT id FROM knowledge_categories WHERE id = $1', [category_id]);
    if (catCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const finalSlug = slug || generateSlug(name);

    const existing = await pool.query('SELECT id FROM knowledge_subcategories WHERE slug = $1 AND category_id = $2', [finalSlug, category_id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A subcategory with this slug already exists in this category' });
    }

    const result = await pool.query(
      `INSERT INTO knowledge_subcategories (category_id, name, slug, description, thumbnail, seo_title, seo_description, status, sort_order, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING id`,
      [category_id, name, finalSlug, description || '', thumbnail || '', seo_title || '', seo_description || '', status || 'active', sort_order || 0]
    );

    res.status(201).json({ message: 'Subcategory created', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, slug, description, thumbnail, seo_title, seo_description, status, sort_order } = req.body;

    const existing = await pool.query('SELECT * FROM knowledge_subcategories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    const finalSlug = slug || generateSlug(name || existing.rows[0].name);
    const finalCategoryId = category_id || existing.rows[0].category_id;

    if (slug) {
      const slugCheck = await pool.query('SELECT id FROM knowledge_subcategories WHERE slug = $1 AND category_id = $2 AND id != $3', [finalSlug, finalCategoryId, id]);
      if (slugCheck.rows.length > 0) {
        return res.status(409).json({ error: 'A subcategory with this slug already exists in this category' });
      }
    }

    await pool.query(
      `UPDATE knowledge_subcategories SET
        category_id = COALESCE($1, category_id), name = COALESCE($2, name),
        slug = COALESCE($3, slug), description = COALESCE($4, description),
        thumbnail = COALESCE($5, thumbnail), seo_title = COALESCE($6, seo_title),
        seo_description = COALESCE($7, seo_description), status = COALESCE($8, status),
        sort_order = COALESCE($9, sort_order), updated_at = NOW()
       WHERE id = $10`,
      [category_id, name, finalSlug, description, thumbnail, seo_title, seo_description, status, sort_order, id]
    );

    res.json({ message: 'Subcategory updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT id FROM knowledge_subcategories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    await pool.query('DELETE FROM knowledge_subcategories WHERE id = $1', [id]);
    res.json({ message: 'Subcategory deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
