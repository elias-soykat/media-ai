import { describe, it, expect } from 'vitest';
import { isJobExpired, formatTimeRemaining } from '@/lib/jobs/expiry';

describe('My Projects Expiration & History', () => {
  it('should correctly determine if a job is expired', () => {
    const activeDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(); // 5 hours in future
    const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours in past

    expect(isJobExpired(activeDate)).toBe(false);
    expect(isJobExpired(expiredDate)).toBe(true);
    expect(isJobExpired(null)).toBe(false);
  });

  it('should format remaining time cleanly in hours and minutes', () => {
    const futureDate = new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString();
    const formatted = formatTimeRemaining(futureDate);
    expect(formatted).toMatch(/1[78]h/);

    const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
    expect(formatTimeRemaining(pastDate)).toBe('Expired');
  });
});

