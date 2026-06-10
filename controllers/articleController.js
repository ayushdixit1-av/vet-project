const pool = require('../db/pool');

const generateSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

exports.getArticles = async (req, res) => {
  try {
    const { status, category_id, subcategory_id, search, tag, page = 1, limit = 20, sort = 'recent' } = req.query;
    const params = [];
    const conditions = [];
    let paramIndex = 0;

    if (status) {
      paramIndex++;
      params.push(status);
      conditions.push(`a.status = $${paramIndex}`);
    }
    if (category_id) {
      paramIndex++;
      params.push(category_id);
      conditions.push(`a.category_id = $${paramIndex}`);
    }
    if (subcategory_id) {
      paramIndex++;
      params.push(subcategory_id);
      conditions.push(`a.subcategory_id = $${paramIndex}`);
    }
    if (search) {
      paramIndex++;
      params.push(`%${search}%`);
      conditions.push(`(a.title ILIKE $${paramIndex} OR a.excerpt ILIKE $${paramIndex})`);
    }
    if (tag) {
      paramIndex++;
      params.push(`%${tag}%`);
      conditions.push(`a.tags ILIKE $${paramIndex}`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    let orderBy;
    switch (sort) {
      case 'popular':
        orderBy = 'a.view_count DESC';
        break;
      case 'title':
        orderBy = 'a.title ASC';
        break;
      default:
        orderBy = 'a.published_at DESC NULLS LAST, a.created_at DESC';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    paramIndex++;
    params.push(parseInt(limit));
    const limitParam = paramIndex;

    paramIndex++;
    params.push(offset);
    const offsetParam = paramIndex;

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM articles a ${where}
    `, params.slice(0, params.length - 2));

    const result = await pool.query(`
      SELECT a.*, kc.name AS category_name, ks.name AS subcategory_name
      FROM articles a
      LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
      LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
      ${where}
      ORDER BY ${orderBy}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `, params);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      articles: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(`
      SELECT a.*, kc.name AS category_name, kc.slug AS category_slug,
        ks.name AS subcategory_name, ks.slug AS subcategory_slug
      FROM articles a
      LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
      LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
      WHERE a.slug = $1
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await pool.query('UPDATE articles SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1', [result.rows[0].id]);

    const article = result.rows[0];
    article.view_count = (article.view_count || 0) + 1;

    res.json({ article });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRelatedArticles = async (req, res) => {
  try {
    const { slug } = req.params;

    const current = await pool.query('SELECT id, category_id, tags FROM articles WHERE slug = $1', [slug]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const { id, category_id, tags } = current.rows[0];
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const params = [id];
    let tagConditions = '';

    if (tagList.length > 0) {
      tagConditions = tagList.map((_, i) => {
        params.push(`%${tagList[i]}%`);
        return `a.tags ILIKE $${params.length}`;
      }).join(' OR ');
    }

    let query;
    if (category_id && tagConditions) {
      params.push(category_id);
      query = `
        SELECT a.*, kc.name AS category_name, ks.name AS subcategory_name
        FROM articles a
        LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
        LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
        WHERE a.id != $1 AND (a.category_id = $${params.length} OR (${tagConditions}))
        ORDER BY a.published_at DESC NULLS LAST
        LIMIT 6
      `;
    } else if (category_id) {
      params.push(category_id);
      query = `
        SELECT a.*, kc.name AS category_name, ks.name AS subcategory_name
        FROM articles a
        LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
        LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
        WHERE a.id != $1 AND a.category_id = $${params.length}
        ORDER BY a.published_at DESC NULLS LAST
        LIMIT 6
      `;
    } else if (tagConditions) {
      query = `
        SELECT a.*, kc.name AS category_name, ks.name AS subcategory_name
        FROM articles a
        LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
        LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
        WHERE a.id != $1 AND (${tagConditions})
        ORDER BY a.published_at DESC NULLS LAST
        LIMIT 6
      `;
    } else {
      query = `
        SELECT a.*, kc.name AS category_name, ks.name AS subcategory_name
        FROM articles a
        LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
        LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
        WHERE a.id != $1
        ORDER BY a.published_at DESC NULLS LAST
        LIMIT 6
      `;
    }

    const result = await pool.query(query, params);
    res.json({ articles: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFeaturedArticles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, kc.name AS category_name, ks.name AS subcategory_name
      FROM articles a
      LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
      LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
      WHERE a.status = 'published'
      ORDER BY a.view_count DESC NULLS LAST
      LIMIT 6
    `);

    res.json({ articles: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecentArticles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, kc.name AS category_name, ks.name AS subcategory_name
      FROM articles a
      LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
      LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC NULLS LAST
      LIMIT 6
    `);

    res.json({ articles: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const {
      title, slug, excerpt, content, author, category_id, subcategory_id,
      featured_image, tags, reading_time, status, seo_title, seo_description,
      seo_keywords, og_image, canonical_url
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const finalSlug = slug || generateSlug(title);

    const existing = await pool.query('SELECT id FROM articles WHERE slug = $1', [finalSlug]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An article with this slug already exists' });
    }

    const publishedAt = status === 'published' ? 'NOW()' : 'NULL';

    const result = await pool.query(
      `INSERT INTO articles (title, slug, excerpt, content, author, category_id, subcategory_id,
        featured_image, tags, reading_time, status, seo_title, seo_description, seo_keywords,
        og_image, canonical_url, published_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,${publishedAt},NOW(),NOW()) RETURNING id`,
      [title, finalSlug, excerpt || '', content || '{}', author || '', category_id || null, subcategory_id || null,
        featured_image || '', tags || '', reading_time || 0, status || 'draft', seo_title || '',
        seo_description || '', seo_keywords || '', og_image || '', canonical_url || '']
    );

    res.status(201).json({ message: 'Article created', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, slug, excerpt, content, author, category_id, subcategory_id,
      featured_image, tags, reading_time, status, seo_title, seo_description,
      seo_keywords, og_image, canonical_url
    } = req.body;

    const existing = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const finalSlug = slug || generateSlug(title || existing.rows[0].title);

    if (slug) {
      const slugCheck = await pool.query('SELECT id FROM articles WHERE slug = $1 AND id != $2', [finalSlug, id]);
      if (slugCheck.rows.length > 0) {
        return res.status(409).json({ error: 'An article with this slug already exists' });
      }
    }

    const shouldSetPublished = status === 'published' && !existing.rows[0].published_at;

    await pool.query(
      `UPDATE articles SET
        title = COALESCE($1, title), slug = COALESCE($2, slug),
        excerpt = COALESCE($3, excerpt), content = COALESCE($4, content),
        author = COALESCE($5, author), category_id = COALESCE($6, category_id),
        subcategory_id = COALESCE($7, subcategory_id), featured_image = COALESCE($8, featured_image),
        tags = COALESCE($9, tags), reading_time = COALESCE($10, reading_time),
        status = COALESCE($11, status), seo_title = COALESCE($12, seo_title),
        seo_description = COALESCE($13, seo_description), seo_keywords = COALESCE($14, seo_keywords),
        og_image = COALESCE($15, og_image), canonical_url = COALESCE($16, canonical_url),
        published_at = CASE WHEN $17::boolean THEN NOW() ELSE published_at END,
        updated_at = NOW()
       WHERE id = $18`,
      [title, finalSlug, excerpt, content, author, category_id, subcategory_id,
        featured_image, tags, reading_time, status, seo_title, seo_description,
        seo_keywords, og_image, canonical_url, shouldSetPublished, id]
    );

    res.json({ message: 'Article updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT id FROM articles WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await pool.query('DELETE FROM articles WHERE id = $1', [id]);
    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getArticlesByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const category = await pool.query('SELECT id FROM knowledge_categories WHERE slug = $1', [slug]);
    if (category.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await pool.query('SELECT COUNT(*) FROM articles WHERE category_id = $1 AND status = $2', [category.rows[0].id, 'published']);

    const result = await pool.query(`
      SELECT a.*, kc.name AS category_name, ks.name AS subcategory_name
      FROM articles a
      LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
      LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
      WHERE a.category_id = $1 AND a.status = 'published'
      ORDER BY a.published_at DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `, [category.rows[0].id, parseInt(limit), offset]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      articles: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getArticlesBySubcategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const subcategory = await pool.query('SELECT id FROM knowledge_subcategories WHERE slug = $1', [slug]);
    if (subcategory.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await pool.query('SELECT COUNT(*) FROM articles WHERE subcategory_id = $1 AND status = $2', [subcategory.rows[0].id, 'published']);

    const result = await pool.query(`
      SELECT a.*, kc.name AS category_name, ks.name AS subcategory_name
      FROM articles a
      LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
      LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
      WHERE a.subcategory_id = $1 AND a.status = 'published'
      ORDER BY a.published_at DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `, [subcategory.rows[0].id, parseInt(limit), offset]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      articles: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchArticles = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const searchTerm = `%${q}%`;

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM articles
      WHERE status = 'published'
        AND (title ILIKE $1 OR excerpt ILIKE $1 OR content::text ILIKE $1)
    `, [searchTerm]);

    const result = await pool.query(`
      SELECT a.*, kc.name AS category_name, ks.name AS subcategory_name
      FROM articles a
      LEFT JOIN knowledge_categories kc ON a.category_id = kc.id
      LEFT JOIN knowledge_subcategories ks ON a.subcategory_id = ks.id
      WHERE a.status = 'published'
        AND (a.title ILIKE $1 OR a.excerpt ILIKE $1 OR a.content::text ILIKE $1)
      ORDER BY
        CASE WHEN a.title ILIKE $1 THEN 0 ELSE 1 END,
        a.published_at DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `, [searchTerm, parseInt(limit), offset]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      articles: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      query: q
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getArticleCounts = async (req, res) => {
  try {
    const total = await pool.query("SELECT COUNT(*) FROM articles");
    const published = await pool.query("SELECT COUNT(*) FROM articles WHERE status = 'published'");
    const draft = await pool.query("SELECT COUNT(*) FROM articles WHERE status = 'draft'");
    const byCategory = await pool.query(`
      SELECT kc.id, kc.name, kc.slug, COUNT(a.id) AS article_count
      FROM knowledge_categories kc
      LEFT JOIN articles a ON a.category_id = kc.id
      GROUP BY kc.id, kc.name, kc.slug
      ORDER BY article_count DESC
    `);

    res.json({
      total: parseInt(total.rows[0].count),
      published: parseInt(published.rows[0].count),
      draft: parseInt(draft.rows[0].count),
      byCategory: byCategory.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
