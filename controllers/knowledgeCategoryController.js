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
      conditions.push(`kc.status = $${params.length}`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await pool.query(`
      SELECT kc.*,
        COALESCE((SELECT COUNT(*) FROM knowledge_subcategories ks WHERE ks.category_id = kc.id), 0) AS subcategory_count,
        COALESCE((SELECT COUNT(*) FROM articles a WHERE a.category_id = kc.id), 0) AS article_count
      FROM knowledge_categories kc
      ${where}
      ORDER BY kc.sort_order ASC, kc.name ASC
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
      SELECT kc.*,
        COALESCE((SELECT COUNT(*) FROM knowledge_subcategories ks WHERE ks.category_id = kc.id), 0) AS subcategory_count,
        COALESCE((SELECT COUNT(*) FROM articles a WHERE a.category_id = kc.id), 0) AS article_count
      FROM knowledge_categories kc
      WHERE kc.slug = $1
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
    const { name, slug, description, icon, thumbnail, seo_title, seo_description, status, sort_order } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const finalSlug = slug || generateSlug(name);

    const existing = await pool.query('SELECT id FROM knowledge_categories WHERE slug = $1', [finalSlug]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A category with this slug already exists' });
    }

    const result = await pool.query(
      `INSERT INTO knowledge_categories (name, slug, description, icon, thumbnail, seo_title, seo_description, status, sort_order, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING id`,
      [name, finalSlug, description || '', icon || '', thumbnail || '', seo_title || '', seo_description || '', status || 'active', sort_order || 0]
    );

    res.status(201).json({ message: 'Category created', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, thumbnail, seo_title, seo_description, status, sort_order } = req.body;

    const existing = await pool.query('SELECT * FROM knowledge_categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const finalSlug = slug || generateSlug(name || existing.rows[0].name);

    if (slug) {
      const slugCheck = await pool.query('SELECT id FROM knowledge_categories WHERE slug = $1 AND id != $2', [finalSlug, id]);
      if (slugCheck.rows.length > 0) {
        return res.status(409).json({ error: 'A category with this slug already exists' });
      }
    }

    await pool.query(
      `UPDATE knowledge_categories SET
        name = COALESCE($1, name), slug = COALESCE($2, slug),
        description = COALESCE($3, description), icon = COALESCE($4, icon),
        thumbnail = COALESCE($5, thumbnail), seo_title = COALESCE($6, seo_title),
        seo_description = COALESCE($7, seo_description), status = COALESCE($8, status),
        sort_order = COALESCE($9, sort_order), updated_at = NOW()
       WHERE id = $10`,
      [name, finalSlug, description, icon, thumbnail, seo_title, seo_description, status, sort_order, id]
    );

    res.json({ message: 'Category updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT id FROM knowledge_categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await pool.query('DELETE FROM knowledge_categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategoryTree = async (req, res) => {
  try {
    const categories = await pool.query(`
      SELECT kc.*,
        COALESCE((SELECT COUNT(*) FROM articles a WHERE a.category_id = kc.id), 0) AS article_count
      FROM knowledge_categories kc
      ORDER BY kc.sort_order ASC, kc.name ASC
    `);

    const subcategories = await pool.query(`
      SELECT ks.*,
        COALESCE((SELECT COUNT(*) FROM articles a WHERE a.subcategory_id = ks.id), 0) AS article_count
      FROM knowledge_subcategories ks
      ORDER BY ks.sort_order ASC, ks.name ASC
    `);

    const tree = categories.rows.map(cat => ({
      ...cat,
      subcategories: subcategories.rows.filter(sub => sub.category_id === cat.id)
    }));

    res.json({ categories: tree });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
