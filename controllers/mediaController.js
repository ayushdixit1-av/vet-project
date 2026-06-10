const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

exports.getMedia = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = 'SELECT * FROM media_library';
    const params = [];
    const conditions = [];

    if (type) {
      if (type === 'image') {
        params.push('image/%');
        conditions.push(`mime_type ILIKE $${params.length}`);
      } else if (type === 'video') {
        params.push('video/%');
        conditions.push(`mime_type ILIKE $${params.length}`);
      } else if (type === 'pdf') {
        params.push('application/pdf');
        conditions.push(`mime_type = $${params.length}`);
      } else if (type === 'document') {
        params.push('application/%');
        conditions.push(`mime_type ILIKE $${params.length}`);
        params.push('application/pdf');
        conditions.push(`mime_type != $${params.length}`);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const countResult = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    res.json({ media: result.rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMediaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM media_library WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json({ media: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadMedia = async (req, res) => {
  try {
    const { filename, original_name, url, thumbnail_url, mime_type, file_size, alt_text, caption } = req.body;
    if (!filename || !url || !mime_type) {
      return res.status(400).json({ error: 'Filename, url, and mime_type are required' });
    }

    const id = uuidv4();
    const uploaded_by = req.user ? req.user.uid : null;

    await pool.query(
      `INSERT INTO media_library (id, filename, original_name, url, thumbnail_url, mime_type, file_size, alt_text, caption, uploaded_by, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      [id, filename, original_name || filename, url, thumbnail_url || '', mime_type, file_size || 0, alt_text || '', caption || '', uploaded_by]
    );

    res.status(201).json({ message: 'Media uploaded', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM media_library WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json({ message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
