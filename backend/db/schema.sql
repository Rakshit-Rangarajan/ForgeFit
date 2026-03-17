-- ForgeFit Database Schema
-- Run order is handled by Docker's initdb

-- ── Extensions ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users (admin-created only, no self-signup) ─────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,  -- bcrypt
  role          VARCHAR(20)  NOT NULL DEFAULT 'user', -- 'admin' | 'user'
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

-- ── User profiles (filled on first login) ──────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name     VARCHAR(100),
  age           INTEGER  CHECK (age >= 10 AND age <= 100),
  sex           VARCHAR(10),   -- 'male' | 'female' | 'other'
  height_cm     NUMERIC(5,1),  -- e.g. 175.5
  weight_kg     NUMERIC(5,1),  -- e.g. 72.0
  goal          VARCHAR(50),   -- see GOALS below
  fitness_level VARCHAR(20) DEFAULT 'beginner', -- 'beginner' | 'intermediate' | 'advanced'
  activity_level VARCHAR(30) DEFAULT 'sedentary',
  -- computed / cached
  bmi           NUMERIC(4,1),
  bmi_category  VARCHAR(20),
  daily_kcal_target INTEGER,
  profile_complete BOOLEAN DEFAULT false,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Body metric logs (weight, BMI over time) ──────────────────
CREATE TABLE IF NOT EXISTS metric_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg   NUMERIC(5,1),
  bmi         NUMERIC(4,1),
  body_fat_pct NUMERIC(4,1),
  waist_cm    NUMERIC(5,1),
  notes       TEXT
);

-- ── Workout session logs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_logs (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_type VARCHAR(50) DEFAULT 'general',
  duration_min INTEGER,
  kcal_burned  INTEGER,
  exercises    JSONB,   -- [{name, sets, reps, done}]
  notes        TEXT
);

-- ── Daily goal logs (water, steps) ────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  water_glasses INTEGER DEFAULT 0,
  steps        INTEGER DEFAULT 0,
  workout_done BOOLEAN DEFAULT false,
  UNIQUE(user_id, log_date)
);

-- ── Alarms ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alarms (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alarm_time   TIME NOT NULL,    -- e.g. '06:30:00'
  alarm_type   VARCHAR(20) NOT NULL,  -- workout | water | breakfast | etc.
  label        TEXT,
  repeat_rule  VARCHAR(20) DEFAULT 'daily',  -- daily | weekdays | weekends | once
  sound        VARCHAR(20) DEFAULT 'beep',
  is_active    BOOLEAN DEFAULT true,
  last_fired   DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Chat history (optional, keeps last 50 per user) ───────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(10) NOT NULL,  -- 'user' | 'assistant'
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_metric_logs_user_date ON metric_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_alarms_user ON alarms(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_date ON chat_messages(user_id, created_at DESC);

-- ── Helper function: compute BMI category ─────────────────────
CREATE OR REPLACE FUNCTION bmi_category(bmi NUMERIC) RETURNS TEXT AS $$
BEGIN
  IF bmi < 18.5 THEN RETURN 'Underweight';
  ELSIF bmi < 25.0 THEN RETURN 'Normal';
  ELSIF bmi < 30.0 THEN RETURN 'Overweight';
  ELSE RETURN 'Obese';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── Auto-update BMI fields when profile weight/height changes ──
CREATE OR REPLACE FUNCTION update_profile_bmi() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.weight_kg IS NOT NULL AND NEW.height_cm IS NOT NULL AND NEW.height_cm > 0 THEN
    NEW.bmi := ROUND((NEW.weight_kg / ((NEW.height_cm/100.0)^2))::NUMERIC, 1);
    NEW.bmi_category := bmi_category(NEW.bmi);
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profile_bmi
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_bmi();

-- ═══════════════════════════════════════════════════════════════
-- ADMIN COMMANDS — use these to create user accounts
-- (copy, fill in values, run in psql or any DB client)
-- ═══════════════════════════════════════════════════════════════
--
-- Create a user (replace values):
--
--   INSERT INTO users (username, email, password_hash, role)
--   VALUES (
--     'rakshit',
--     'rakshitr2000@gmail.com',
--     crypt('YOUR_PASSWORD_HERE', gen_salt('bf')),
--     'admin'
--   );
--
-- Create a regular user:
--
--   INSERT INTO users (username, email, password_hash)
--   VALUES (
--     'john',
--     'john@example.com',
--     crypt('john_password', gen_salt('bf'))
--   );
--
-- Deactivate a user:
--   UPDATE users SET is_active = false WHERE username = 'john';
--
-- Reset a password:
--   UPDATE users SET password_hash = crypt('new_password', gen_salt('bf')) WHERE username = 'john';
--
-- View all users:
--   SELECT id, username, email, role, is_active, last_login FROM users;
