/**
 * Vercel Serverless Function: /api/auth/session
 * Verifies active session token on Vercel
 */

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const authHeader = req.headers?.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers?.['x-admin-token'] as string);

  if (!token) {
    return res.status(200).json({ valid: false });
  }

  const AUTHORIZED_OWNER_EMAIL = 'amazonshopping14264@gmail.com';
  const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBfuMrvWqAIs6EorssP0_W2gnZ1dapD66Q';

  // Check if token is a Firebase JWT
  if (token.includes('.') && token.length > 100) {
    try {
      const googleRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      if (googleRes.ok) {
        const data: any = await googleRes.json();
        const user = data.users && data.users[0];
        if (user && user.email && user.email.toLowerCase() === AUTHORIZED_OWNER_EMAIL.toLowerCase()) {
          return res.status(200).json({
            valid: true,
            user: {
              id: user.localId,
              username: user.email,
              email: user.email,
              role: 'super_admin',
              two_factor_enabled: false,
            },
            expiresAt: Date.now() + 2 * 60 * 60 * 1000
          });
        }
      }
    } catch {}
  }

  return res.status(200).json({ valid: false });
}
