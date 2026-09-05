// /api/synox-generate.js
// Endpoint untuk generate premium via SynoxCloud API

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Konfigurasi (fallback ke value di kode jika env variable tidak diset)
const SYNOX_API_KEY = process.env.SYNOX_API_KEY || 'FREE';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8888138725:AAEJvZWqJa-AYbUop6AtayHG74vfZJZDmb4';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '6010652605';

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
    // Terima input fleksibel: "email" atau "gmail"
    const body = req.body || {};
    const rawEmail = body.email ?? body.gmail;
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';

    // Validasi email
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email tidak valid'
      });
    }

    // Panggil SynoxCloud API
    let synoxResponse;
    try {
      synoxResponse = await fetch('https://api.synoxcloud.xyz/am/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gmail: email,
          apikey: SYNOX_API_KEY
        })
      });
    } catch (networkError) {
      console.error('Gagal menghubungi SynoxCloud:', networkError);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghubungi SynoxCloud: ' + networkError.message
      });
    }

    // Parse response dengan aman (SynoxCloud bisa saja tidak mengembalikan JSON valid)
    const rawText = await synoxResponse.text();
    let synoxData = null;

    try {
      synoxData = rawText ? JSON.parse(rawText) : {};
    } catch (err) {
      synoxData = null;
    }

    // Log untuk debugging (hanya di server)
    console.log('SynoxCloud Generate Response (raw):', rawText);

    // Kirim notifikasi ke admin via Telegram — tidak boleh menggagalkan request utama
    try {
      await notifyAdminGenerate(email, synoxData ?? { rawText });
    } catch (notifyError) {
      console.error('Gagal mengirim notifikasi admin (diabaikan):', notifyError);
    }

    // Jika response bukan JSON sama sekali, anggap sebagai kegagalan dari SynoxCloud
    if (synoxData === null) {
      return res.status(400).json({
        success: false,
        message: 'Response SynoxCloud tidak dapat diproses (bukan JSON valid)',
        raw: rawText?.substring(0, 500)
      });
    }

    // Cari jobId dari berbagai kemungkinan struktur, secara aman
    const jobId =
      synoxData.jobId ??
      synoxData.job_id ??
      synoxData?.data?.jobId ??
      synoxData?.data?.job_id ??
      null;

    if (synoxResponse.ok && jobId) {
      return res.status(200).json({
        success: true,
        message: 'Permintaan premium berhasil dikirim',
        jobId: jobId,
        data: synoxData
      });
    }

    const synoxMessage =
      synoxData.message ??
      synoxData.error ??
      synoxData.msg ??
      synoxData?.data?.message ??
      'Gagal generate premium';

    return res.status(400).json({
      success: false,
      message: synoxMessage,
      data: synoxData
    });

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
  if (!TELEGRAM_BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.log('Telegram credentials not configured');
    return;
  }

  try {
    const jobId =
      synoxData?.jobId ??
      synoxData?.job_id ??
      synoxData?.data?.jobId ??
      synoxData?.data?.job_id ??
      'N/A';

    const message = `🔑 *Permintaan Premium Baru*\n\n` +
                   `📧 Email: \`${email}\`\n` +
                   `🆔 Job ID: \`${jobId}\`\n` +
                   `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
                   `📦 Response: \`${JSON.stringify(synoxData).substring(0, 200)}\``;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Failed to notify admin:', error);
  }
}
