const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

exports.addContent = async (req, res) => {
  try {
    const { sectionId, title, type, driveLink, embedUrl, order } = req.body;
    if (!sectionId || !title || !type) {
      return res.status(400).json({ error: 'sectionId, title, and type required' });
    }
    if (!['video', 'pdf', 'embed'].includes(type)) {
      return res.status(400).json({ error: 'type must be video, pdf, or embed' });
    }

    const sectionCheck = await pool.query('SELECT * FROM sections WHERE section_id = $1', [sectionId]);
    if (sectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' });
    }

    const contentId = uuidv4();
    let fileUrl = '';
    let fileId = '';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    if (driveLink) {
      const match = driveLink.match(/(?:file\/d\/|id=)([a-zA-Z0-9_-]+)/);
      fileId = match ? match[1] : '';
    }

    await pool.query(
      `INSERT INTO contents (content_id, section_id, title, type, file_url, drive_link, file_id, embed_url, "order", created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [contentId, sectionId, title, type, fileUrl, driveLink || '', fileId, embedUrl || '', order || 0]
    );

    res.status(201).json({
      message: 'Content added',
      contentId,
      content: { contentId, sectionId, title, type, fileUrl, driveLink, fileId, embedUrl, order: order || 0 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getContents = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const result = await pool.query(
      'SELECT * FROM contents WHERE section_id = $1 ORDER BY "order" ASC',
      [sectionId]
    );
    const contents = result.rows.map(c => ({
      contentId: c.content_id,
      sectionId: c.section_id,
      title: c.title,
      type: c.type,
      fileUrl: c.file_url,
      driveLink: c.drive_link,
      fileId: c.file_id,
      embedUrl: c.embed_url,
      order: c.order,
      createdAt: c.created_at
    }));
    res.json({ contents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, driveLink, embedUrl, order } = req.body;
    await pool.query(
      `UPDATE contents SET title = COALESCE($1, title), drive_link = COALESCE($2, drive_link),
       embed_url = COALESCE($3, embed_url), "order" = COALESCE($4, "order") WHERE content_id = $5`,
      [title, driveLink, embedUrl, order, id]
    );
    res.json({ message: 'Content updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM contents WHERE content_id = $1', [id]);
    res.json({ message: 'Content deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
