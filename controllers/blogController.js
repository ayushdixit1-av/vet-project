const pool = require('../db/pool');

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
}

async function generateUniqueSlug(title, excludeId) {
  let slug = slugify(title);
  let counter = 0;
  let exists = true;
  while (exists) {
    const params = [slug];
    let query = 'SELECT id FROM blogs WHERE slug = $1';
    if (excludeId) {
      params.push(excludeId);
      query += ' AND id != $2';
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      exists = false;
    } else {
      counter++;
      slug = slugify(title) + '-' + counter;
    }
  }
  return slug;
}

async function resolveBlogMentions(text) {
  if (!text) return text;
  const mentions = text.match(/@(\w+)/g);
  if (!mentions) return text;

  const names = [...new Set(mentions.map(m => m.slice(1)))];
  const lowerNames = names.map(n => n.toLowerCase());
  const placeholders = lowerNames.map((_, i) => `$${i + 1}`).join(',');
  const result = await pool.query(
    `SELECT id, title, slug FROM blogs WHERE LOWER(title) IN (${placeholders})`,
    lowerNames
  );

  const map = {};
  result.rows.forEach(r => { map[r.title.toLowerCase()] = r; });

  return text.replace(/@(\w+)/g, (match, name) => {
    const blog = map[name.toLowerCase()];
    return blog
      ? `<a href="/blog/${blog.slug || blog.id}" style="color:var(--accent-primary);text-decoration:underline;">${blog.title}</a>`
      : match;
  });
}

exports.createBlog = async (req, res) => {
  try {
    const { title, slug, thumbnail, description, content, author, category, tags, status, meta_title, meta_description } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const finalSlug = slug && slug.trim() ? slugify(slug) : await generateUniqueSlug(title);

    const result = await pool.query(
      `INSERT INTO blogs (title, slug, thumbnail, description, content, author, category, tags, status, meta_title, meta_description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING id, slug`,
      [title, finalSlug, thumbnail || '', description || '', content || '', author || 'VetCrack', category || '', tags || '', status || 'draft', meta_title || '', meta_description || '']
    );

    res.status(201).json({ message: 'Blog created', id: result.rows[0].id, slug: result.rows[0].slug });
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return res.status(409).json({ error: 'Slug already exists, please use a different slug' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const { status, tag, category } = req.query;
    let query = 'SELECT * FROM blogs';
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (tag) {
      params.push(`%${tag}%`);
      conditions.push(`tags ILIKE $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    const blogs = [];
    for (const row of result.rows) {
      blogs.push({
        ...row,
        description: await resolveBlogMentions(row.description),
        content: await resolveBlogMentions(row.content)
      });
    }
    res.json({ blogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM blogs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    const blog = result.rows[0];
    blog.description = await resolveBlogMentions(blog.description);
    blog.content = await resolveBlogMentions(blog.content);
    res.json({ blog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    // if slug is numeric, also try looking up by id for backwards compat
    const isNumeric = /^\d+$/.test(slug);
    let result;
    if (isNumeric) {
      result = await pool.query('SELECT * FROM blogs WHERE slug = $1 OR id = $2', [slug, parseInt(slug)]);
    } else {
      result = await pool.query('SELECT * FROM blogs WHERE slug = $1', [slug]);
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    const blog = result.rows[0];
    blog.description = await resolveBlogMentions(blog.description);
    blog.content = await resolveBlogMentions(blog.content);
    res.json({ blog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, thumbnail, description, content, author, category, tags, status, meta_title, meta_description } = req.body;
    let finalSlug;
    if (slug && slug.trim()) {
      finalSlug = slugify(slug);
    } else if (title) {
      finalSlug = await generateUniqueSlug(title, id);
    }
    await pool.query(
      `UPDATE blogs SET
        title = COALESCE($1, title), slug = COALESCE($2, slug),
        thumbnail = COALESCE($3, thumbnail), description = COALESCE($4, description),
        content = COALESCE($5, content), author = COALESCE($6, author),
        category = COALESCE($7, category), tags = COALESCE($8, tags),
        status = COALESCE($9, status), meta_title = COALESCE($10, meta_title),
        meta_description = COALESCE($11, meta_description), updated_at = NOW()
       WHERE id = $12`,
      [title, finalSlug, thumbnail, description, content, author, category, tags, status, meta_title, meta_description, id]
    );
    res.json({ message: 'Blog updated' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM blogs WHERE id = $1', [id]);
    res.json({ message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
