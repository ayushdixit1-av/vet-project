const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

exports.createTest = async (req, res) => {
  try {
    const { courseId, title, description, durationMinutes, questions } = req.body;
    if (!courseId || !title || !durationMinutes) {
      return res.status(400).json({ error: 'courseId, title, and durationMinutes required' });
    }

    const testId = uuidv4();
    await pool.query(
      `INSERT INTO tests (test_id, course_id, title, description, duration_minutes, total_questions)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testId, courseId, title, description || '', durationMinutes, questions ? questions.length : 0]
    );

    if (questions && questions.length > 0) {
      const qValues = questions.map((q, i) => {
        const qId = uuidv4();
        const base = i * 9;
        return {
          query: `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`,
          params: [qId, testId, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption, q.order || i]
        };
      });

      const flatParams = qValues.flatMap(q => q.params);
      const placeholders = qValues.map(q => q.query).join(', ');

      await pool.query(
        `INSERT INTO test_questions (question_id, test_id, question_text, option_a, option_b, option_c, option_d, correct_option, "order")
         VALUES ${placeholders}`,
        flatParams
      );
    }

    res.status(201).json({ message: 'Test created', testId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTests = async (req, res) => {
  try {
    const { courseId } = req.query;
    let query = 'SELECT * FROM tests';
    const params = [];
    if (courseId) {
      query += ' WHERE course_id = $1';
      params.push(courseId);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json({ tests: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const testResult = await pool.query('SELECT * FROM tests WHERE test_id = $1', [id]);
    if (testResult.rows.length === 0) return res.status(404).json({ error: 'Test not found' });

    const questionsResult = await pool.query(
      'SELECT * FROM test_questions WHERE test_id = $1 ORDER BY "order" ASC',
      [id]
    );

    res.json({ test: testResult.rows[0], questions: questionsResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, durationMinutes, questions } = req.body;

    await pool.query(
      `UPDATE tests SET title = COALESCE($1, title), description = COALESCE($2, description),
       duration_minutes = COALESCE($3, duration_minutes), total_questions = $4
       WHERE test_id = $5`,
      [title, description, durationMinutes, questions ? questions.length : undefined, id]
    );

    if (questions) {
      await pool.query('DELETE FROM test_questions WHERE test_id = $1', [id]);
      if (questions.length > 0) {
        const qValues = questions.map((q, i) => {
          const qId = uuidv4();
          const base = i * 9;
          return {
            query: `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9})`,
            params: [qId, id, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption, q.order || i]
          };
        });
        const flatParams = qValues.flatMap(q => q.params);
        const placeholders = qValues.map(q => q.query).join(', ');
        await pool.query(
          `INSERT INTO test_questions (question_id, test_id, question_text, option_a, option_b, option_c, option_d, correct_option, "order")
           VALUES ${placeholders}`,
          flatParams
        );
      }
    }

    res.json({ message: 'Test updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tests WHERE test_id = $1', [id]);
    res.json({ message: 'Test deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};