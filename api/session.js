// /api/session.js
// Endpoint untuk validasi session

import crypto from 'crypto';

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
        const { sessionToken } = req.body;

        if (!sessionToken) {
            return res.status(400).json({
                success: false,
                message: 'Session token required'
            });
        }

        // Validasi session token
        const isValid = validateSessionToken(sessionToken);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Session expired or invalid'
            });
        }

        // Parse session data
        const sessionData = parseSessionToken(sessionToken);

        return res.status(200).json({
            success: true,
            message: 'Session valid',
            user: sessionData
        });

    } catch (error) {
        console.error('Session validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Helper: Validasi session token
function validateSessionToken(sessionToken) {
    try {
        const secret = process.env.SESSION_SECRET || 'default-secret-key';
        const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
        const { data, hash } = JSON.parse(decoded);
        
        const expectedHash = crypto.createHmac('sha256', secret).update(data).digest('hex');
        const sessionData = JSON.parse(data);
        
        // Cek hash
        if (hash !== expectedHash) {
            return false;
        }
        
        // Cek expiry (24 jam)
        const timestamp = sessionData.timestamp;
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (now - timestamp > maxAge) {
            return false;
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

// Helper: Parse session token
function parseSessionToken(sessionToken) {
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { data } = JSON.parse(decoded);
    return JSON.parse(data);
}
