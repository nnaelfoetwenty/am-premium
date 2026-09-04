```markdown
# Alight Motion VIP - Premium Login System

Sistem login premium dengan verifikasi license key dan integrasi Telegram Bot yang aman menggunakan Vercel Serverless Functions.

## 📋 Fitur

- ✅ Login dengan username + license key
- ✅ Verifikasi license key via backend (bukan localStorage)
- ✅ Integrasi Telegram Bot untuk verifikasi
- ✅ Session management yang aman (HMAC signed)
- ✅ SynoxCloud API integration untuk premium activation
- ✅ Responsive design dengan Tailwind CSS
- ✅ Animasi modern dan UI/UX premium
- ✅ Notifikasi ke admin via Telegram
- ✅ Validasi input di client & server
- ✅ Error handling yang comprehensive

## 🏗️ Struktur Project

```

alight-motion-vip/
├── index.html              # Halaman login
├── dashboard.html          # Dashboard premium (SynoxCloud integration)
├── vercel.json             # Konfigurasi Vercel
├── .env.example            # Template environment variables
├── .gitignore              # Git ignore file
├── README.md               # Dokumentasi
└── api/
├── telegram.js         # Webhook Telegram Bot
├── verify.js           # Verifikasi license key
├── session.js          # Validasi session
├── synox-generate.js   # Generate premium via SynoxCloud
└── synox-verify.js     # Verifikasi premium via SynoxCloud

```

## 🔧 Environment Variables

Tambahkan environment variables berikut di Vercel Dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Token bot Telegram | `8888138725:AAEJvZ...` |
| `ADMIN_CHAT_ID` | Chat ID admin untuk notifikasi | `6010652605` |
| `SESSION_SECRET` | Secret key untuk signing session | `random_string_here` |
| `SYNOX_API_KEY` | API key SynoxCloud | `FREE` |

### Cara Menambahkan di Vercel:

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project Anda
3. Klik **Settings** → **Environment Variables**
4. Tambahkan variables di atas
5. Pilih environment (Production/Preview/Development)
6. Klik **Save**
7. **Redeploy** project Anda

### Generate SESSION_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

🚀 Deployment

Metode 1: Vercel Dashboard

1. Push project ke GitHub
2. Buka vercel.com
3. Klik "New Project"
4. Import repository GitHub Anda
5. Configure environment variables
6. Klik "Deploy"

Metode 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login ke Vercel
vercel login

# Deploy ke preview
vercel

# Deploy ke production
vercel --prod
```

Metode 3: GitHub Integration

1. Push project ke GitHub
2. Buka vercel.com
3. Klik "New Project"
4. Import dari GitHub
5. Set environment variables
6. Deploy

🤖 Setup Telegram Bot

1. Buat Bot Telegram:

1. Buka @BotFather di Telegram
2. Kirim /newbot
3. Ikuti instruksi untuk membuat bot
4. Simpan token bot yang diberikan

2. Set Webhook:

Setelah deploy ke Vercel, set webhook bot:

```bash
curl -X POST "https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url=https://your-app.vercel.app/api/telegram"
```

Atau buka di browser:

```
https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url=https://your-app.vercel.app/api/telegram
```

3. Test Bot:

1. Buka bot di Telegram
2. Kirim /start
3. Bot akan merespon dengan tombol untuk mendapatkan license key

📝 API Endpoints

POST /api/verify

Verifikasi license key untuk login.

Request:

```json
{
  "username": "user123",
  "licenseKey": "AM-ABC123-2026"
}
```

Response Success:

```json
{
  "success": true,
  "message": "Login berhasil",
  "sessionToken": "base64_encoded_token",
  "user": {
    "username": "user123",
    "licenseKey": "AM-XXXX-2026",
    "loginTime": "2026-01-01T00:00:00.000Z"
  }
}
```

POST /api/session

Validasi session token.

Request:

```json
{
  "sessionToken": "base64_encoded_token"
}
```

POST /api/synox-generate

Generate premium link via SynoxCloud.

Request:

```json
{
  "email": "user@gmail.com"
}
```

POST /api/synox-verify

Verifikasi premium via SynoxCloud.

Request:

```json
{
  "email": "user@gmail.com",
  "jobId": "job_id_here",
  "verificationLink": "https://..."
}
```

🎨 License Keys

License keys yang valid didefinisikan di api/verify.js:

```javascript
const VALID_LICENSE_KEYS = [
    'AM-ABC123-2026',
    'AM-DEF456-2026',
    'AM-GHI789-2026',
    // Tambahkan license keys lainnya di sini
];
```

Format: AM-XXXXXX-YYYY

🔒 Keamanan

· ✅ Bot token hanya di server (environment variable)
· ✅ Admin chat ID tidak ter-expose ke client
· ✅ Session token di-sign dengan HMAC SHA256
· ✅ License keys tidak disimpan di localStorage
· ✅ Semua API calls melalui backend
· ✅ Input validation di client & server
· ✅ CORS headers untuk API
· ✅ Error handling yang aman

🛠️ Development Lokal

```bash
# Clone repository
git clone https://github.com/your-username/alight-motion-vip.git
cd alight-motion-vip

# Install dependencies (untuk development)
npm install

# Buat file .env
cp .env.example .env

# Edit .env dengan credentials Anda
nano .env

# Jalankan development server
vercel dev
```

📦 Dependencies

· Tailwind CSS - Styling (via CDN)
· FontAwesome - Icons (via CDN)
· Google Fonts - Typography (via CDN)
· Vercel - Hosting & Serverless Functions

Tidak perlu install dependencies untuk production karena semua menggunakan CDN.

🐛 Troubleshooting

Environment Variables tidak terbaca:

```bash
# Check logs di Vercel
vercel logs

# Verifikasi environment variables
vercel env ls
```

Webhook Telegram tidak berfungsi:

```bash
# Check webhook status
curl https://api.telegram.org/bot{YOUR_BOT_TOKEN}/getWebhookInfo

# Reset webhook
curl https://api.telegram.org/bot{YOUR_BOT_TOKEN}/deleteWebhook

# Set webhook baru
curl -X POST "https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url=https://your-app.vercel.app/api/telegram"
```

Session selalu expired:

Pastikan SESSION_SECRET konsisten antara deployments.

SynoxCloud API error:

Check logs di Vercel untuk melihat response dari SynoxCloud.

📞 Support

· Telegram: @k_shie
· Bot: @alightPremk_shieBot

📄 Lisensi

© 2026 Alight Motion VIP. All rights reserved.

---

Dibuat oleh: k_shie
Version: 1.0.0
Last Updated: 2026

```

## **`.env.example`** (Template Environment Variables):

```env
# .env.example
# Copy file ini ke .env dan isi dengan values Anda

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=6010652605

# Session Security
SESSION_SECRET=your_random_secret_string_here

# SynoxCloud API
SYNOX_API_KEY=FREE
```

.gitignore:

```gitignore
# Dependencies
node_modules/

# Environment Variables
.env
.env.local
.env.production
.env.development

# Vercel
.vercel/
.now/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS Files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
dist/
build/
out/
```
