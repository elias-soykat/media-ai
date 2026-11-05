import crypto from 'crypto';

/**
 * Generates a Paddle-compatible webhook signature header for testing and simulation.
 * Format: "ts=<timestamp>;h1=<hmac-sha256-hex>"
 */
export function generatePaddleWebhookSignature(
  rawBody: string,
  secretKey: string,
  timestamp?: number
): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const payloadToSign = `${ts}:${rawBody}`;
  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(payloadToSign)
    .digest('hex');

  return `ts=${ts};h1=${hmac}`;
}

/**
 * Cryptographically verifies that an incoming webhook was dispatched by Paddle.
 * Parses the Paddle-Signature header, computes the expected HMAC-SHA256,
 * and performs timing-safe equality verification.
 */
export function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secretKey: string,
  toleranceSeconds?: number
): boolean {
  if (!signatureHeader || !secretKey || typeof rawBody !== 'string') {
    return false;
  }

  try {
    const parts = signatureHeader.split(';').reduce<Record<string, string>>(
      (acc, part) => {
        const [k, v] = part.trim().split('=');
        if (k && v) {
          acc[k.trim()] = v.trim();
        }
        return acc;
      },
      {}
    );

    const tsStr = parts.ts;
    const receivedHash = parts.h1;

    if (!tsStr || !receivedHash) {
      return false;
    }

    const ts = parseInt(tsStr, 10);
    if (isNaN(ts)) {
      return false;
    }

    // Optional timestamp tolerance check (prevent replay attacks)
    if (toleranceSeconds && toleranceSeconds > 0) {
      const currentTs = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTs - ts) > toleranceSeconds) {
        return false;
      }
    }

    const payloadToSign = `${tsStr}:${rawBody}`;
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(payloadToSign)
      .digest('hex');

    const receivedBuf = Buffer.from(receivedHash, 'hex');
    const expectedBuf = Buffer.from(expectedHash, 'hex');

    if (receivedBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(receivedBuf, expectedBuf);
  } catch {
    return false;
  }
}
