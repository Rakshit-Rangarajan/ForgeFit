const router = require('express').Router();
const pool   = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// Goal options by fitness profile
const GOALS = [
  { value: 'lose_fat',        label: 'Lose Fat & Get Lean' },
  { value: 'visible_abs',     label: 'Get Visible Abs' },
  { value: 'build_muscle',    label: 'Build Muscle Mass' },
  { value: 'recomposition',   label: 'Body Recomposition' },
  { value: 'general_fitness', label: 'General Fitness & Health' },
  { value: 'endurance',       label: 'Improve Endurance & Stamina' },
  { value: 'gain_weight',     label: 'Gain Healthy Weight' },
];

// GET /api/profile  — get current user's profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.username, u.email
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [req.user.id]
    );
    if (!rows[0]) {
      // Return empty profile shell so frontend knows to prompt setup
      return res.json({ profile_complete: false, goals_options: GOALS });
    }
    res.json({ ...rows[0], goals_options: GOALS });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile  — create or update profile
router.put('/', requireAuth, async (req, res) => {
  const { full_name, age, sex, height_cm, weight_kg, goal, activity_level } = req.body;

  if (!full_name || !age || !sex || !height_cm || !weight_kg || !goal) {
    return res.status(400).json({ error: 'All profile fields are required' });
  }

  // Determine fitness level from age + BMI
  const bmi = weight_kg / ((height_cm / 100) ** 2);
  const fitnessLevel = 'beginner'; // default for new users

  // Rough daily kcal targets (Mifflin-St Jeor simplified)
  let bmr;
  if (sex === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }
  const activityMultipliers = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725
  };
  const tdee = Math.round(bmr * (activityMultipliers[activity_level] || 1.2));
  const kcalTarget = goal === 'gain_weight'
    ? tdee + 300
    : goal === 'build_muscle'
    ? tdee + 200
    : tdee - 400; // default: fat loss

  try {
    const { rows } = await pool.query(
      `INSERT INTO profiles
         (user_id, full_name, age, sex, height_cm, weight_kg, goal,
          activity_level, fitness_level, daily_kcal_target, profile_complete)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, true)
       ON CONFLICT (user_id) DO UPDATE SET
         full_name        = EXCLUDED.full_name,
         age              = EXCLUDED.age,
         sex              = EXCLUDED.sex,
         height_cm        = EXCLUDED.height_cm,
         weight_kg        = EXCLUDED.weight_kg,
         goal             = EXCLUDED.goal,
         activity_level   = EXCLUDED.activity_level,
         fitness_level    = EXCLUDED.fitness_level,
         daily_kcal_target= EXCLUDED.daily_kcal_target,
         profile_complete = true,
         updated_at       = NOW()
       RETURNING *`,
      [req.user.id, full_name, age, sex, height_cm, weight_kg,
       goal, activity_level || 'sedentary', fitnessLevel, kcalTarget]
    );

    // Also log initial weight
    await pool.query(
      `INSERT INTO metric_logs (user_id, weight_kg, bmi, notes)
       VALUES ($1, $2, $3, 'Initial profile setup')
       ON CONFLICT DO NOTHING`,
      [req.user.id, weight_kg, parseFloat(bmi.toFixed(1))]
    );

    res.json({ ...rows[0], goals_options: GOALS });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
