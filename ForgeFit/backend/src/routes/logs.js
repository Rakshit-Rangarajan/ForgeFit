const router = require('express').Router();
const pool   = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// ── Metric Logs ──────────────────────────────────────────────

// POST /api/logs/metric
router.post('/metric', requireAuth, async (req, res) => {
  const { weight_kg, bmi, body_fat_pct, waist_cm, notes } = req.body;
  if (!weight_kg && !bmi) return res.status(400).json({ error: 'Provide at least weight or BMI' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO metric_logs (user_id, weight_kg, bmi, body_fat_pct, waist_cm, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, weight_kg||null, bmi||null, body_fat_pct||null, waist_cm||null, notes||null]
    );
    // Update profile weight too
    if (weight_kg) {
      await pool.query(
        'UPDATE profiles SET weight_kg=$1, updated_at=NOW() WHERE user_id=$2',
        [weight_kg, req.user.id]
      );
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/metric?limit=30
router.get('/metric', requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  try {
    const { rows } = await pool.query(
      `SELECT * FROM metric_logs WHERE user_id=$1 ORDER BY logged_at DESC LIMIT $2`,
      [req.user.id, limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Workout Logs ─────────────────────────────────────────────

// POST /api/logs/workout
router.post('/workout', requireAuth, async (req, res) => {
  const { session_type, duration_min, kcal_burned, exercises, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO workout_logs (user_id, session_type, duration_min, kcal_burned, exercises, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, session_type||'general', duration_min||30,
       kcal_burned||185, JSON.stringify(exercises||[]), notes||null]
    );
    // Mark today's daily log as workout done
    await pool.query(
      `INSERT INTO daily_logs (user_id, log_date, workout_done)
       VALUES ($1, CURRENT_DATE, true)
       ON CONFLICT (user_id, log_date)
       DO UPDATE SET workout_done = true`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/workout?limit=20
router.get('/workout', requireAuth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  try {
    const { rows } = await pool.query(
      `SELECT * FROM workout_logs WHERE user_id=$1 ORDER BY logged_at DESC LIMIT $2`,
      [req.user.id, limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Daily Goals ──────────────────────────────────────────────

// GET /api/logs/daily  — today's goals
router.get('/daily', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO daily_logs (user_id, log_date)
       VALUES ($1, CURRENT_DATE)
       ON CONFLICT (user_id, log_date) DO NOTHING;
       SELECT * FROM daily_logs WHERE user_id=$1 AND log_date=CURRENT_DATE`,
      [req.user.id]
    );
    // pg doesn't support multiple statements — fix:
    const r = await pool.query(
      `SELECT * FROM daily_logs WHERE user_id=$1 AND log_date=CURRENT_DATE`,
      [req.user.id]
    );
    if (!r.rows[0]) {
      // upsert
      const ins = await pool.query(
        `INSERT INTO daily_logs (user_id, log_date) VALUES ($1, CURRENT_DATE)
         ON CONFLICT (user_id, log_date) DO UPDATE SET log_date=CURRENT_DATE
         RETURNING *`,
        [req.user.id]
      );
      return res.json(ins.rows[0]);
    }
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/logs/daily  — update today's water/steps
router.patch('/daily', requireAuth, async (req, res) => {
  const { water_glasses, steps, workout_done } = req.body;
  try {
    const sets = [];
    const vals = [req.user.id];
    let i = 2;
    if (water_glasses !== undefined) { sets.push(`water_glasses=$${i++}`); vals.push(water_glasses); }
    if (steps !== undefined)         { sets.push(`steps=$${i++}`); vals.push(steps); }
    if (workout_done !== undefined)  { sets.push(`workout_done=$${i++}`); vals.push(workout_done); }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

    const { rows } = await pool.query(
      `INSERT INTO daily_logs (user_id, log_date, ${Object.keys(req.body).join(', ')})
       VALUES ($1, CURRENT_DATE, ${vals.slice(1).map((_,j)=>`$${j+2}`).join(', ')})
       ON CONFLICT (user_id, log_date) DO UPDATE SET ${sets.join(', ')}
       RETURNING *`,
      vals
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/streak  — consecutive workout days
router.get('/streak', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT log_date FROM daily_logs
       WHERE user_id=$1 AND workout_done=true
       ORDER BY log_date DESC LIMIT 365`,
      [req.user.id]
    );
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < rows.length; i++) {
      const d = new Date(rows[i].log_date); d.setHours(0,0,0,0);
      const expected = new Date(today); expected.setDate(today.getDate() - i);
      if (d.getTime() === expected.getTime()) streak++;
      else break;
    }
    const totalSessions = await pool.query(
      'SELECT COUNT(*) FROM workout_logs WHERE user_id=$1', [req.user.id]
    );
    res.json({ streak, total_sessions: parseInt(totalSessions.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
