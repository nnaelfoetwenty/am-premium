// /api/synox-verify.js
// Endpoint untuk verifikasi premium via SynoxCloud API

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
        const { jobId, verificationLink, email } = req.body;

        // Validasi input
        if (!jobId || !verificationLink) {
            return res.status(400).json({
                success: false,
                message: 'Job ID dan verification link wajib diisi'
            });
        }

        // Validasi format link
        if (!verificationLink.includes('http')) {
            return res.status(400).json({
                success: false,
                message: 'Format verification link tidak valid'
            });
        }

        // Panggil SynoxCloud API untuk verifikasi
        const synoxResponse = await fetch('https://api.synoxcloud.xyz/am/verif', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobId: jobId,
                link: verificationLink,
                apikey: process.env.SYNOX_API_KEY || 'FREE'
            })
        });

        const synoxData = await synoxResponse.json();

        // Log untuk debugging (hanya di server)
        console.log('SynoxCloud Verify Response:', synoxData);

        // Kirim notifikasi ke admin via Telegram
        await notifyAdminVerify(email, jobId, verificationLink, synoxData);

        // Cek status sukses
        const isSuccess = synoxResponse.ok && (
            synoxData.success || 
            synoxData.status === 'success' || 
            synoxData.message?.toLowerCase().includes('success') ||
            synoxData.data
        );

        if (isSuccess) {
            return res.status(200).json({
                success: true,
                message: 'Verifikasi premium berhasil',
                data: synoxData
            });
        } else {
            return res.status(400).json({
                success: false,
                message: synoxData.message || 'Verifikasi gagal',
                data: synoxData
            });
        }

    } catch (error) {
        console.error('Synox verify error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
}

// Helper: Notifikasi ke admin via Telegram
async function notifyAdminVerify(email, jobId, verificationLink, synoxData) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    
    if (!botToken || !adminChatId) {
        console.log('Telegram credentials not configured');
        return;
    }

    try {
        const message = `✅ *Verifikasi Premium*\n\n` +
                       `📧 Email: \`${email || 'N/A'}\`\n` +
                       `🆔 Job ID: \`${jobId}\`\n` +
                       `🔗 Link: \`${verificationLink.substring(0, 50)}...\`\n` +
                       `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
                       `📦 Response: \`${JSON.stringify(synoxData).substring(0, 200)}\``;

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