import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Prisma Database Schema Definitions', () => {
  it('should export a singleton PrismaClient instance', () => {
    expect(prisma).toBeDefined();
  });
});
