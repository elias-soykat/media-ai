import crypto from 'crypto';

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: SESSION_SECRET is not configured in production');
  }
  return secret || 'mock_session_secret_change_in_production_key';
}

/**
 * Hashes a plaintext password using standard PBKDF2 with a cryptographic salt.
 */
export function hashPassword(
  password: string,
  providedSalt?: string
): { hash: string; salt: string; combined: string } {
  const salt = providedSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');

  return { hash, salt, combined: `${salt}:${hash}` };
}

/**
 * Verifies a plaintext password against stored hash and salt with timing-safe comparison.
 * Supports passing either (password, hash, salt) or (password, combinedHashString).
 */
export function verifyPassword(
  password: string,
  hash: string,
  salt?: string
): boolean {
  let targetHash = hash;
  let targetSalt = salt;

  if (!targetSalt && hash.includes(':')) {
    const parts = hash.split(':');
    targetSalt = parts[0];
    targetHash = parts[1];
  }

  if (!targetSalt || !targetHash) {
    return false;
  }

  try {
    const computed = crypto
      .pbkdf2Sync(password, targetSalt, 100000, 64, 'sha512')
      .toString('hex');

    const computedBuf = Buffer.from(computed, 'hex');
    const targetBuf = Buffer.from(targetHash, 'hex');

    if (computedBuf.length !== targetBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuf, targetBuf);
  } catch {
    return false;
  }
}

/**
 * Generates an HMAC-signed session token.
 */
export function generateSessionToken(
  userId: string,
  expiresInSeconds = 7 * 24 * 3600
): string {
  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = getSessionSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Cryptographically verifies and extracts user info from a session token.
 * Returns null if the token is tampered, malformed, or expired.
 */
export function verifySessionToken(
  token: string
): { userId: string } | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadStr, signature] = parts;
  const secret = getSessionSecret();
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadStr, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr);

    if (!payload.userId || typeof payload.exp !== 'number') {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return { userId: payload.userId };
  } catch {
    return null;
  }
}

