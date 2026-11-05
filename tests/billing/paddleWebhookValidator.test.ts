import { describe, it, expect } from 'vitest';
import {
  verifyPaddleWebhookSignature,
  generatePaddleWebhookSignature,
} from '@/lib/billing/paddleWebhookValidator';

describe('Paddle Webhook Cryptographic Verification', () => {
  it('should verify authentic Paddle HMAC-SHA256 signatures', () => {
    const secret = 'pdl_ntfset_mock_secret_key_123';
    const payload = JSON.stringify({
      event_type: 'transaction.completed',
      data: { id: 'txn_123', custom_data: { userId: 'u1', credits: 50 } },
    });
    const signature = generatePaddleWebhookSignature(payload, secret);

    expect(verifyPaddleWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should reject tampered payload or incorrect secret', () => {
    const secret = 'pdl_ntfset_mock_secret_key_123';
    const payload = JSON.stringify({
      event_type: 'transaction.completed',
      data: { id: 'txn_123' },
    });
    const signature = generatePaddleWebhookSignature(payload, secret);

    expect(verifyPaddleWebhookSignature(payload + 'tampered', signature, secret)).toBe(false);
    expect(verifyPaddleWebhookSignature(payload, signature, 'wrong_secret')).toBe(false);
  });

  it('should reject invalid or malformed signature header formats', () => {
    const secret = 'pdl_ntfset_mock_secret_key_123';
    const payload = JSON.stringify({ test: true });

    expect(verifyPaddleWebhookSignature(payload, '', secret)).toBe(false);
    expect(verifyPaddleWebhookSignature(payload, 'invalid-signature-header', secret)).toBe(false);
    expect(verifyPaddleWebhookSignature(payload, 'ts=12345', secret)).toBe(false);
  });
});

