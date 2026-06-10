const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

function convertDriveLink(driveUrl) {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/file\/d\/([^/?#&]+)/,
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/open\?id=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?docs\.google\.com\/document\/d\/([^/?#&]+)/
  ];

  for (const pattern of patterns) {
    const match = driveUrl.match(pattern);
    if (match) {
      const fileId = match[1];
      return {
        fileId,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        directUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}`
      };
    }
  }
  return null;
}

exports.getAllPdfs = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pdfs ORDER BY created_at DESC');
    const pdfs = result.rows.map(p => ({
      pdfId: p.pdf_id,
      courseId: p.course_id,
      sectionId: p.section_id,
      title: p.title,
      driveLink: p.drive_link,
      fileId: p.file_id,
      embedUrl: p.embed_url,
      viewCount: p.view_count,
      createdAt: p.created_at
    }));
    res.json({ pdfs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addPdf = async (req, res) => {
  try {
    const { courseId, sectionId, title, driveLink } = req.body;
    if (!courseId || !sectionId || !title || !driveLink) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const converted = convertDriveLink(driveLink);
    if (!converted) {
      return res.status(400).json({ error: 'Invalid Google Drive link' });
    }

    const pdfId = uuidv4();
    await pool.query(
      `INSERT INTO pdfs (pdf_id, course_id, section_id, title, drive_link, file_id, embed_url, thumbnail_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [pdfId, courseId, sectionId, title, driveLink, converted.fileId, converted.embedUrl, converted.thumbnailUrl]
    );

    res.status(201).json({
      message: 'PDF added',
      pdfId,
      pdf: { pdfId, courseId, sectionId, title, driveLink, ...converted }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM pdfs WHERE pdf_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const pdf = result.rows[0];
    const token = uuidv4();
    const expiry = Date.now() + 3600000;

    await pool.query(
      'UPDATE pdfs SET view_count = view_count + 1 WHERE pdf_id = $1',
      [id]
    );

    res.json({
      pdf: {
        pdfId: pdf.pdf_id,
        courseId: pdf.course_id,
        sectionId: pdf.section_id,
        title: pdf.title,
        driveLink: pdf.drive_link,
        fileId: pdf.file_id,
        embedUrl: pdf.embed_url,
        thumbnailUrl: pdf.thumbnail_url,
        viewCount: pdf.view_count + 1,
        createdAt: pdf.created_at
      },
      accessToken: token,
      expiresAt: expiry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPdfsBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const result = await pool.query(
      'SELECT * FROM pdfs WHERE section_id = $1 ORDER BY created_at ASC',
      [sectionId]
    );

    const pdfs = result.rows.map(p => ({
      pdfId: p.pdf_id,
      courseId: p.course_id,
      sectionId: p.section_id,
      title: p.title,
      driveLink: p.drive_link,
      fileId: p.file_id,
      embedUrl: p.embed_url,
      thumbnailUrl: p.thumbnail_url,
      viewCount: p.view_count,
      createdAt: p.created_at
    }));

    res.json({ pdfs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.proxyPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM pdfs WHERE pdf_id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    const pdf = result.rows[0];
    const fileId = pdf.file_id;
    if (!fileId) {
      return res.status(400).json({ error: 'No file ID' });
    }

    const https = require('https');
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

    https.get(url, (driveRes) => {
      if (driveRes.statusCode >= 400) {
        return res.status(502).json({ error: 'Failed to fetch PDF from Google Drive' });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdf.title}.pdf"`);
      driveRes.pipe(res);
    }).on('error', (err) => {
      res.status(502).json({ error: 'Proxy error: ' + err.message });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, driveLink } = req.body;

    let fileId = null, embedUrl = null, thumbnailUrl = null;
    if (driveLink) {
      const converted = convertDriveLink(driveLink);
      if (converted) {
        fileId = converted.fileId;
        embedUrl = converted.embedUrl;
        thumbnailUrl = converted.thumbnailUrl;
      }
    }

    await pool.query(
      `UPDATE pdfs SET title = COALESCE($1, title), drive_link = COALESCE($2, drive_link),
       file_id = COALESCE($3, file_id), embed_url = COALESCE($4, embed_url),
       thumbnail_url = COALESCE($5, thumbnail_url) WHERE pdf_id = $6`,
      [title, driveLink, fileId, embedUrl, thumbnailUrl, id]
    );

    res.json({ message: 'PDF updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePdf = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM pdfs WHERE pdf_id = $1', [id]);
    res.json({ message: 'PDF deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
