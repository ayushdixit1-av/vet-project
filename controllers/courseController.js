const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

exports.createCourse = async (req, res) => {
  try {
    const { title, description, thumbnail, category, price, difficulty } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required' });
    }

    const courseId = uuidv4();
    const isFree = price === 0 || price === '0' || price === null || price === undefined;

    await pool.query(
      `INSERT INTO courses (course_id, title, description, thumbnail, category, price, difficulty, is_free, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [courseId, title, description, thumbnail || '', category || 'general', price || 0, difficulty || 'beginner', isFree]
    );

    const courseData = { courseId, title, description, thumbnail, category, price, difficulty, isFree };
    res.status(201).json({ message: 'Course created', courseId, course: courseData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM courses ORDER BY created_at DESC'
    );
    const courses = result.rows.map(r => ({
      courseId: r.course_id,
      title: r.title,
      description: r.description,
      thumbnail: r.thumbnail,
      category: r.category,
      price: parseFloat(r.price),
      difficulty: r.difficulty,
      isFree: r.is_free,
      sections: [],
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const courseResult = await pool.query('SELECT * FROM courses WHERE course_id = $1', [id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    const sectionsResult = await pool.query(
      'SELECT * FROM sections WHERE course_id = $1 ORDER BY "order" ASC',
      [id]
    );

    const allSections = sectionsResult.rows.map(s => ({
      sectionId: s.section_id,
      courseId: s.course_id,
      sectionTitle: s.section_title,
      order: s.order,
      parentId: s.parent_id,
      createdAt: s.created_at
    }));

    const sectionIds = allSections.map(s => s.sectionId);

    const [pdfsResult, contentsResult, testsResult] = await Promise.all([
      sectionIds.length ? pool.query('SELECT * FROM pdfs WHERE section_id = ANY($1::varchar[]) ORDER BY created_at ASC', [sectionIds]) : { rows: [] },
      sectionIds.length ? pool.query('SELECT * FROM contents WHERE section_id = ANY($1::varchar[]) ORDER BY "order" ASC', [sectionIds]) : { rows: [] },
      pool.query('SELECT * FROM tests WHERE course_id = $1 ORDER BY created_at DESC', [id])
    ]);

    const pdfMap = {};
    pdfsResult.rows.forEach(p => {
      if (!pdfMap[p.section_id]) pdfMap[p.section_id] = [];
      pdfMap[p.section_id].push({
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
      });
    });

    const contentMap = {};
    contentsResult.rows.forEach(c => {
      if (!contentMap[c.section_id]) contentMap[c.section_id] = [];
      contentMap[c.section_id].push({
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
    });

    const sectionMap = {};
    const roots = [];
    allSections.forEach(s => {
      sectionMap[s.sectionId] = { ...s, pdfs: pdfMap[s.sectionId] || [], contents: contentMap[s.sectionId] || [], subsections: [] };
    });
    allSections.forEach(s => {
      if (s.parentId && sectionMap[s.parentId]) {
        sectionMap[s.parentId].subsections.push(sectionMap[s.sectionId]);
      } else if (!s.parentId) {
        roots.push(sectionMap[s.sectionId]);
      }
    });

    res.json({
      course: {
        courseId: course.course_id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        price: parseFloat(course.price),
        difficulty: course.difficulty,
        isFree: course.is_free,
        sections: roots,
        tests: testsResult.rows.map(t => ({
          testId: t.test_id,
          title: t.title,
          description: t.description,
          durationMinutes: t.duration_minutes,
          totalQuestions: t.total_questions,
          createdAt: t.created_at
        })),
        averageRating: 0,
        ratingCount: 0,
        createdAt: course.created_at,
        updatedAt: course.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, thumbnail, category, price, difficulty } = req.body;

    await pool.query(
      `UPDATE courses SET title = COALESCE($1, title), description = COALESCE($2, description),
       thumbnail = COALESCE($3, thumbnail), category = COALESCE($4, category),
       price = COALESCE($5, price), difficulty = COALESCE($6, difficulty),
       is_free = CASE WHEN $5 IS NOT NULL THEN ($5 = 0 OR $5 = '0') ELSE is_free END,
       updated_at = NOW()
       WHERE course_id = $7`,
      [title, description, thumbnail, category, price, difficulty, id]
    );

    res.json({ message: 'Course updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM pdfs WHERE course_id = $1', [id]);
    await pool.query('DELETE FROM sections WHERE course_id = $1', [id]);
    await pool.query('DELETE FROM user_purchases WHERE course_id = $1', [id]);
    await pool.query('DELETE FROM purchases WHERE course_id = $1', [id]);
    await pool.query('DELETE FROM courses WHERE course_id = $1', [id]);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
