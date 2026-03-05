require('dotenv').config();
const express = require('express');
const { handleChatEvent } = require('./bot');
const { addCodes, listCodes, countAvailable } = require('./db');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// --- Middleware ---

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(500).json({ error: 'ADMIN_TOKEN not set' });
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// --- Health check ---

app.get('/', (req, res) => {
  res.json({ status: 'ok', available_codes: countAvailable() });
});

// --- Webhook (Yandex Market → Bot) ---

app.post('/webhook', async (req, res) => {
  // Respond immediately so Yandex doesn't retry
  res.json({ status: 'ok' });

  const notifications = req.body;
  if (!Array.isArray(notifications)) return;

  for (const notification of notifications) {
    try {
      await handleChatEvent(notification);
    } catch (err) {
      console.error('Error handling notification:', err.message, notification);
    }
  }
});

// --- Admin: add promo codes ---
// POST /admin/codes
// Headers: x-admin-token: <ADMIN_TOKEN>
// Body: { "codes": ["CODE1", "CODE2", ...] }

app.post('/admin/codes', requireAdmin, (req, res) => {
  const { codes } = req.body;
  if (!Array.isArray(codes) || codes.length === 0) {
    return res.status(400).json({ error: 'Provide { codes: ["CODE1", ...] }' });
  }
  addCodes(codes);
  res.json({ added: codes.length, available: countAvailable() });
});

// --- Admin: view all codes ---
// GET /admin/codes
// Headers: x-admin-token: <ADMIN_TOKEN>

app.get('/admin/codes', requireAdmin, (req, res) => {
  res.json({ codes: listCodes(), available: countAvailable() });
});

// ---

app.listen(PORT, () => {
  console.log(`Bot listening on port ${PORT}`);
});
