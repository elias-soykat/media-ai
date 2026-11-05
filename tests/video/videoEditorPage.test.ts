// tests/video/videoEditorPage.test.ts
import { describe, it, expect } from 'vitest';
import { VIDEO_TOOLS } from '@/components/video/VideoSidebarControls';

describe('Video Editor Workspace Tools', () => {
  it('should provide all 5 PRD Phase 3 video editing tools', () => {
    const ids = VIDEO_TOOLS.map((t) => t.id);
    expect(ids).toContain('trimmer');
    expect(ids).toContain('compressor');
    expect(ids).toContain('resizer');
    expect(ids).toContain('converter');
    expect(ids).toContain('noise-remover');
  });
});
