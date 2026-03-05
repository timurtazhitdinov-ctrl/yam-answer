const { getChat, sendMessage } = require('./yandex');
const { getNextCode, markCodeUsed, hasReplied, markReplied } = require('./db');

const BUSINESS_ID = process.env.YANDEX_BUSINESS_ID;
const STOREFRONT_URL = process.env.STOREFRONT_URL || 'https://market.yandex.ru/shop--your-shop';

function buildReplyMessage(code) {
  return (
    `Спасибо за интерес к нашему магазину!\n\n` +
    `Чтобы активировать промокод на скидку 12%, следуйте инструкции:\n\n` +
    `1) Удалите товар из корзины (важно сделать это ДО перехода по ссылке)\n` +
    `2) Перейдите по ссылке и подпишитесь на магазин:\n${STOREFRONT_URL}\n` +
    `3) Найдите нужный товар в каталоге магазина и добавьте в корзину\n` +
    `4) Введите промокод при оформлении заказа:\n\n` +
    `Промокод (12%): ${code}\n\n` +
    `Если возникнут вопросы — пишите, поможем!`
  );
}

async function handleChatEvent(notification) {
  const { type, chatId } = notification;

  if (type !== 'CHAT_CREATED' && type !== 'CHAT_MESSAGE_SENT') return;

  // Ignore our own outgoing messages
  if (type === 'CHAT_MESSAGE_SENT' && notification.role !== 'USER') return;

  // Only reply once per chat (persisted in DB across restarts)
  if (hasReplied(chatId)) return;

  // Pick the next unused promo code
  const row = getNextCode();
  if (!row) {
    console.warn(`No promo codes left! Chat ${chatId} was not answered.`);
    return;
  }

  try {
    await getChat(BUSINESS_ID, chatId);
    await sendMessage(BUSINESS_ID, chatId, buildReplyMessage(row.code));

    // Persist both the reply and the code usage atomically
    markCodeUsed(row.id, String(chatId));
    markReplied(chatId);

    console.log(`Replied to chat ${chatId} with code ${row.code}`);
  } catch (err) {
    console.error(`Failed to reply to chat ${chatId}:`, err.response?.data || err.message);
  }
}

module.exports = { handleChatEvent };
