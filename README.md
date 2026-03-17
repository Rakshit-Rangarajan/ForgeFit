<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:000000,100:e8002d&text=ForgeFit%20%F0%9F%94%A5&section=header&fontColor=ffffff&fontAlign=50&fontAlignY=38&animation=scaleIn&fontSize=52&stroke=000000&strokeWidth=1.5" />

<br/>

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-forgefit.rakshitr.co.in-e8002d?style=for-the-badge)](https://forgefit.rakshitr.co.in)
[![App](https://img.shields.io/badge/📱%20App-forgefit.rakshitr.co.in/app-000000?style=for-the-badge)](https://forgefit.rakshitr.co.in/app)
[![Portfolio](https://img.shields.io/badge/👤%20Portfolio-rakshitr.co.in-333333?style=for-the-badge)](https://www.rakshitr.co.in)
[![Wear OS](https://img.shields.io/badge/⌚%20Wear_OS-/app/?watch=1-4285F4?style=for-the-badge)](https://forgefit.rakshitr.co.in/app/?watch=1)

<br/>

> **A private full-stack AI fitness app — PostgreSQL backend, JWT auth, free Claude AI via Puter.js, Wear OS support, and a polished public demo landing page.**

<br/>

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Puter.js](https://img.shields.io/badge/Puter.js-Free_AI-22c55e?style=flat-square)
![Claude AI](https://img.shields.io/badge/Claude_Sonnet-CC785C?style=flat-square&logo=anthropic&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

</div>

---

## 📖 Overview

<div align="justify">

ForgeFit is a private full-stack personal fitness web app for complete beginners targeting visible abs and a healthy lifestyle. It has a Node.js + PostgreSQL backend with JWT authentication, **free Claude AI coaching via Puter.js** (no API key, no billing), Samsung Health data import, a Wear OS watch layout, and a full alarm/reminder system.

The public landing page (`/`) showcases the app as a portfolio project. The actual app lives at `/app/` — private, login-required, with AI features unlocking via a free Puter account during onboarding.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Private Accounts** | No public signup. Admin creates users directly via SQL. JWT tokens, 30-day sessions. |
| 🌐 **Public Landing Page** | Polished demo/portfolio page at `/` — showcases features, phone mockup, tech stack, CTAs. |
| 👤 **Smart Onboarding** | First-login profile setup with BMI-based goal recommendations. Puter sign-in during onboarding for immediate AI access. |
| 🤖 **AI Coach (Free)** | Claude Sonnet via Puter.js — completely free, no API key. Knows your BMI, goal, fitness level, and Indian dietary context. |
| 📊 **Health Report Analysis** | Upload MovingLife/HealthSense screenshot — AI reads it via Puter vision, extracts metrics, builds 5-point action plan. |
| 📈 **Progress Tracking** | PostgreSQL-backed weight, BMI, and session logs with live Chart.js graphs. Synced across all devices. |
| 🏋️ **Goal-Aware Workouts** | Exercise list adapts to your goal (fat loss, abs, muscle, recomposition). AI generates custom session plans. |
| 📱 **Samsung Health Import** | Export JSON from Samsung Health, import weight and step data directly. |
| ⌚ **Wear OS Layout** | Minimal watch UI at `?watch=1` — streak, water, steps, BMI, next alarm, quick-log buttons. |
| 🔔 **Smart Alarms** | Time-based reminders with Web Audio API sounds, browser notifications, haptic vibration, and snooze. Synced to DB. |
| 💧 **Water Reminder** | Daily glass tracking, progress rings, goal logging. |

---

## 🏗️ Architecture

```
forgefit.rakshitr.co.in
        │
        ├── /              → Landing page (public portfolio demo)
        ├── /app/          → PWA app (login required)
        └── /api/          → Express REST API (JWT protected)
                │
                ├── PostgreSQL (auth, profiles, logs, alarms)
                └── AI: Puter.js client-side → Claude Sonnet (FREE)

┌─────────────────────────────────────────────────┐
│              Docker on your server               │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  Nginx   │  │  Node.js API │  │ Postgres │  │
│  │ :80/:443 │→ │    :3001     │→ │  :5432   │  │
│  └──────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────┘
         ↕ HTTPS
┌─────────────┐   ┌──────────────┐   ┌──────────┐
│ Android PWA │   │  Desktop     │   │ Wear OS  │
│   /app/     │   │ phone shell  │   │ ?watch=1 │
└─────────────┘   └──────────────┘   └──────────┘
```

---

## 🚀 Deployment

### Prerequisites

- Docker + Docker Compose installed on your server
- Domain pointing to your server (`forgefit.rakshitr.co.in`)
- SSL certificate (Let's Encrypt recommended)
- A free [Puter account](https://puter.com) for AI features (no billing ever)

---

### 1 · Clone & Configure

```bash
git clone https://github.com/yourusername/forgefit.git
cd forgefit
cp .env.example .env
nano .env
```

Your `.env` needs only **two secrets**:

```env
DB_PASSWORD=your_strong_database_password
JWT_SECRET=64_char_hex_string
FRONTEND_URL=https://forgefit.rakshitr.co.in
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **No Anthropic API key needed.** AI is handled client-side via Puter.js for free.

---

### 2 · SSL Certificates

```bash
mkdir nginx/certs

# Using Certbot (Let's Encrypt):
certbot certonly --standalone -d forgefit.rakshitr.co.in

cp /etc/letsencrypt/live/forgefit.rakshitr.co.in/fullchain.pem nginx/certs/
cp /etc/letsencrypt/live/forgefit.rakshitr.co.in/privkey.pem nginx/certs/
```

---

### 3 · Launch Everything

```bash
docker-compose up -d --build

# Verify all 3 services are healthy
docker-compose ps

# Stream logs
docker-compose logs -f api
```

---

### 4 · Create Your First User Account

```bash
# Connect to the database
docker exec -it forgefit_db psql -U forgefit_user -d forgefit
```

```sql
-- Create your admin account
INSERT INTO users (username, email, password_hash, role)
VALUES (
  'rakshit',
  'rakshitr2000@gmail.com',
  crypt('your_secure_password', gen_salt('bf')),
  'admin'
);

-- Create a regular user for someone else
INSERT INTO users (username, email, password_hash)
VALUES (
  'friend',
  'friend@example.com',
  crypt('their_password', gen_salt('bf'))
);

-- Verify accounts
SELECT id, username, email, role, is_active FROM users;
```

Other useful SQL commands:
```sql
-- Deactivate a user
UPDATE users SET is_active = false WHERE username = 'friend';

-- Reset a password
UPDATE users SET password_hash = crypt('new_password', gen_salt('bf'))
WHERE username = 'friend';

-- View all activity
SELECT u.username, p.goal, p.bmi, COUNT(w.id) AS sessions
FROM users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN workout_logs w ON w.user_id = u.id
GROUP BY u.username, p.goal, p.bmi;
```

---

### 5 · First Login Flow

```
1. Visit https://forgefit.rakshitr.co.in/app/
2. Log in with your credentials
3. Profile setup screen appears (first login only):
   • Enter name, age, sex, height, weight, activity level
   • App shows BMI-based goal recommendations
   • Select your goal
   • Tap "START MY JOURNEY" → Puter sign-in popup appears
   • Sign in / create free Puter account
   • AI features are now active — free forever
4. App loads with your personalised plan
```

---

### 6 · Install as Android PWA

```
1. Open https://forgefit.rakshitr.co.in/app/ in Chrome
2. Log in
3. Chrome shows "Add to Home Screen" banner → Install
   OR: ⋮ Menu → Add to Home Screen → Install
4. App launches fullscreen — no browser chrome
```

---

### 7 · Wear OS

```
Browser on Wear OS → https://forgefit.rakshitr.co.in/app/?watch=1
```

Shows: time, date, streak, water, steps, BMI, next alarm.
Quick-tap: log workout ✓ or log water 💧.

---

## 📂 Project Structure

```
forgefit/
├── docker-compose.yml              # PostgreSQL + Node API + Nginx
├── .env.example                    # Environment template (no API keys needed)
├── .gitignore
├── README.md
│
├── frontend/public/
│   ├── index.html                  # Public landing / demo page (shown at /)
│   ├── manifest.json               # Root PWA manifest
│   ├── sw.js                       # Root service worker
│   └── app/
│       ├── index.html              # Full PWA app (shown at /app/)
│       ├── manifest.json           # App PWA manifest (start_url: /app/)
│       └── sw.js                   # App service worker
│
├── backend/
│   ├── Dockerfile
│   ├── package.json                # No Anthropic — uses Puter.js client-side
│   ├── db/schema.sql               # Full PostgreSQL schema + admin SQL commands
│   └── src/
│       ├── index.js                # Express server (auth, profile, logs, alarms only)
│       ├── db/pool.js              # PostgreSQL connection pool
│       ├── middleware/auth.js      # JWT middleware
│       └── routes/
│           ├── auth.js             # POST /api/auth/login, /api/auth/refresh
│           ├── profile.js          # GET/PUT /api/profile
│           ├── logs.js             # Metric, workout, daily goal logs + streak
│           └── alarms.js           # Full alarm CRUD
│
└── nginx/
    ├── nginx.conf                  # / → landing, /app/ → PWA, /api/ → Node
    └── certs/                      # SSL certs (not committed)
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Login → JWT token |
| `POST` | `/api/auth/refresh` | — | Refresh JWT |
| `GET` | `/api/profile` | ✓ | Get user profile + BMI |
| `PUT` | `/api/profile` | ✓ | Create / update profile |
| `POST` | `/api/logs/metric` | ✓ | Log weight / BMI / body fat |
| `GET` | `/api/logs/metric` | ✓ | Get metric history |
| `POST` | `/api/logs/workout` | ✓ | Log a completed workout session |
| `GET` | `/api/logs/workout` | ✓ | Get workout history |
| `GET` | `/api/logs/streak` | ✓ | Get streak + total session count |
| `GET` | `/api/logs/daily` | ✓ | Get today's water / steps / workout |
| `PATCH` | `/api/logs/daily` | ✓ | Update today's goals |
| `GET` | `/api/alarms` | ✓ | List all user alarms |
| `POST` | `/api/alarms` | ✓ | Create an alarm |
| `PATCH` | `/api/alarms/:id` | ✓ | Toggle / update alarm |
| `DELETE` | `/api/alarms/:id` | ✓ | Delete an alarm |

> **AI endpoints** — there are none. All AI calls go directly from the browser to Puter.js (`puter.ai.chat`), which proxies Claude Sonnet for free.

---

## 🗺️ Roadmap

- [x] Public landing / demo page at `/`
- [x] Private PWA app at `/app/`
- [x] JWT auth (admin SQL account creation)
- [x] BMI-based goal recommendations on onboarding
- [x] Puter.js sign-in during onboarding
- [x] Free Claude AI coach via Puter.js (zero API cost)
- [x] Health report image analysis (Puter vision)
- [x] PostgreSQL progress tracking with live charts
- [x] Goal-aware workout exercise lists
- [x] Samsung Health JSON import
- [x] Smart alarms with audio + notifications + snooze
- [x] PWA — installable on Android
- [x] Wear OS optimised layout at `?watch=1`
- [x] Desktop phone-shell + portfolio sidebar
- [ ] Apple Health export support
- [ ] Meal & calorie logging
- [ ] Admin dashboard UI for managing users
- [ ] Push notifications via Web Push API

---

## 👤 Author

**Rakshit Rangarajan**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/rakshit-rangarajan-2084b2211/)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:rakshitr2000@gmail.com)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=about.me&logoColor=white)](https://www.rakshitr.co.in)

---

<div align="center">
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=120&color=0:e8002d,100:000000&section=footer" />

*Forge your body. Every rep counts. 🔥*
</div>
