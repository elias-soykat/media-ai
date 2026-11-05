import { APP_CONSTRAINTS } from '@/config/constraints';
import { AppConstraints } from '@/types/constraints';
import { prisma } from '@/lib/prisma';

export async function getMergedConstraints(): Promise<AppConstraints> {
  try {
    const dbConstraints = await prisma.systemConstraint.findMany();
    if (!dbConstraints || dbConstraints.length === 0) {
      return APP_CONSTRAINTS;
    }

    const merged: AppConstraints = JSON.parse(JSON.stringify(APP_CONSTRAINTS));

    for (const record of dbConstraints) {
      const keys = record.key.split('.');
      let current: any = merged;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k]) current[k] = {};
        current = current[k];
      }
      current[keys[keys.length - 1]] = record.value;
    }

    return merged;
  } catch (error) {
    // If database is not yet connected or during cold starts, safely return static defaults
    return APP_CONSTRAINTS;
  }
}

