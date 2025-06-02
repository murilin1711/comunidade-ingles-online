
import * as functions from 'firebase-functions';

// Configurações do Twilio
const twilioClient = require('twilio')(
  functions.config().twilio?.sid || process.env.TWILIO_SID,
  functions.config().twilio?.token || process.env.TWILIO_TOKEN
);

const TWILIO_FROM = functions.config().twilio?.from || process.env.TWILIO_FROM;

// Configurações do Telegram
const TELEGRAM_BOT_TOKEN = functions.config().telegram?.bot_token || process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = functions.config().telegram?.chat_id || process.env.TELEGRAM_CHAT_ID;

export const enviarWhatsApp = async (to: string, texto: string) => {
  try {
    if (!twilioClient || !TWILIO_FROM) {
      console.log('Twilio não configurado, mensagem não enviada:', texto);
      return;
    }

    // Formatar número para WhatsApp
    const whatsappNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const message = await twilioClient.messages.create({
      body: texto,
      from: TWILIO_FROM,
      to: whatsappNumber
    });

    console.log('WhatsApp enviado:', message.sid);
    return message.sid;
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    throw error;
  }
};

export const enviarTelegram = async (texto: string) => {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log('Telegram não configurado, mensagem não enviada:', texto);
      return;
    }

    const fetch = require('node-fetch');
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: texto,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();
    
    if (result.ok) {
      console.log('Telegram enviado:', result.result.message_id);
      return result.result.message_id;
    } else {
      console.error('Erro ao enviar Telegram:', result);
      throw new Error(result.description);
    }
  } catch (error) {
    console.error('Erro ao enviar Telegram:', error);
    throw error;
  }
};
