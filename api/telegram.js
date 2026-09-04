// /api/telegram.js
// Endpoint untuk webhook Telegram Bot

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    try {
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        
        if (!TELEGRAM_BOT_TOKEN) {
            throw new Error('TELEGRAM_BOT_TOKEN not configured');
        }

        const update = req.body;
        
        // Handle callback query (button clicks)
        if (update.callback_query) {
            const callbackQuery = update.callback_query;
            const chatId = callbackQuery.message.chat.id;
            const data = callbackQuery.data;
            
            // Handle different callback data
            if (data === 'get_license') {
                const licenseKey = generateLicenseKey();
                
                await sendTelegramMessage(
                    TELEGRAM_BOT_TOKEN,
                    chatId,
                    `🔑 *License Key Anda:*\n\n\`${licenseKey}\`\n\nGunakan key ini untuk login di website.`
                );
            }
            
            // Answer callback query
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callback_query_id: callbackQuery.id
                })
            });
            
            return res.status(200).json({ success: true });
        }

        // Handle regular messages
        if (update.message) {
            const message = update.message;
            const chatId = message.chat.id;
            const text = message.text || '';
            
            // Handle /start command
            if (text === '/start' || text === '/login') {
                const welcomeMessage = `👋 *Welcome to Alight Motion VIP!*\n\nUntuk mendapatkan license key, klik tombol di bawah ini:`;
                
                await sendTelegramMessage(
                    TELEGRAM_BOT_TOKEN,
                    chatId,
                    welcomeMessage,
                    {
                        inline_keyboard: [[
                            {
                                text: '🔑 Get License Key',
                                callback_data: 'get_license'
                            }
                        ]]
                    }
                );
            }
            // Handle /help command
            else if (text === '/help') {
                await sendTelegramMessage(
                    TELEGRAM_BOT_TOKEN,
                    chatId,
                    `📚 *Bantuan Alight Motion VIP*\n\n` +
                    `Perintah yang tersedia:\n` +
                    `/start - Mulai bot\n` +
                    `/help - Bantuan\n` +
                    `/getkey - Dapatkan license key\n\n` +
                    `Untuk bantuan lebih lanjut, hubungi @k_shie`
                );
            }
            // Handle /getkey command
            else if (text === '/getkey') {
                const licenseKey = generateLicenseKey();
                
                await sendTelegramMessage(
                    TELEGRAM_BOT_TOKEN,
                    chatId,
                    `🔑 *License Key Anda:*\n\n\`${licenseKey}\`\n\nGunakan key ini untuk login di website.`
                );
            }
            // Handle other messages
            else {
                await sendTelegramMessage(
                    TELEGRAM_BOT_TOKEN,
                    chatId,
                    `Silakan gunakan /start untuk memulai bot.`
                );
            }
            
            return res.status(200).json({ success: true });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}

// Helper function to send Telegram message
async function sendTelegramMessage(botToken, chatId, text, replyMarkup = null) {
    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
    };

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    return await response.json();
}

// Generate random license key
function generateLicenseKey() {
    const prefix = 'AM';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const year = new Date().getFullYear();
    return `${prefix}-${random}-${year}`;
}