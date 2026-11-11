/**
 * PRIME NEWS GRAPH — Server-Side Firebase Authentication & Owner Authorization
 * Verifies Firebase ID Tokens securely on the server-side with full cryptographic claim validation:
 * (issuer, audience, expiry, signature, authorized owner email).
 */

import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

export const AUTHORIZED_OWNER_EMAIL = 'amazonshopping14264@gmail.com';
export const EXPECTED_PROJECT_ID = 'primenewsgraph-7466f';

let adminApp: App | null = null;
let firebaseAdminInitialized = false;
let firebaseApiKey = 'AIzaSyBfuMrvWqAIs6EorssP0_W2gnZ1dapD66Q';
let firebaseProjectId = 'primenewsgraph-7466f';

// Load config from firebase-applet-config.json
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    firebaseApiKey = parsed.apiKey || firebaseApiKey;
    firebaseProjectId = parsed.projectId || firebaseProjectId;
  }
} catch (e) {
  console.warn('[Server Firebase] Notice loading firebase-applet-config.json:', e);
}

// Initialize Firebase Admin SDK if service account is provided via env vars
try {
  const apps = getApps();
  if (!apps.length) {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || firebaseProjectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID || firebaseProjectId,
      });
      firebaseAdminInitialized = true;
    } else {
      adminApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || firebaseProjectId,
      });
      firebaseAdminInitialized = true;
    }
  } else {
    adminApp = apps[0];
    firebaseAdminInitialized = true;
  }
} catch (err) {
  console.warn('[Server Firebase] Admin SDK initialized with project identity:', err);
}

export interface VerifiedAdminToken {
  uid: string;
  email: string;
  role: 'super_admin';
  isOwner: boolean;
  authTime?: number;
}

/**
 * Decode base64url string to JSON
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

/**
 * Verify Firebase ID Token securely on the server side (Rule 3, 4, 6)
 * Validates cryptographic signature, issuer, audience, expiry, and owner identity.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedAdminToken | null> {
  if (!idToken || typeof idToken !== 'string') return null;

  const trimmedToken = idToken.trim();
  const parts = trimmedToken.split('.');
  if (parts.length !== 3) {
    console.warn('[Server Firebase] Invalid JWT structure received.');
    return null;
  }

  // 1. Validate JWT Header & Payload Claims
  const header = decodeJwtSegment(parts[0]);
  const payload = decodeJwtSegment(parts[1]);

  if (!header || !payload) {
    console.warn('[Server Firebase] Malformed JWT segments.');
    return null;
  }

  // Verify Algorithm
  if (header.alg !== 'RS256') {
    console.warn(`[Server Firebase] Invalid token algorithm: ${header.alg}`);
    return null;
  }

  // Verify Issuer: must be https://securetoken.google.com/<projectId>
  const expectedIssuer = `https://securetoken.google.com/${firebaseProjectId}`;
  if (payload.iss !== expectedIssuer) {
    console.warn(`[Server Firebase] Token issuer mismatch: expected ${expectedIssuer}, got ${payload.iss}`);
    return null;
  }

  // Verify Audience: must match project ID
  if (payload.aud !== firebaseProjectId) {
    console.warn(`[Server Firebase] Token audience mismatch: expected ${firebaseProjectId}, got ${payload.aud}`);
    return null;
  }

  // Verify Expiration: must be in the future
  const currentTimeSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < currentTimeSec) {
    console.warn(`[Server Firebase] Token has expired: exp=${payload.exp}, current=${currentTimeSec}`);
    return null;
  }

  // Verify Subject & Email
  if (!payload.sub || !payload.email) {
    console.warn('[Server Firebase] Token missing sub or email claims.');
    return null;
  }

  // Strict Authorized Owner Check (Rule 2 & 4)
  if (payload.email.toLowerCase() !== AUTHORIZED_OWNER_EMAIL.toLowerCase()) {
    console.warn(`[Server Firebase] Access denied. Token email (${payload.email}) does not match authorized owner (${AUTHORIZED_OWNER_EMAIL}).`);
    return null;
  }

  // 2. Cryptographic Signature Verification via Firebase Admin SDK
  if (firebaseAdminInitialized) {
    try {
      const authInstance = adminApp ? getAuth(adminApp) : getAuth();
      const decoded = await authInstance.verifyIdToken(trimmedToken);
      if (decoded && decoded.email && decoded.email.toLowerCase() === AUTHORIZED_OWNER_EMAIL.toLowerCase()) {
        return {
          uid: decoded.uid,
          email: decoded.email,
          role: 'super_admin',
          isOwner: true,
          authTime: decoded.auth_time,
        };
      }
    } catch {
      // If Admin SDK verification encounters local cert limitation, fall through to Google Identity Toolkit REST verification
    }
  }

  // 3. Cryptographic Signature & Revocation Verification via Google Identity Toolkit
  const apiKey = process.env.FIREBASE_API_KEY || firebaseApiKey;
  if (apiKey) {
    try {
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: trimmedToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const user = data.users && data.users[0];
        if (user && user.email) {
          const email = user.email.toLowerCase();
          if (email === AUTHORIZED_OWNER_EMAIL.toLowerCase()) {
            return {
              uid: user.localId || payload.sub,
              email: user.email,
              role: 'super_admin',
              isOwner: true,
            };
          } else {
            console.warn(`[Server Firebase] Lookup returned unauthorized email: ${user.email}`);
            return null;
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('[Server Firebase] Google Identity Toolkit verification failed:', errData);
      }
    } catch (fetchErr) {
      console.warn('[Server Firebase] Identity Toolkit lookup error:', fetchErr);
    }
  }

  return null;
}
