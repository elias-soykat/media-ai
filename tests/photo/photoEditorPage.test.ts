// tests/photo/photoEditorPage.test.ts
import { describe, it, expect } from 'vitest';
import { PHOTO_TOOLS } from '@/components/photo/PhotoSidebarControls';

describe('Photo Editor Workspace Tools', () => {
  it('should provide all 7 PRD Phase 2 photo editing tools', () => {
    const ids = PHOTO_TOOLS.map((t) => t.id);
    expect(ids).toContain('bg-remover');
    expect(ids).toContain('bg-changer');
    expect(ids).toContain('enhancer');
    expect(ids).toContain('cropper');
    expect(ids).toContain('resizer');
    expect(ids).toContain('compressor');
    expect(ids).toContain('converter');
  });
});
