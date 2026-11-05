import { describe, it, expect } from 'vitest';
import { NAV_ITEMS } from '@/components/layout/Navbar';

describe('Navigation Items Configuration', () => {
  it('should contain all required PRD navigation items', () => {
    const titles = NAV_ITEMS.map((item) => item.label);
    expect(titles).toContain('Home');
    expect(titles).toContain('Photo Editor');
    expect(titles).toContain('Video Editor');
    expect(titles).toContain('AI Tools');
    expect(titles).toContain('My Projects');
    expect(titles).toContain('Pricing');
  });
});

