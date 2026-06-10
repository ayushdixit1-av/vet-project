const pool = require('../db/pool');

exports.getSitemap = async (req, res) => {
  try {
    const BASE_URL = process.env.FRONTEND_URL || 'https://vetcrack.com';

    const [articles, drugs, diseases, breeds, procedures, vaccines, categories, subcategories] = await Promise.all([
      pool.query(`SELECT slug, updated_at FROM articles WHERE status = 'published' ORDER BY updated_at DESC`),
      pool.query(`SELECT id, name FROM medicines ORDER BY name ASC`),
      pool.query(`SELECT slug, name FROM diseases ORDER BY name ASC`),
      pool.query(`SELECT slug, name FROM breeds ORDER BY name ASC`),
      pool.query(`SELECT slug, name FROM procedures ORDER BY name ASC`),
      pool.query(`SELECT slug, name FROM vaccines ORDER BY name ASC`),
      pool.query(`SELECT slug, name FROM knowledge_categories ORDER BY name ASC`),
      pool.query(`SELECT DISTINCT slug, name FROM knowledge_subcategories ORDER BY name ASC`)
    ]);

    const urlTags = [];

    urlTags.push(`
  <url>
    <loc>${BASE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

    articles.rows.forEach(a => {
      urlTags.push(`
  <url>
    <loc>${BASE_URL}/article/${a.slug}</loc>
    <lastmod>${a.updated_at ? new Date(a.updated_at).toISOString() : ''}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
    });

    drugs.rows.forEach(d => {
      urlTags.push(`
  <url>
    <loc>${BASE_URL}/drugs/${d.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    });

    diseases.rows.forEach(d => {
      urlTags.push(`
  <url>
    <loc>${BASE_URL}/diseases/${d.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
    });

    breeds.rows.forEach(b => {
      urlTags.push(`
  <url>
    <loc>${BASE_URL}/breeds/${b.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    });

    procedures.rows.forEach(p => {
      urlTags.push(`
  <url>
    <loc>${BASE_URL}/procedures/${p.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    });

    vaccines.rows.forEach(v => {
      urlTags.push(`
  <url>
    <loc>${BASE_URL}/vaccines/${v.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
    });

    categories.rows.forEach(c => {
      urlTags.push(`
  <url>
    <loc>${BASE_URL}/knowledge/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);
    });

    subcategories.rows.forEach(s => {
      urlTags.push(`
  <url>
    <loc>${BASE_URL}/knowledge/${s.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlTags.join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRobotsTxt = async (req, res) => {
  try {
    const BASE_URL = process.env.FRONTEND_URL || 'https://vetcrack.com';

    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /auth/

Sitemap: ${BASE_URL}/api/seo/sitemap.xml
`;

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBreadcrumbs = async (req, res) => {
  try {
    const { type, slug } = req.query;
    if (!type || !slug) {
      return res.status(400).json({ error: 'type and slug query parameters are required' });
    }

    const BASE_URL = process.env.FRONTEND_URL || 'https://vetcrack.com';
    let item;
    let breadcrumbs = [];

    switch (type) {
      case 'article': {
        const result = await pool.query('SELECT title, slug FROM articles WHERE slug = $1 AND status = $2', [slug, 'published']);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Article not found' });
        item = result.rows[0];
        breadcrumbs = [
          { name: 'Home', url: BASE_URL },
          { name: 'Articles', url: `${BASE_URL}/article` },
          { name: item.title, url: `${BASE_URL}/article/${item.slug}` }
        ];
        break;
      }
      case 'drug': {
        const result = await pool.query('SELECT name FROM medicines WHERE id = $1', [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Drug not found' });
        item = result.rows[0];
        breadcrumbs = [
          { name: 'Home', url: BASE_URL },
          { name: 'Drugs', url: `${BASE_URL}/drugs` },
          { name: item.name, url: `${BASE_URL}/drugs/${slug}` }
        ];
        break;
      }
      case 'disease': {
        const result = await pool.query('SELECT name, slug FROM diseases WHERE slug = $1', [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Disease not found' });
        item = result.rows[0];
        breadcrumbs = [
          { name: 'Home', url: BASE_URL },
          { name: 'Diseases', url: `${BASE_URL}/diseases` },
          { name: item.name, url: `${BASE_URL}/diseases/${item.slug}` }
        ];
        break;
      }
      case 'breed': {
        const result = await pool.query('SELECT name, slug FROM breeds WHERE slug = $1', [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Breed not found' });
        item = result.rows[0];
        breadcrumbs = [
          { name: 'Home', url: BASE_URL },
          { name: 'Breeds', url: `${BASE_URL}/breeds` },
          { name: item.name, url: `${BASE_URL}/breeds/${item.slug}` }
        ];
        break;
      }
      case 'procedure': {
        const result = await pool.query('SELECT name, slug FROM procedures WHERE slug = $1', [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Procedure not found' });
        item = result.rows[0];
        breadcrumbs = [
          { name: 'Home', url: BASE_URL },
          { name: 'Procedures', url: `${BASE_URL}/procedures` },
          { name: item.name, url: `${BASE_URL}/procedures/${item.slug}` }
        ];
        break;
      }
      case 'category': {
        const result = await pool.query('SELECT name, slug FROM knowledge_categories WHERE slug = $1', [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
        item = result.rows[0];
        breadcrumbs = [
          { name: 'Home', url: BASE_URL },
          { name: 'Categories', url: `${BASE_URL}/categories` },
          { name: item.name, url: `${BASE_URL}/categories/${item.slug}` }
        ];
        break;
      }
      case 'subcategory': {
        const result = await pool.query('SELECT name, slug FROM knowledge_subcategories WHERE slug = $1', [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Subcategory not found' });
        item = result.rows[0];
        breadcrumbs = [
          { name: 'Home', url: BASE_URL },
          { name: 'Subcategories', url: `${BASE_URL}/subcategories` },
          { name: item.name, url: `${BASE_URL}/subcategories/${item.slug}` }
        ];
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid type. Must be one of: article, drug, disease, breed, procedure, category, subcategory' });
    }

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: b.url
      }))
    };

    res.json(breadcrumbSchema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateArticleSchema = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      `SELECT a.*, a.author as author_name
       FROM articles a
       WHERE a.slug = $1 AND a.status = 'published'`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = result.rows[0];
    const BASE_URL = process.env.FRONTEND_URL || 'https://vetcrack.com';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt || article.meta_description || '',
      image: article.featured_image || '',
      datePublished: article.created_at ? new Date(article.created_at).toISOString() : '',
      dateModified: article.updated_at ? new Date(article.updated_at).toISOString() : '',
      author: {
        '@type': 'Person',
        name: article.author_name || 'VetCrack'
      },
      publisher: {
        '@type': 'Organization',
        name: 'VetCrack',
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/logo.png`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/article/${article.slug}`
      }
    };

    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
