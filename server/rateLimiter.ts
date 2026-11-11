import { Request, Response, NextFunction } from 'express';
import { authSecurity } from './auth.js';

export interface RateLimitOptions {
  windowMs: number;          // Time window in milliseconds
  max: number;               // Max requests allowed within window
  message?: string;          // User-friendly error message
  code?: string;             // Error code string
  logEventName?: 'login_locked' | 'action_performed' | 'login_failed';
  skipSuccessfulRequests?: boolean;
}

interface ClientRecord {
  count: number;
  resetTime: number;
  firstHit: number;
  lockedUntil?: number;
}

// Client store in memory with automatic garbage collection
const store = new Map<string, ClientRecord>();

// Cleanup expired records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime && (!record.lockedUntil || now > record.lockedUntil)) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Creates an Express rate-limiting middleware configured with specific limits.
 */
export function createRateLimiter(options: RateLimitOptions, namespace = 'general') {
  const {
    windowMs,
    max,
    message = 'Too many requests. Please slow down and try again later.',
    code = 'RATE_LIMIT_EXCEEDED',
    logEventName,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const key = `${namespace}:${ip}`;
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      // New window or expired window
      record = {
        count: 1,
        resetTime: now + windowMs,
        firstHit: now,
      };
      store.set(key, record);
    } else {
      // Check if temporarily locked
      if (record.lockedUntil && now < record.lockedUntil) {
        const retryAfterSec = Math.ceil((record.lockedUntil - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.lockedUntil / 1000));

        if (logEventName) {
          authSecurity.logEvent(
            logEventName,
            (req.body?.username as string) || 'rate_limited_ip',
            ip,
            req.headers['user-agent'] || 'Unknown',
            `Blocked by rate limit lock (${namespace}). Remaining: ${retryAfterSec}s`
          );
        }

        return res.status(429).json({
          error: 'Too Many Requests',
          code,
          message: `${message} Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
          retryAfter: retryAfterSec,
        });
      }

      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSec = Math.ceil(record.resetTime / 1000);

    // Standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSec);

    if (record.count > max) {
      // Set lockout period if breached
      record.lockedUntil = now + windowMs;
      const retryAfterSec = Math.ceil(windowMs / 1000);
      res.setHeader('Retry-After', retryAfterSec);

      if (logEventName) {
        authSecurity.logEvent(
          logEventName,
          (req.body?.username as string) || 'rate_limited_ip',
          ip,
          req.headers['user-agent'] || 'Unknown',
          `Rate limit exceeded (${namespace}): ${record.count}/${max} in ${windowMs / 1000}s`
        );
      }

      return res.status(429).json({
        error: 'Too Many Requests',
        code,
        message: `${message} Please wait ${Math.ceil(retryAfterSec / 60)} minute(s) before trying again.`,
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

/**
 * Pre-configured granular rate limiters for PRIME NEWS GRAPH
 */

// 1. Strict Authentication Limiter: Max 5 attempts per 15 minutes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts on newsroom administration.',
  code: 'AUTH_RATE_LIMIT_EXCEEDED',
  logEventName: 'login_locked',
}, 'auth');

// 2. Comments Submission Limiter: Max 5 comments per 2 minutes per IP (anti-spam)
export const commentRateLimiter = createRateLimiter({
  windowMs: 2 * 60 * 1000,
  max: 5,
  message: 'You are submitting comments too quickly. Please pause briefly before posting again.',
  code: 'COMMENT_RATE_LIMIT_EXCEEDED',
}, 'comment');

// 3. Newsletter Subscription Limiter: Max 5 signups per 5 minutes per IP
export const newsletterRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many newsletter subscription requests from this network.',
  code: 'NEWSLETTER_RATE_LIMIT_EXCEEDED',
}, 'newsletter');

// 4. Article View Debounce Limiter: Max 30 view count increments per minute per IP
export const viewRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Article view rate limit exceeded.',
  code: 'VIEW_RATE_LIMIT_EXCEEDED',
}, 'view');

// 5. Media Upload Limiter: Max 15 uploads per 5 minutes per IP
export const mediaRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: 'Media upload rate limit exceeded. Please wait before uploading more assets.',
  code: 'MEDIA_RATE_LIMIT_EXCEEDED',
}, 'media');

// 6. Sensitive Admin Mutations: Max 60 mutations per minute
export const adminMutationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Administrative operation rate limit exceeded.',
  code: 'ADMIN_MUTATION_RATE_LIMIT_EXCEEDED',
}, 'admin_mutation');

// 7. General API Limiter: Max 200 read requests per minute per IP
export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 200,
  message: 'API request frequency threshold reached.',
  code: 'API_RATE_LIMIT_EXCEEDED',
}, 'api_general');

/**
 * Helper to fetch current rate limit status for administrative diagnostics
 */
export function getRateLimitStats() {
  const activeEntries = [];
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now <= record.resetTime || (record.lockedUntil && now <= record.lockedUntil)) {
      const [namespace, ip] = key.split(':');
      activeEntries.push({
        namespace,
        ip,
        count: record.count,
        isLocked: Boolean(record.lockedUntil && now < record.lockedUntil),
        remainingTimeSec: Math.ceil(((record.lockedUntil || record.resetTime) - now) / 1000),
      });
    }
  }
  return {
    totalActiveClients: activeEntries.length,
    activeEntries: activeEntries.slice(0, 50),
  };
}
