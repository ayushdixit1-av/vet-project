const pool = require('../db/pool');

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const term = `%${q.trim()}%`;

    const [articles, drugs, diseases, breeds, procedures, vaccines, notes, courses] = await Promise.all([
      pool.query(
        `SELECT id, title, slug, excerpt, 'article' as type FROM articles WHERE status = 'published' AND (title ILIKE $1 OR excerpt ILIKE $1) LIMIT 5`,
        [term]
      ),
      pool.query(
        `SELECT id, name, generic_name, brand_names, 'drug' as type FROM medicines WHERE (name ILIKE $1 OR generic_name ILIKE $1 OR brand_names ILIKE $1) LIMIT 5`,
        [term]
      ),
      pool.query(
        `SELECT id, name, slug, overview, 'disease' as type FROM diseases WHERE (name ILIKE $1 OR overview ILIKE $1 OR symptoms ILIKE $1) LIMIT 5`,
        [term]
      ),
      pool.query(
        `SELECT id, name, slug, characteristics, 'breed' as type FROM breeds WHERE (name ILIKE $1 OR characteristics ILIKE $1) LIMIT 5`,
        [term]
      ),
      pool.query(
        `SELECT id, name, slug, description, 'procedure' as type FROM procedures WHERE (name ILIKE $1 OR description ILIKE $1) LIMIT 5`,
        [term]
      ),
      pool.query(
        `SELECT id, name, slug, description, 'vaccine' as type FROM vaccines WHERE (name ILIKE $1 OR description ILIKE $1) LIMIT 5`,
        [term]
      ),
      pool.query(
        `SELECT id, title, content, category, 'note' as type FROM notes WHERE is_public = true AND (title ILIKE $1 OR content ILIKE $1) LIMIT 5`,
        [term]
      ),
      pool.query(
        `SELECT course_id as id, title, course_id as slug, 'course' as type FROM courses WHERE (title ILIKE $1) LIMIT 5`,
        [term]
      )
    ]);

    const totalCount =
      articles.rows.length + drugs.rows.length + diseases.rows.length +
      breeds.rows.length + procedures.rows.length + vaccines.rows.length +
      notes.rows.length + courses.rows.length;

    const searchTerm = q.trim();
    const user_id = req.user ? req.user.uid : null;
    try {
      await pool.query(
        `INSERT INTO search_logs (query, result_count, user_id, searched_at) VALUES ($1, $2, $3, NOW())`,
        [searchTerm, totalCount, user_id]
      );
    } catch (logErr) {
      // Silently continue if logging fails
    }

    res.json({
      articles: articles.rows,
      drugs: drugs.rows,
      diseases: diseases.rows,
      breeds: breeds.rows,
      procedures: procedures.rows,
      vaccines: vaccines.rows,
      notes: notes.rows,
      courses: courses.rows,
      total: totalCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
