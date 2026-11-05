import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  verifySessionToken,
} from '@/lib/auth/authService';

describe('Auth Service Cryptography', () => {
  it('should hash and verify passwords with salt securely', () => {
    const password = 'SecurePassword123!';
    const { hash, salt } = hashPassword(password);
    expect(hash).toBeDefined();
    expect(salt).toBeDefined();

    expect(verifyPassword(password, hash, salt)).toBe(true);
    expect(verifyPassword('WrongPassword', hash, salt)).toBe(false);
  });

  it('should generate different salts for the same password', () => {
    const p1 = hashPassword('SamePassword');
    const p2 = hashPassword('SamePassword');
    expect(p1.salt).not.toBe(p2.salt);
    expect(p1.hash).not.toBe(p2.hash);
  });

  it('should generate and verify signed session tokens', () => {
    const token = generateSessionToken('user_abc_123');
    const session = verifySessionToken(token);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe('user_abc_123');
  });

  it('should reject tampered or expired session tokens', () => {
    const token = generateSessionToken('user_abc_123');
    expect(verifySessionToken(token + 'tamper')).toBeNull();
    expect(verifySessionToken('invalid.token')).toBeNull();

    // Expired token test (expiresInSeconds = -1)
    const expiredToken = generateSessionToken('user_abc_123', -1);
    expect(verifySessionToken(expiredToken)).toBeNull();
  });
});
