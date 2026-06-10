const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

exports.submitAttempt = async (req, res) => {
  try {
    const { testId, answers } = req.body;
    const userId = req.user.uid || req.user.userId;

    if (!testId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'testId and answers array required' });
    }

    const testResult = await pool.query('SELECT * FROM tests WHERE test_id = $1', [testId]);
    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const questionsResult = await pool.query(
      'SELECT question_id, correct_option FROM test_questions WHERE test_id = $1 ORDER BY "order" ASC',
      [testId]
    );
    const questions = questionsResult.rows;

    let score = 0;
    const gradedAnswers = questions.map((q, i) => {
      const userAnswer = answers[i] || '';
      const isCorrect = userAnswer.toUpperCase() === q.correct_option;
      if (isCorrect) score++;
      return {
        questionId: q.question_id,
        correctOption: q.correct_option,
        userAnswer: userAnswer.toUpperCase(),
        isCorrect
      };
    });

    const attemptId = uuidv4();
    await pool.query(
      `INSERT INTO test_attempts (attempt_id, test_id, user_id, score, total_questions, answers, attempted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [attemptId, testId, userId, score, questions.length, JSON.stringify(gradedAnswers)]
    );

    res.status(201).json({
      attemptId,
      score,
      totalQuestions: questions.length,
      answers: gradedAnswers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserAttempt = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.uid || req.user.userId;

    const result = await pool.query(
      'SELECT * FROM test_attempts WHERE test_id = $1 AND user_id = $2 ORDER BY attempted_at DESC LIMIT 1',
      [testId, userId]
    );

    if (result.rows.length === 0) {
      return res.json({ attempt: null });
    }

    res.json({ attempt: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserResults = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.userId;

    const result = await pool.query(
      `SELECT ta.*, t.title AS test_title, t.course_id, c.title AS course_title
       FROM test_attempts ta
       JOIN tests t ON ta.test_id = t.test_id
       JOIN courses c ON t.course_id = c.course_id
       WHERE ta.user_id = $1
       ORDER BY ta.attempted_at DESC`,
      [userId]
    );

    res.json({ attempts: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllResults = async (req, res) => {
  try {
    const { testId, courseId } = req.query;
    let query = `
      SELECT ta.*, t.title AS test_title, t.course_id, c.title AS course_title, u.name AS user_name, u.email AS user_email
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.test_id
      JOIN courses c ON t.course_id = c.course_id
      JOIN users u ON ta.user_id = u.uid
    `;
    const params = [];
    const conditions = [];

    if (testId) {
      params.push(testId);
      conditions.push(`ta.test_id = $${params.length}`);
    }
    if (courseId) {
      params.push(courseId);
      conditions.push(`t.course_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY ta.attempted_at DESC';

    const result = await pool.query(query, params);
    res.json({ attempts: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};