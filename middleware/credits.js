const pool = require('../db/pool');

const FREE_CREDITS_ON_SIGNUP = 100;
const CREDITS_PER_CHAT = 2;

async function ensureUserCreditsRow(userId) {
  await pool.query(
    `INSERT INTO user_credits (user_id, credits, lifetime_used)
     VALUES ($1, $2, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, FREE_CREDITS_ON_SIGNUP]
  );
}

async function getCredits(userId) {
  await ensureUserCreditsRow(userId);
  const result = await pool.query(
    'SELECT credits FROM user_credits WHERE user_id = $1',
    [userId]
  );
  return parseFloat(result.rows[0]?.credits || 0);
}

async function deductCredits(userId, amount, description, referenceId) {
  const result = await pool.query(
    `UPDATE user_credits
     SET credits = credits - $1,
         lifetime_used = lifetime_used + $1,
         updated_at = NOW()
     WHERE user_id = $2 AND credits >= $1
     RETURNING credits`,
    [amount, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Insufficient credits');
  }

  const balanceAfter = parseFloat(result.rows[0].credits);

  await pool.query(
    `INSERT INTO credit_transactions (user_id, type, credits, balance_after, description, reference_id)
     VALUES ($1, 'usage', $2, $3, $4, $5)`,
    [userId, -amount, balanceAfter, description || 'Chat usage', referenceId || '']
  );

  return balanceAfter;
}

async function checkCredits(req, res, next) {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required to use the AI assistant' });
    }

    const credits = await getCredits(userId);
    if (credits < CREDITS_PER_CHAT) {
      return res.status(403).json({
        error: 'Insufficient credits',
        credits: 0,
        message: 'You have run out of credits. Please purchase a credit pack to continue using the AI assistant.',
        needsPurchase: true
      });
    }

    req.availableCredits = credits;
    next();
  } catch (err) {
    console.error('Credit check error:', err.message);
    res.status(500).json({ error: 'Failed to check credits' });
  }
}

async function grantFreeCreditsOnSignup(userId) {
  await ensureUserCreditsRow(userId);
  const result = await pool.query(
    'SELECT credits FROM user_credits WHERE user_id = $1',
    [userId]
  );
  const current = parseFloat(result.rows[0]?.credits || 0);
  if (current === 0) {
    await pool.query(
      `UPDATE user_credits SET credits = $1, updated_at = NOW() WHERE user_id = $2`,
      [FREE_CREDITS_ON_SIGNUP, userId]
    );
    await pool.query(
      `INSERT INTO credit_transactions (user_id, type, credits, balance_after, description)
       VALUES ($1, 'grant', $2, $2, 'Free credits on signup')`,
      [userId, FREE_CREDITS_ON_SIGNUP]
    );
  }
}

module.exports = { checkCredits, getCredits, deductCredits, grantFreeCreditsOnSignup, CREDITS_PER_CHAT, FREE_CREDITS_ON_SIGNUP };