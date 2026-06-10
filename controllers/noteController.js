const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

exports.getNotes = async (req, res) => {
  try {
    const user = req.user;
    let query;
    let params;

    if (user && user.role === 'admin') {
      query = 'SELECT * FROM notes ORDER BY created_at DESC';
      params = [];
    } else {
      const uid = user ? user.uid : null;
      query = 'SELECT * FROM notes WHERE is_public = true';
      params = [];
      if (uid) {
        query = 'SELECT * FROM notes WHERE is_public = true OR user_id = $1 ORDER BY created_at DESC';
        params = [uid];
      }
    }

    const result = await pool.query(query, params);
    res.json({ notes: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = result.rows[0];
    const user = req.user;

    if (!note.is_public && (!user || (user.uid !== note.user_id && user.role !== 'admin'))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('UPDATE notes SET view_count = view_count + 1 WHERE id = $1', [id]);
    note.view_count = (note.view_count || 0) + 1;

    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { title, content, category, tags, is_public } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    const id = uuidv4();
    const user_id = req.user.uid;

    await pool.query(
      `INSERT INTO notes (id, user_id, title, content, category, tags, is_public, view_count, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,NOW(),NOW())`,
      [id, user_id, title, content, category || 'general', tags || [], is_public || false]
    );

    res.status(201).json({ message: 'Note created', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, is_public } = req.body;
    const user = req.user;

    const existing = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = existing.rows[0];
    if (note.user_id !== user.uid && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query(
      `UPDATE notes SET
        title = COALESCE($1, title), content = COALESCE($2, content),
        category = COALESCE($3, category), tags = COALESCE($4, tags),
        is_public = COALESCE($5, is_public), updated_at = NOW()
       WHERE id = $6`,
      [title, content, category, tags, is_public, id]
    );

    res.json({ message: 'Note updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const existing = await pool.query('SELECT * FROM notes WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = existing.rows[0];
    if (note.user_id !== user.uid && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPublicNotes = async (req, res) => {
  try {
    const { category, tag } = req.query;
    let query = 'SELECT * FROM notes WHERE is_public = true';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (tag) {
      params.push(tag);
      query += ` AND $${params.length} = ANY(tags)`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json({ notes: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
