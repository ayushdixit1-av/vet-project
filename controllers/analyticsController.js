const pool = require('../db/pool');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      articles, drugs, diseases, breeds, categories, users, courses, procedures
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM articles WHERE status = 'published'`),
      pool.query(`SELECT COUNT(*) FROM medicines`),
      pool.query(`SELECT COUNT(*) FROM diseases`),
      pool.query(`SELECT COUNT(*) FROM breeds`),
      pool.query(`SELECT COUNT(*) FROM categories`),
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM courses`),
      pool.query(`SELECT COUNT(*) FROM procedures`)
    ]);

    res.json({
      total_articles: parseInt(articles.rows[0].count),
      total_drugs: parseInt(drugs.rows[0].count),
      total_diseases: parseInt(diseases.rows[0].count),
      total_breeds: parseInt(breeds.rows[0].count),
      total_categories: parseInt(categories.rows[0].count),
      total_users: parseInt(users.rows[0].count),
      total_courses: parseInt(courses.rows[0].count),
      total_procedures: parseInt(procedures.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMostViewed = async (req, res) => {
  try {
    const [articles, drugs, diseases] = await Promise.all([
      pool.query(`SELECT id, title, slug, view_count FROM articles WHERE status = 'published' ORDER BY view_count DESC NULLS LAST LIMIT 10`),
      pool.query(`SELECT id, name, view_count FROM medicines ORDER BY view_count DESC NULLS LAST LIMIT 10`),
      pool.query(`SELECT id, name, slug, view_count FROM diseases ORDER BY view_count DESC NULLS LAST LIMIT 10`)
    ]);

    res.json({
      articles: articles.rows,
      drugs: drugs.rows,
      diseases: diseases.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const [recentArticles, recentUsers, recentSearches] = await Promise.all([
      pool.query(`SELECT id, title, slug, status, created_at FROM articles ORDER BY created_at DESC LIMIT 10`),
      pool.query(`SELECT uid, display_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10`),
      pool.query(`SELECT query, result_count, searched_at FROM search_logs ORDER BY searched_at DESC LIMIT 10`)
    ]);

    res.json({
      recent_articles: recentArticles.rows,
      recent_users: recentUsers.rows,
      recent_searches: recentSearches.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getContentGrowth = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        to_char(date_trunc('month', m.month), 'YYYY-MM') as month,
        COALESCE(article_counts.cnt, 0) as articles,
        COALESCE(user_counts.cnt, 0) as users
      FROM (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '11 months'),
          date_trunc('month', NOW()),
          '1 month'
        ) as month
      ) m
      LEFT JOIN (
        SELECT date_trunc('month', created_at) as month, COUNT(*) as cnt
        FROM articles WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY date_trunc('month', created_at)
      ) article_counts ON m.month = article_counts.month
      LEFT JOIN (
        SELECT date_trunc('month', created_at) as month, COUNT(*) as cnt
        FROM users WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY date_trunc('month', created_at)
      ) user_counts ON m.month = user_counts.month
      ORDER BY m.month ASC
    `);

    res.json({ growth: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPopularSearches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT query, COUNT(*) as search_count, MAX(searched_at) as last_searched
      FROM search_logs
      GROUP BY query
      ORDER BY search_count DESC
      LIMIT 20
    `);

    res.json({ popular_searches: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
