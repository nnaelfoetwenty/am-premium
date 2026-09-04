// /api/verify.js
import crypto from 'crypto';

// ==================== DATABASE USER & KEY PRIVAT ====================
const VIP_USERS = [
    {
        username: 'admin',
        licenseKey: 'AM-ADMIN-2026',
        isActive: true,
        tier: 'lifetime'
    },
    {
        username: 'k_shie',
        licenseKey: 'AM-KSHIE-2026',
        isActive: true,
        tier: 'lifetime'
    },
    {
        username: 'premium01',
        licenseKey: 'AM-PREM1-2026',
        isActive: true,
        tier: 'lifetime'
    },
    {
        username: 'premium02',
        licenseKey: 'AM-PREM2-2026',
        isActive: true,
        tier: 'lifetime'
    },
    {
        username: 'premium03',
        licenseKey: 'AM-PREM3-2026',
        isActive: true,
        tier: 'lifetime'
    },
    {
        username: 'vipuser',
        licenseKey: 'AM-VIP01-2026',
        isActive: true,
        tier: 'lifetime'
    },
    {
        username: 'pro2026',
        licenseKey: 'AM-PRO26-2026',
        isActive: true,
        tier: 'lifetime'
    },
    {
        username: 'test',
        licenseKey: 'AM-TEST-2026',
        isActive: true,
        tier: 'trial'
    }
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
        // Parse body dengan aman
        let body = {};
        try {
            body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON body'
            });
        }

        const { username, licenseKey } = body;

        // Validasi input
        if (!username || !licenseKey) {
            return res.status(400).json({
                success: false,
                message: 'Username dan license key wajib diisi'
            });
        }

        if (typeof username !== 'string' || typeof licenseKey !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Format data tidak valid'
            });
        }

        if (username.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username minimal 3 karakter'
            });
        }

        // Cari user berdasarkan username dan license key
        const user = VIP_USERS.find(u => 
            u.username.toLowerCase() === username.trim().toLowerCase() && 
            u.licenseKey === licenseKey.trim().toUpperCase()
        );

        // Verifikasi user
        if (!user) {
            // Kirim notifikasi ke admin (tidak blocking)
            notifyAdminFailedLogin(username, licenseKey, req).catch(err => {
                console.error('Notify admin failed:', err);
            });
            
            return res.status(401).json({
                success: false,
                message: 'Username atau license key tidak valid. Silakan hubungi @k_shie'
            });
        }

        // Cek status user
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Akun Anda tidak aktif. Silakan hubungi @k_shie'
            });
        }

        // Buat session token
        const sessionToken = createSessionToken(user);

        // Kirim notifikasi login berhasil (tidak blocking)
        notifyAdminSuccessLogin(user).catch(err => {
            console.error('Notify admin failed:', err);
        });

        return res.status(200).json({
            success: true,
            message: 'Login berhasil',
            sessionToken,
            user: {
                username: user.username,
                licenseKey: maskLicenseKey(user.licenseKey),
                tier: user.tier,
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
function createSessionToken(user) {
    const secret = process.env.SESSION_SECRET || 'default-secret-key-2026';
    const data = JSON.stringify({ 
        username: user.username, 
        licenseKey: user.licenseKey,
        tier: user.tier,
        timestamp: Date.now() 
    });
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

// Helper: Get client IP
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'Unknown';
}

// Helper: Notifikasi login gagal
async function notifyAdminFailedLogin(username, licenseKey, req) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    
    if (!botToken || !adminChatId) {
        return;
    }

    try {
        const clientIp = getClientIp(req);
        const message = `⚠️ *Percobaan Login Gagal*\n\n` +
                       `👤 Username: \`${username}\`\n` +
                       `🔑 License Key: \`${licenseKey}\`\n` +
                       `🌐 IP: \`${clientIp}\`\n` +
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
async function notifyAdminSuccessLogin(user) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    
    if (!botToken || !adminChatId) {
        return;
    }

    try {
        const message = `✅ *Login Berhasil*\n\n` +
                       `👤 Username: \`${user.username}\`\n` +
                       `🔑 License: \`${maskLicenseKey(user.licenseKey)}\`\n` +
                       `⭐ Tier: \`${user.tier}\`\n` +
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
