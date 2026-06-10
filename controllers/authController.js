const { admin } = require('../firebase/admin');
const { generateToken } = require('../middleware/auth');
const { grantFreeCreditsOnSignup } = require('../middleware/credits');
const pool = require('../db/pool');

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const userRecord = await admin.auth().createUser({ email, password, displayName: name });
    const uid = userRecord.uid;

    const adminEmail = process.env.ADMIN_EMAIL || '';
    const role = email.toLowerCase() === adminEmail.toLowerCase() ? 'admin' : 'user';

    await pool.query(
      'INSERT INTO users (uid, name, email, role, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [uid, name, email, role]
    );

    await grantFreeCreditsOnSignup(uid);

    const token = generateToken(uid);
    res.status(201).json({ token, uid, name, email, role: 'user' });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    const uid = userRecord.uid;

    const adminEmail = process.env.ADMIN_EMAIL || '';
    const role = email.toLowerCase() === adminEmail.toLowerCase() ? 'admin' : 'user';

    const result = await pool.query('SELECT * FROM users WHERE uid = $1', [uid]);
    if (result.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (uid, name, email, role, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [uid, userRecord.displayName || '', email, role]
      );
    } else if (role === 'admin' && result.rows[0].role !== 'admin') {
      await pool.query('UPDATE users SET role = $1 WHERE uid = $2', ['admin', uid]);
    }

    await grantFreeCreditsOnSignup(uid);

    const userData = result.rows[0] || { role, name: userRecord.displayName || '' };
    const token = generateToken(uid);

    res.json({
      token, uid,
      name: userData.name || userRecord.displayName,
      email: userRecord.email,
      role: userData.role
    });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    let uid;
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      uid = userRecord.uid;
    } catch {
      const userRecord = await admin.auth().createUser({ email, displayName: name || '' });
      uid = userRecord.uid;
    }

    const adminEmail = process.env.ADMIN_EMAIL || '';
    const role = email.toLowerCase() === adminEmail.toLowerCase() ? 'admin' : 'user';

    const result = await pool.query('SELECT * FROM users WHERE uid = $1', [uid]);
    if (result.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (uid, name, email, role, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [uid, name || '', email, role]
      );
    } else if (role === 'admin' && result.rows[0].role !== 'admin') {
      await pool.query('UPDATE users SET role = $1 WHERE uid = $2', ['admin', uid]);
    }

    await grantFreeCreditsOnSignup(uid);

    const userData = result.rows[0] || { role, name: name || '' };
    const token = generateToken(uid);

    res.json({ token, uid, name: name || userData.name, email, role: userData.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT uid, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
