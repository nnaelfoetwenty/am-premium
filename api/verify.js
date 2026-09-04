// /api/verify.js
// Endpoint untuk verifikasi license key

import crypto from 'crypto';

// Daftar license keys yang valid (seharusnya dari database)
const VALID_LICENSE_KEYS = [
    'AM-ABC123-2026',
    'AM-DEF456-2026',
    'AM-GHI789-2026',
    // Tambahkan license keys lainnya di sini
];

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
        const { username, licenseKey } = req.body;

        // Validasi input
        if (!username || !licenseKey) {
            return res.status(400).json({
                success: false,
                message: 'Username dan license key wajib diisi'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username minimal 3 karakter'
            });
        }

        // Verifikasi license key
        const isValidLicense = VALID_LICENSE_KEYS.includes(licenseKey.toUpperCase());

        if (!isValidLicense) {
            // Kirim notifikasi ke admin via Telegram
            await notifyAdmin(licenseKey, username);
            
            return res.status(401).json({
                success: false,
                message: 'License key tidak valid. Silakan hubungi @k_shie untuk mendapatkan key yang valid.'
            });
        }

        // Buat session token
        const sessionToken = createSessionToken(username, licenseKey);

        // Kirim notifikasi login berhasil ke admin
        await notifyAdminLogin(username, licenseKey);

        return res.status(200).json({
            success: true,
            message: 'Login berhasil',
            sessionToken,
            user: {
                username,
                licenseKey: maskLicenseKey(licenseKey),
                loginTime: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Verify error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Helper: Buat session token
function createSessionToken(username, licenseKey) {
    const secret = process.env.SESSION_SECRET || 'default-secret-key';
    const data = JSON.stringify({ username, licenseKey, timestamp: Date.now() });
    const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
    return Buffer.from(JSON.stringify({ data, hash })).toString('base64');
}

// Helper: Mask license key
function maskLicenseKey(licenseKey) {
    const parts = licenseKey.split('-');
    if (parts.length === 3) {
        return `${parts[0]}-XXXX-${parts[2]}`;
    }
    return licenseKey;
}

// Helper: Notifikasi ke admin
async function notifyAdmin(licenseKey, username) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    
    if (!botToken || !adminChatId) {
        return;
    }

    try {
        const message = `⚠️ *Percobaan Login Gagal*\n\n` +
                       `👤 Username: \`${username}\`\n` +
                       `🔑 License Key: \`${licenseKey}\`\n` +
                       `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminChatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (error) {
        console.error('Failed to notify admin:', error);
    }
}

// Helper: Notifikasi login berhasil
async function notifyAdminLogin(username, licenseKey) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    
    if (!botToken || !adminChatId) {
        return;
    }

    try {
        const message = `✅ *Login Berhasil*\n\n` +
                       `👤 Username: \`${username}\`\n` +
                       `🔑 License Key: \`${maskLicenseKey(licenseKey)}\`\n` +
                       `⏰ Waktu: ${new Date().toLocaleString('id-ID')}`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminChatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (error) {
        console.error('Failed to notify admin:', error);
    }
}