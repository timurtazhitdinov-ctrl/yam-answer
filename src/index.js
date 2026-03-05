require('dotenv').config();
const express = require('express');
const { handleChatEvent } = require('./bot');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check for Railway
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Yandex Market sends push notifications here
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

app.listen(PORT, () => {
  console.log(`Bot listening on port ${PORT}`);
});
