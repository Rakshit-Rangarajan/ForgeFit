const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1',
      [username.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Check if profile is complete
    const { rows: profRows } = await pool.query(
      'SELECT profile_complete FROM profiles WHERE user_id = $1',
      [user.id]
    );
    const profileComplete = profRows[0]?.profile_complete || false;

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      profileComplete,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    // Only allow refresh within 60 days of issue
    if (Date.now() / 1000 - decoded.iat > 60 * 24 * 60 * 60) {
      return res.status(401).json({ error: 'Token too old to refresh' });
    }
    const newToken = jwt.sign(
      { id: decoded.id, username: decoded.username, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
