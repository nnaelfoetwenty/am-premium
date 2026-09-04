// /api/synox-generate.js
// Endpoint untuk generate premium via SynoxCloud API

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
        const { email } = req.body;

        // Validasi email
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'Email tidak valid'
            });
        }

        // Panggil SynoxCloud API
        const synoxResponse = await fetch('https://api.synoxcloud.xyz/am/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                gmail: email,
                apikey: process.env.SYNOX_API_KEY || 'FREE'
            })
        });

        const synoxData = await synoxResponse.json();

        // Log untuk debugging (hanya di server)
        console.log('SynoxCloud Generate Response:', synoxData);

        // Kirim notifikasi ke admin via Telegram
        await notifyAdminGenerate(email, synoxData);

        // Return response ke client
        if (synoxResponse.ok && (synoxData.jobId || synoxData.job_id || synoxData.data?.jobId || synoxData.data?.job_id)) {
            const jobId = synoxData.jobId || synoxData.job_id || synoxData.data?.jobId || synoxData.data?.job_id;
            
            return res.status(200).json({
                success: true,
                message: 'Permintaan premium berhasil dikirim',
                jobId: jobId,
                data: synoxData
            });
        } else {
            return res.status(400).json({
                success: false,
                message: synoxData.message || 'Gagal generate premium',
                data: synoxData
            });
        }

    } catch (error) {
        console.error('Synox generate error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
}

// Helper: Notifikasi ke admin via Telegram
async function notifyAdminGenerate(email, synoxData) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;
    
    if (!botToken || !adminChatId) {
        console.log('Telegram credentials not configured');
        return;
    }

    try {
        const jobId = synoxData.jobId || synoxData.job_id || synoxData.data?.jobId || synoxData.data?.job_id || 'N/A';
        
        const message = `🔑 *Permintaan Premium Baru*\n\n` +
                       `📧 Email: \`${email}\`\n` +
                       `🆔 Job ID: \`${jobId}\`\n` +
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