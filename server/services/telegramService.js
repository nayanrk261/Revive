export async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { success: false, error: 'Telegram not configured' };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    const data = await response.json();
    if (!data.ok) {
      return { success: false, error: data.description || 'Telegram API error' };
    }
    return { success: true, messageId: data.result.message_id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
