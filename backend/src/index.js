require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const app = express();

// ── Security middleware ──────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
// Build allowed origins list from env
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5500',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, Postman)
    if (!origin) return callback(null, true);
    // Auto-allow any ngrok or Cloudflare tunnel URL
    if (/\.ngrok(-free)?\.app$/.test(origin) ||
        /\.trycloudflare\.com$/.test(origin) ||
        allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('CORS: origin ' + origin + ' not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── Rate limiting ────────────────────────────────────────────
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
}));

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Routes ───────────────────────────────────────────────────
// NOTE: AI is handled client-side via Puter.js — no AI route here
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/logs',    require('./routes/logs'));
app.use('/api/alarms',  require('./routes/alarms'));

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ForgeFit API running on port ${PORT}`);
});
