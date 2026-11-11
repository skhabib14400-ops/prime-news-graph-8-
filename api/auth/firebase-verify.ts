/**
 * Vercel Serverless Function: /api/auth/firebase-verify
 * Cryptographically verifies Firebase Authentication tokens on Vercel serverless infrastructure
 * strictly for project primenewsgraph-7466f and owner amazonshopping14264@gmail.com
 */

function decodeJwtSegment(segment: string): any {
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers?.authorization;
  const token = req.body?.token || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined);

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Firebase authentication ID token is required.' });
  }

  const AUTHORIZED_OWNER_EMAIL = 'amazonshopping14264@gmail.com';
  const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'primenewsgraph-7466f';
  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBfuMrvWqAIs6EorssP0_W2gnZ1dapD66Q';

  // 1. JWT Structure and Claim Verification
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return res.status(401).json({ success: false, message: 'Invalid token structure.' });
  }

  const header = decodeJwtSegment(parts[0]);
  const payload = decodeJwtSegment(parts[1]);

  if (!header || !payload) {
    return res.status(401).json({ success: false, message: 'Malformed token payload.' });
  }

  if (header.alg !== 'RS256') {
    return res.status(401).json({ success: false, message: 'Invalid token algorithm.' });
  }

  const expectedIssuer = `https://securetoken.google.com/${EXPECTED_PROJECT_ID}`;
  if (payload.iss !== expectedIssuer) {
    return res.status(401).json({ success: false, message: 'Token issuer does not match authorized project.' });
  }

  if (payload.aud !== EXPECTED_PROJECT_ID) {
    return res.status(401).json({ success: false, message: 'Token audience does not match authorized project.' });
  }

  const currentTimeSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < currentTimeSec) {
    return res.status(401).json({ success: false, message: 'Firebase authentication token has expired.' });
  }

  if (!payload.email || payload.email.toLowerCase() !== AUTHORIZED_OWNER_EMAIL.toLowerCase()) {
    return res.status(403).json({
      success: false,
      message: `Unauthorized access. Only portal owner (${AUTHORIZED_OWNER_EMAIL}) has administrative privileges.`
    });
  }

  // 2. Cryptographic Signature & Revocation Verification via Google Identity Toolkit
  try {
    const googleRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token.trim() }),
    });

    if (!googleRes.ok) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked Firebase authentication token.'
      });
    }

    const data: any = await googleRes.json();
    const user = data.users && data.users[0];

    if (!user || !user.email) {
      return res.status(401).json({ success: false, message: 'Firebase user account not found.' });
    }

    if (user.email.toLowerCase() !== AUTHORIZED_OWNER_EMAIL.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `Unauthorized access. Only portal owner (${AUTHORIZED_OWNER_EMAIL}) is permitted.`
      });
    }

    // 3. Trusted Server-Side Session Grant
    return res.status(200).json({
      success: true,
      token: token.trim(),
      user: {
        id: user.localId || payload.sub,
        username: user.email,
        email: user.email,
        role: 'super_admin',
        two_factor_enabled: false,
        last_login: new Date().toISOString()
      },
      expiresAt: Date.now() + 2 * 60 * 60 * 1000
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Server-side token verification error.' });
  }
}
