const axios = require('axios');

const BASE_URL = 'https://api.partner.market.yandex.ru/v2';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Api-Key': process.env.YANDEX_API_KEY,
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch a single chat by chatId
 */
async function getChat(businessId, chatId) {
  const { data } = await client.get(`/businesses/${businessId}/chat`, {
    params: { chatId },
  });
  return data.result;
}

/**
 * Get messages in a chat
 */
async function getChatMessages(businessId, chatId) {
  const { data } = await client.get(`/businesses/${businessId}/chats/messages`, {
    params: { chatId },
  });
  return data.result.messages || [];
}

/**
 * Send a text message to a chat on behalf of the seller
 */
async function sendMessage(businessId, chatId, message) {
  const { data } = await client.post(
    `/businesses/${businessId}/chats/message`,
    { message },
    { params: { chatId } }
  );
  return data;
}

module.exports = { getChat, getChatMessages, sendMessage };
