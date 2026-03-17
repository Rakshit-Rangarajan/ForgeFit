const router = require('express').Router();
const pool   = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// GET /api/alarms
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM alarms WHERE user_id=$1 ORDER BY alarm_time', [req.user.id]
  );
  res.json(rows);
});

// POST /api/alarms
router.post('/', requireAuth, async (req, res) => {
  const { alarm_time, alarm_type, label, repeat_rule, sound } = req.body;
  if (!alarm_time || !alarm_type) return res.status(400).json({ error: 'alarm_time and alarm_type required' });
  const { rows } = await pool.query(
    `INSERT INTO alarms (user_id, alarm_time, alarm_type, label, repeat_rule, sound)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, alarm_time, alarm_type, label||null, repeat_rule||'daily', sound||'beep']
  );
  res.json(rows[0]);
});

// PATCH /api/alarms/:id
router.patch('/:id', requireAuth, async (req, res) => {
  const { is_active, last_fired } = req.body;
  const sets = [], vals = [req.params.id, req.user.id]; let i = 3;
  if (is_active !== undefined) { sets.push(`is_active=$${i++}`); vals.push(is_active); }
  if (last_fired !== undefined){ sets.push(`last_fired=$${i++}`); vals.push(last_fired); }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
  const { rows } = await pool.query(
    `UPDATE alarms SET ${sets.join(', ')} WHERE id=$1 AND user_id=$2 RETURNING *`, vals
  );
  res.json(rows[0] || { error: 'Not found' });
});

// DELETE /api/alarms/:id
router.delete('/:id', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM alarms WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
