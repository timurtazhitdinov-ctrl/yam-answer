const { getChat, sendMessage } = require('./yandex');

const BUSINESS_ID = process.env.YANDEX_BUSINESS_ID;

// Track chats we already replied to (in-memory; resets on redeploy)
// For persistence, replace with a simple file or DB
const repliedChats = new Set();

// The template message sent to every new chat
// Edit PROMO_CODE and STOREFRONT_URL before deploying
const PROMO_CODE = process.env.PROMO_CODE || 'XXXXXXX';
const STOREFRONT_URL = process.env.STOREFRONT_URL || 'https://market.yandex.ru/shop--your-shop';

function buildReplyMessage() {
  return (
    `Спасибо за интерес к нашему магазину! 🎉\n\n` +
    `Чтобы активировать промокод на скидку 12%, следуйте инструкции:\n\n` +
    `1️⃣ Удалите товар из корзины (важно сделать это ДО перехода по ссылке)\n` +
    `2️⃣ Перейдите по ссылке и подпишитесь на магазин:\n${STOREFRONT_URL}\n` +
    `3️⃣ Найдите нужный товар в каталоге магазина и добавьте в корзину\n` +
    `4️⃣ Введите промокод при оформлении заказа:\n\n` +
    `🏷 Промокод (12%): ${PROMO_CODE}\n\n` +
    `Если возникнут вопросы — пишите, поможем!`
  );
}

async function handleChatEvent(notification) {
  const { type, chatId } = notification;

  // We only care about new chats or incoming messages
  if (type !== 'CHAT_CREATED' && type !== 'CHAT_MESSAGE_SENT') return;

  // Only reply once per chat
  if (repliedChats.has(chatId)) return;

  // For CHAT_MESSAGE_SENT make sure the message is from the buyer, not us
  if (type === 'CHAT_MESSAGE_SENT') {
    const { role } = notification;
    if (role !== 'USER') return; // ignore our own messages
  }

  try {
    // Fetch chat to get campaignId (shopId) for context, optional but useful
    await getChat(BUSINESS_ID, chatId);

    await sendMessage(BUSINESS_ID, chatId, buildReplyMessage());
    repliedChats.add(chatId);

    console.log(`Replied to chat ${chatId}`);
  } catch (err) {
    console.error(`Failed to reply to chat ${chatId}:`, err.response?.data || err.message);
  }
}

module.exports = { handleChatEvent };
