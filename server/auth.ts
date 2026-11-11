import crypto from 'crypto';

export interface AdminSecurityLog {
  id: string;
  event: 'login_success' | 'login_failed' | 'login_locked' | 'password_changed' | 'logout' | '2fa_verified' | 'action_performed';
  username: string;
  ip: string;
  userAgent: string;
  details?: string;
  timestamp: string;
}

export interface AdminSession {
  token: string;
  userId: string;
  username: string;
  role: 'super_admin';
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
  ip: string;
}

// In-memory security tracking
const failedAttempts: Map<string, { count: number; lockedUntil?: number }> = new Map();
const activeSessions: Map<string, AdminSession> = new Map();
const pending2FA: Map<string, { username: string; code: string; expiresAt: number; attempts: number }> = new Map();
const securityLogs: AdminSecurityLog[] = [];

// Session duration: 2 hours of inactivity
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000;
// Max failed attempts before 15 min lock
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export const authSecurity = {
  // Password hashing using PBKDF2 with SHA-512 and random salt
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, s, 100000, 64, 'sha512').toString('hex');
    return { hash, salt: s };
  },

  verifyPassword(password: string, storedHash: string, salt: string): boolean {
    const { hash } = this.hashPassword(password, salt);
    // Constant-time comparison to prevent timing attacks
    const hashBuf = Buffer.from(hash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (hashBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, storedBuf);
  },

  // Check rate limit
  checkRateLimit(identifier: string): { allowed: boolean; remainingLockTimeMs?: number } {
    const record = failedAttempts.get(identifier);
    if (!record) return { allowed: true };

    if (record.lockedUntil) {
      const now = Date.now();
      if (now < record.lockedUntil) {
        return { allowed: false, remainingLockTimeMs: record.lockedUntil - now };
      }
      // Lockout expired, reset
      failedAttempts.delete(identifier);
      return { allowed: true };
    }

    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      return { allowed: false, remainingLockTimeMs: LOCKOUT_DURATION_MS };
    }

    return { allowed: true };
  },

  recordFailedAttempt(identifier: string) {
    const record = failedAttempts.get(identifier) || { count: 0 };
    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }
    failedAttempts.set(identifier, record);
  },

  resetFailedAttempts(identifier: string) {
    failedAttempts.delete(identifier);
  },

  // 2FA Challenge Generation (6-digit TOTP simulation)
  create2FAChallenge(username: string): { code: string; challengeId: string } {
    const challengeId = crypto.randomBytes(24).toString('hex');
    // Generate secure 6-digit numeric verification code
    const code = crypto.randomInt(100000, 999999).toString();
    pending2FA.set(challengeId, {
      username,
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
      attempts: 0
    });
    return { code, challengeId };
  },

  verify2FAChallenge(challengeId: string, inputCode: string): { valid: boolean; username?: string; message?: string } {
    const challenge = pending2FA.get(challengeId);
    if (!challenge) {
      return { valid: false, message: 'Invalid or expired 2FA session. Please log in again.' };
    }
    if (Date.now() > challenge.expiresAt) {
      pending2FA.delete(challengeId);
      return { valid: false, message: '2FA code expired. Please log in again.' };
    }
    if (challenge.attempts >= 3) {
      pending2FA.delete(challengeId);
      return { valid: false, message: 'Too many incorrect 2FA attempts. Please log in again.' };
    }

    challenge.attempts += 1;
    if (challenge.code !== inputCode.trim()) {
      return { valid: false, message: 'Incorrect 2FA verification code.' };
    }

    pending2FA.delete(challengeId);
    return { valid: true, username: challenge.username };
  },

  // Session Token Creation
  createSession(userId: string, username: string, ip: string): AdminSession {
    const token = `png_sec_${crypto.randomBytes(32).toString('hex')}`;
    const now = Date.now();
    const session: AdminSession = {
      token,
      userId,
      username,
      role: 'super_admin',
      createdAt: now,
      lastActiveAt: now,
      expiresAt: now + SESSION_DURATION_MS,
      ip
    };
    activeSessions.set(token, session);
    return session;
  },

  validateSession(token: string | undefined): AdminSession | null {
    if (!token) return null;
    const session = activeSessions.get(token);
    if (!session) return null;

    const now = Date.now();
    if (now > session.expiresAt) {
      activeSessions.delete(token);
      return null;
    }

    // Refresh inactivity expiry
    session.lastActiveAt = now;
    session.expiresAt = now + SESSION_DURATION_MS;
    return session;
  },

  revokeSession(token: string) {
    activeSessions.delete(token);
  },

  revokeAllSessions() {
    activeSessions.clear();
  },

  // Captcha Generator (Simple arithmetic puzzle with cryptographic signature)
  createCaptcha(): { id: string; question: string } {
    const num1 = crypto.randomInt(2, 12);
    const num2 = crypto.randomInt(1, 9);
    const answer = (num1 + num2).toString();
    const id = crypto.randomBytes(16).toString('hex');
    const secret = process.env.CAPTCHA_SECRET || 'png_captcha_key_secret_2026';
    const hmac = crypto.createHmac('sha256', secret).update(`${id}:${answer}`).digest('hex');
    
    // Store id with expected hash in temporary map
    captchaStore.set(id, { hmac, expiresAt: Date.now() + 10 * 60 * 1000 });
    return { id, question: `What is ${num1} + ${num2}?` };
  },

  verifyCaptcha(id: string, answer: string): boolean {
    const record = captchaStore.get(id);
    if (!record || Date.now() > record.expiresAt) {
      if (record) captchaStore.delete(id);
      return false;
    }
    captchaStore.delete(id);
    const secret = process.env.CAPTCHA_SECRET || 'png_captcha_key_secret_2026';
    const computed = crypto.createHmac('sha256', secret).update(`${id}:${answer.trim()}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(record.hmac));
  },

  // Audit Logs
  logEvent(event: AdminSecurityLog['event'], username: string, ip: string, userAgent: string, details?: string) {
    const log: AdminSecurityLog = {
      id: `log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      event,
      username,
      ip,
      userAgent,
      details,
      timestamp: new Date().toISOString()
    };
    securityLogs.unshift(log);
    // Keep last 100 logs
    if (securityLogs.length > 100) securityLogs.pop();
  },

  getSecurityLogs(): AdminSecurityLog[] {
    return securityLogs;
  }
};

const captchaStore = new Map<string, { hmac: string; expiresAt: number }>();
