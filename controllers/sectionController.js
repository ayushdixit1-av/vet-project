const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

exports.createSection = async (req, res) => {
  try {
    const { courseId, sectionTitle, order, parentId } = req.body;
    if (!courseId || !sectionTitle) {
      return res.status(400).json({ error: 'CourseId and sectionTitle required' });
    }

    const courseCheck = await pool.query('SELECT * FROM courses WHERE course_id = $1', [courseId]);
    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (parentId) {
      const parentCheck = await pool.query('SELECT * FROM sections WHERE section_id = $1 AND course_id = $2', [parentId, courseId]);
      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Parent section not found in this course' });
      }
    }

    const sectionId = uuidv4();
    await pool.query(
      'INSERT INTO sections (section_id, course_id, section_title, "order", parent_id, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [sectionId, courseId, sectionTitle, order || 0, parentId || null]
    );

    res.status(201).json({
      message: 'Section created',
      sectionId,
      section: { sectionId, courseId, sectionTitle, order: order || 0, parentId: parentId || null }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await pool.query(
      'SELECT * FROM sections WHERE course_id = $1 ORDER BY "order" ASC',
      [courseId]
    );

    const sections = result.rows.map(s => ({
      sectionId: s.section_id,
      courseId: s.course_id,
      sectionTitle: s.section_title,
      order: s.order,
      parentId: s.parent_id,
      createdAt: s.created_at
    }));

    res.json({ sections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSectionTree = async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await pool.query(
      'SELECT * FROM sections WHERE course_id = $1 ORDER BY "order" ASC',
      [courseId]
    );

    const sections = result.rows.map(s => ({
      sectionId: s.section_id,
      courseId: s.course_id,
      sectionTitle: s.section_title,
      order: s.order,
      parentId: s.parent_id,
      createdAt: s.created_at
    }));

    const map = {};
    const roots = [];
    sections.forEach(s => {
      map[s.sectionId] = { ...s, subsections: [], contents: [] };
    });
    sections.forEach(s => {
      if (s.parentId && map[s.parentId]) {
        map[s.parentId].subsections.push(map[s.sectionId]);
      } else if (!s.parentId) {
        roots.push(map[s.sectionId]);
      }
    });

    const contentResult = await pool.query(
      'SELECT * FROM contents WHERE section_id = ANY($1::varchar[]) ORDER BY "order" ASC',
      [sections.map(s => s.sectionId)]
    );

    contentResult.rows.forEach(c => {
      if (map[c.section_id]) {
        map[c.section_id].contents.push({
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
        });
      }
    });

    const pdfResult = await pool.query(
      'SELECT * FROM pdfs WHERE section_id = ANY($1::varchar[]) ORDER BY created_at ASC',
      [sections.map(s => s.sectionId)]
    );

    pdfResult.rows.forEach(p => {
      if (map[p.section_id]) {
        map[p.section_id].pdfs = map[p.section_id].pdfs || [];
        map[p.section_id].pdfs.push({
          pdfId: p.pdf_id,
          title: p.title,
          driveLink: p.drive_link,
          createdAt: p.created_at
        });
      }
    });

    res.json({ sections: roots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionTitle, order, parentId } = req.body;
    await pool.query(
      'UPDATE sections SET section_title = COALESCE($1, section_title), "order" = COALESCE($2, "order"), parent_id = COALESCE($3, parent_id) WHERE section_id = $4',
      [sectionTitle, order, parentId, id]
    );
    res.json({ message: 'Section updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM contents WHERE section_id = $1', [id]);
    await pool.query('DELETE FROM contents WHERE section_id IN (SELECT section_id FROM sections WHERE parent_id = $1)', [id]);
    await pool.query('DELETE FROM pdfs WHERE section_id = $1', [id]);
    await pool.query('DELETE FROM pdfs WHERE section_id IN (SELECT section_id FROM sections WHERE parent_id = $1)', [id]);
    await pool.query('DELETE FROM sections WHERE parent_id = $1', [id]);
    await pool.query('DELETE FROM sections WHERE section_id = $1', [id]);
    res.json({ message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
