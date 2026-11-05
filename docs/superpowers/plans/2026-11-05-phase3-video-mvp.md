# Phase 3: Video MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, browser-native Video MVP featuring Video Trimmer, Video Compressor, Video Resizer, Video Format Converter, and a Hybrid Bandwidth-Optimized AI Audio Noise Remover with 100% test coverage and zero unexpected server costs.

**Architecture:** Standard video utilities (Trimmer, Compressor, Resizer, Converter) run client-side using WebCodecs/Canvas/Web Audio to eliminate expensive cloud compute and storage egress fees. The AI Audio Noise Remover uses a hybrid pipeline: audio is extracted client-side (2–5 MB WAV), uploaded to `/api/audio/remove-noise` with entitlement & credit verification (1 free trial run, 1 credit per 30s), cleaned by an AI adapter, returned to the browser, and remuxed with the original video stream.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, HTML5 Video & Canvas API, Web Audio API, Prisma ORM, Vitest.

**Spec:** `docs/PRD.md`

## Global Constraints

- Max video file size: 100 MB (`104857600` bytes) (Configurable via `APP_CONSTRAINTS.video.maxFileSizeBytes`).
- Max video duration: 180 seconds (3 minutes) (`APP_CONSTRAINTS.video.maxDurationSeconds`).
- Max video resolution: 1080p (1920 × 1080) (`APP_CONSTRAINTS.video.maxResolution`).
- Supported video containers: MP4, WebM, QuickTime (MOV) (`APP_CONSTRAINTS.video.supportedMimeTypes`).
- Temporary storage retention: 24 hours (`APP_CONSTRAINTS.storage.retentionHours`).
- Free processing allowance: Exactly 1 free run per account per feature (`APP_CONSTRAINTS.billing.initialFreeCredits`).
- AI Audio Noise Removal cost: 1 credit per 30 seconds of audio (`APP_CONSTRAINTS.billing.costs.audioNoiseRemovalPer30s`).

## Review Focus

1. **Audio/Video Synchronization:** Trimming and audio remuxing must preserve sync between the audio track and video timeline without drifting.
2. **Bounds & Zero-Duration Protection:** Trim timestamps must enforce $0 \le \text{start} < \text{end} \le \text{duration}$ with a minimum clip duration of 0.5s to prevent corrupt 0-byte video exports.
3. **Credit Deduction Safety:** If the external AI audio provider fails, `/api/audio/remove-noise` must return HTTP 502 without deducting user credits or consuming the free trial.
4. **Browser Memory & 100MB Cap:** Large video files must not be copied repeatedly into memory buffers; use blob URLs and stream references where possible.
5. **CORS & Tainting Safety:** All remote media and canvas video grabs must set `crossOrigin = 'anonymous'` to prevent export blocks.

---

### Task 1: Video Timing, Trimming & Metadata Mathematics Engine

**Files:**
- Create: `src/lib/video/videoTrimmer.ts`
- Test: `tests/video/videoTrimmer.test.ts`

**Interfaces:**
- Consumes: Video time parameters (seconds, string formats, duration).
- Produces:
  - `parseTimestamp(timeStr: string): number`
  - `formatTimestamp(seconds: number, includeHours?: boolean): string`
  - `validateTrimRange(startTime: number, endTime: number, duration: number, minDuration?: number): { isValid: boolean; error?: string }`
  - `calculateTrimmedDuration(startTime: number, endTime: number): number`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/video/videoTrimmer.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseTimestamp,
  formatTimestamp,
  validateTrimRange,
  calculateTrimmedDuration,
} from '@/lib/video/videoTrimmer';

describe('Video Trimmer Engine', () => {
  it('should format seconds into MM:SS and HH:MM:SS correctly', () => {
    expect(formatTimestamp(65)).toBe('01:05');
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(3665, true)).toBe('01:01:05');
  });

  it('should parse timestamp strings into float seconds accurately', () => {
    expect(parseTimestamp('01:05')).toBe(65);
    expect(parseTimestamp('01:01:05')).toBe(3665);
    expect(parseTimestamp('12.5')).toBe(12.5);
    expect(parseTimestamp('invalid')).toBe(0);
  });

  it('should validate trim ranges and reject inverted or out-of-bound times', () => {
    expect(validateTrimRange(0, 10, 60).isValid).toBe(true);
    // Inverted range
    expect(validateTrimRange(20, 10, 60).isValid).toBe(false);
    // Exceeds total duration
    expect(validateTrimRange(0, 70, 60).isValid).toBe(false);
    // Sub-minimum duration (< 0.5s)
    expect(validateTrimRange(10, 10.2, 60).isValid).toBe(false);
  });

  it('should calculate trimmed duration accurately', () => {
    expect(calculateTrimmedDuration(10.5, 25.2)).toBeCloseTo(14.7, 2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/video/videoTrimmer.test.ts`
Expected: FAIL with "Cannot find module '@/lib/video/videoTrimmer'".

- [ ] **Step 3: Implement `src/lib/video/videoTrimmer.ts`**

Implement time parsing, formatting, range validation with minimum clip threshold (default 0.5s), and duration math.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/video/videoTrimmer.test.ts`
Expected: PASS with 4 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/video/videoTrimmer.ts tests/video/videoTrimmer.test.ts
git commit -m "feat: implement video trimmer timing calculations and range validation engine"
```

---

### Task 2: Video Transformation & Resizing Engine (Aspect Ratio, Fit & Bitrate Estimation)

**Files:**
- Create: `src/lib/video/videoTransforms.ts`
- Test: `tests/video/videoTransforms.test.ts`

**Interfaces:**
- Consumes: Video dimensions, target aspect ratio, quality preset, duration.
- Produces:
  - `calculateVideoCropRect(sourceWidth: number, sourceHeight: number, targetAspectRatio: string): { x: number; y: number; width: number; height: number }`
  - `calculateVideoScaledDimensions(sourceWidth: number, sourceHeight: number, targetResolution: '1080p' | '720p' | '480p'): { width: number; height: number }`
  - `estimateCompressedVideoSize(durationSeconds: number, targetResolution: string, qualityPreset: 'low' | 'medium' | 'high'): number`
  - `SUPPORTED_VIDEO_PRESETS`: Object containing presets for 16:9, 9:16, 1:1, 4:5.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/video/videoTransforms.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateVideoCropRect,
  calculateVideoScaledDimensions,
  estimateCompressedVideoSize,
  SUPPORTED_VIDEO_PRESETS,
} from '@/lib/video/videoTransforms';

describe('Video Transforms Engine', () => {
  it('should calculate centered crop rect for 9:16 vertical video from 16:9 landscape source', () => {
    // 1920x1080 source cropped to 9:16
    const rect = calculateVideoCropRect(1920, 1080, '9:16');
    expect(rect.height).toBe(1080);
    // 1080 * (9/16) = 607.5 -> 608px
    expect(rect.width).toBe(608);
    expect(rect.x).toBe(Math.round((1920 - 608) / 2));
    expect(rect.y).toBe(0);
  });

  it('should scale 1080p video down to 720p and 480p maintaining aspect ratio', () => {
    const s720 = calculateVideoScaledDimensions(1920, 1080, '720p');
    expect(s720.width).toBe(1280);
    expect(s720.height).toBe(720);

    const s480 = calculateVideoScaledDimensions(1920, 1080, '480p');
    expect(s480.width).toBe(854);
    expect(s480.height).toBe(480);
  });

  it('should estimate compressed video file size in bytes based on bitrate and duration', () => {
    // 60 second 1080p medium compression video
    const bytes = estimateCompressedVideoSize(60, '1080p', 'medium');
    expect(bytes).toBeGreaterThan(10 * 1024 * 1024); // > 10MB
    expect(bytes).toBeLessThan(40 * 1024 * 1024); // < 40MB
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/video/videoTransforms.test.ts`
Expected: FAIL with "Cannot find module '@/lib/video/videoTransforms'".

- [ ] **Step 3: Implement `src/lib/video/videoTransforms.ts`**

Implement aspect ratio geometry (`16:9`, `9:16`, `1:1`, `4:5`), resolution downscaling (`1080p`, `720p`, `480p`), bitrate estimation calculation for low/medium/high quality, and presets.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/video/videoTransforms.test.ts`
Expected: PASS with 3 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/video/videoTransforms.ts tests/video/videoTransforms.test.ts
git commit -m "feat: implement video cropping, downscaling, and compressed size estimation engine"
```

---

### Task 3: Client-Side Audio Extractor & Hybrid Remuxing Engine

**Files:**
- Create: `src/lib/video/audioRemuxer.ts`
- Test: `tests/video/audioRemuxer.test.ts`

**Interfaces:**
- Consumes: Video and Audio elements / streams / Blobs.
- Produces:
  - `calculateAudioExtractionUnits(durationSeconds: number): { units: number; costCredits: number }`
  - `createRemuxedStream(videoEl: HTMLVideoElement, audioEl: HTMLAudioElement): MediaStream`
  - `AUDIO_CLEANING_PRESETS`: List of speech cleaning intensity levels.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/video/audioRemuxer.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateAudioExtractionUnits,
  AUDIO_CLEANING_PRESETS,
} from '@/lib/video/audioRemuxer';

describe('Audio Remuxing & Extraction Calculator', () => {
  it('should calculate 30-second billing units correctly (1 credit per 30s)', () => {
    expect(calculateAudioExtractionUnits(15)).toEqual({ units: 1, costCredits: 1 });
    expect(calculateAudioExtractionUnits(30)).toEqual({ units: 1, costCredits: 1 });
    expect(calculateAudioExtractionUnits(31)).toEqual({ units: 2, costCredits: 2 });
    expect(calculateAudioExtractionUnits(75)).toEqual({ units: 3, costCredits: 3 });
  });

  it('should provide standard noise removal presets', () => {
    expect(AUDIO_CLEANING_PRESETS).toHaveProperty('balanced');
    expect(AUDIO_CLEANING_PRESETS).toHaveProperty('aggressive');
    expect(AUDIO_CLEANING_PRESETS).toHaveProperty('subtle');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/video/audioRemuxer.test.ts`
Expected: FAIL with "Cannot find module '@/lib/video/audioRemuxer'".

- [ ] **Step 3: Implement `src/lib/video/audioRemuxer.ts`**

Implement unit calculation (ceiling of duration / 30s), presets, and browser stream substitution helper combining original video track with cleaned audio track.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/video/audioRemuxer.test.ts`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/video/audioRemuxer.ts tests/video/audioRemuxer.test.ts
git commit -m "feat: implement audio extraction unit pricing calculator and stream remuxing helper"
```

---

### Task 4: AI Audio Noise Remover Adapter & Backend API Endpoint (`/api/audio/remove-noise`)

**Files:**
- Create: `src/lib/ai/audioProvider.ts`
- Create: `src/app/api/audio/remove-noise/route.ts`
- Test: `tests/ai/audioProvider.test.ts`
- Test: `tests/api/removeNoiseRoute.test.ts`

**Interfaces:**
- Consumes: Audio URL or base64 audio, `userId`, duration.
- Produces: `POST /api/audio/remove-noise` returning `{ jobId, outputAudioUrl, isFreeTrial, remainingCredits }`.

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/api/removeNoiseRoute.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/audio/remove-noise/route';
import { NextRequest } from 'next/server';

describe('POST /api/audio/remove-noise', () => {
  it('should reject unauthenticated requests without userId with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/audio/remove-noise', {
      method: 'POST',
      body: JSON.stringify({ audioUrl: 'https://r2.domain.com/temp/audio.wav', durationSeconds: 30 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should reject with 402 if user has exhausted free trial and has zero credits', async () => {
    const req = new NextRequest('http://localhost:3000/api/audio/remove-noise', {
      method: 'POST',
      body: JSON.stringify({
        audioUrl: 'https://r2.domain.com/temp/audio.wav',
        userId: 'mock_exhausted_user',
        durationSeconds: 30,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(402);
  });

  it('should process noise removal successfully for eligible user', async () => {
    const req = new NextRequest('http://localhost:3000/api/audio/remove-noise', {
      method: 'POST',
      body: JSON.stringify({
        audioUrl: 'https://r2.domain.com/temp/audio.wav',
        userId: 'new_video_user_1',
        durationSeconds: 30,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.outputAudioUrl).toBeDefined();
    expect(json.isFreeTrial).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/api/removeNoiseRoute.test.ts`
Expected: FAIL with "Cannot find module '@/app/api/audio/remove-noise/route'".

- [ ] **Step 3: Implement `src/lib/ai/audioProvider.ts` and `src/app/api/audio/remove-noise/route.ts`**

Define `AudioAiProvider` interface with `MockAudioAiProvider`. Implement route checking `checkUserEligibility` for `AUDIO_NOISE_REMOVER`. Calculate credit cost based on duration (1 credit per 30s). Record completed Job in Prisma with 24-hour expiration. Deduct credits if not on free trial. Return HTTP 502 without credit deduction on provider failure.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/api/removeNoiseRoute.test.ts`
Expected: PASS with 3 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/audioProvider.ts src/app/api/audio/remove-noise/route.ts tests/ai/audioProvider.test.ts tests/api/removeNoiseRoute.test.ts
git commit -m "feat: implement AI audio noise remover provider and backend API route"
```

---

### Task 5: Video Timeline & Trimmer Component

**Files:**
- Create: `src/components/video/VideoTimeline.tsx`
- Test: `tests/video/videoTimeline.test.ts`

**Interfaces:**
- Consumes: `duration: number`, `currentTime: number`, `startTime: number`, `endTime: number`, `onTrimChange: (start: number, end: number) => void`, `onSeek: (time: number) => void`, `isPlaying: boolean`, `onTogglePlay: () => void`.
- Produces: Visual scrubbing timeline bar with draggable start/end handles and current playhead.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/video/videoTimeline.test.ts
import { describe, it, expect } from 'vitest';
import { calculateHandlePositions } from '@/components/video/VideoTimeline';

describe('Video Timeline Component Logic', () => {
  it('should calculate percentage positions for start and end trim handles', () => {
    // 60s total, start at 15s, end at 45s
    const { startPct, endPct } = calculateHandlePositions(15, 45, 60);
    expect(startPct).toBe(25);
    expect(endPct).toBe(75);
  });

  it('should handle zero duration gracefully', () => {
    const { startPct, endPct } = calculateHandlePositions(0, 0, 0);
    expect(startPct).toBe(0);
    expect(endPct).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/video/videoTimeline.test.ts`
Expected: FAIL with "Cannot find module '@/components/video/VideoTimeline'".

- [ ] **Step 3: Implement `src/components/video/VideoTimeline.tsx`**

Implement `calculateHandlePositions` and interactive timeline with play/pause button, timecode displays (`00:15 / 01:00`), dual trim slider handles, and scrubbable track.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/video/videoTimeline.test.ts`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/video/VideoTimeline.tsx tests/video/videoTimeline.test.ts
git commit -m "feat: implement interactive video timeline and dual-handle trim slider"
```

---

### Task 6: Unified Video Editor Workspace Page (`/video-editor`)

**Files:**
- Create: `src/components/video/VideoSidebarControls.tsx`
- Create: `src/app/video-editor/page.tsx`
- Test: `tests/video/videoEditorPage.test.ts`

**Interfaces:**
- Consumes: `WorkspaceShell`, `VideoPreview`, `VideoTimeline`, `MediaDropzone`, `videoTrimmer`, `videoTransforms`, `audioRemuxer`.
- Produces: Complete interactive video editor studio supporting all 5 Phase 3 tools:
  1. Video Trimmer (`trimmer`)
  2. Video Compressor (`compressor`)
  3. Video Resizer (`resizer`)
  4. Format Converter (`converter`)
  5. AI Audio Noise Remover (`noise-remover`)

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/video/videoEditorPage.test.ts`
Expected: FAIL with "Cannot find module '@/components/video/VideoSidebarControls'".

- [ ] **Step 3: Implement `VideoSidebarControls.tsx` and `src/app/video-editor/page.tsx`**

Build `VideoSidebarControls.tsx` with controls for all 5 tools (trim timecodes, quality presets, aspect ratio buttons, target format selection, and 1-click AI Audio Noise Removal with before/after audio toggle). Build `src/app/video-editor/page.tsx` embedding `WorkspaceShell`, video state management, video playback, timeline scrubbing, and export download button.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/video/videoEditorPage.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add src/components/video/VideoSidebarControls.tsx src/app/video-editor/page.tsx tests/video/videoEditorPage.test.ts
git commit -m "feat: implement unified 5-tool video editor workspace studio"
```

---

### Task 7: End-to-End Video MVP Integration Suite & Production Build Verification

**Files:**
- Create: `tests/e2e/videoMvpFlow.test.ts`

**Interfaces:**
- Consumes: All Phase 3 video modules.
- Produces: 100% passing test suite across all 5 video tools and clean Next.js build.

- [ ] **Step 1: Write the test**

```typescript
// tests/e2e/videoMvpFlow.test.ts
import { describe, it, expect } from 'vitest';
import { validateTrimRange, calculateTrimmedDuration } from '@/lib/video/videoTrimmer';
import { calculateVideoCropRect, calculateVideoScaledDimensions, estimateCompressedVideoSize } from '@/lib/video/videoTransforms';
import { calculateAudioExtractionUnits } from '@/lib/video/audioRemuxer';
import { MockAudioAiProvider } from '@/lib/ai/audioProvider';

describe('Phase 3 Video MVP End-to-End Integration Suite', () => {
  it('should successfully chain trim validation, crop calculation, scale, and noise removal', async () => {
    // 1. Trimmer range validation
    const trim = validateTrimRange(10, 40, 120);
    expect(trim.isValid).toBe(true);
    const duration = calculateTrimmedDuration(10, 40);
    expect(duration).toBe(30);

    // 2. Crop to vertical 9:16
    const crop = calculateVideoCropRect(1920, 1080, '9:16');
    expect(crop.width).toBe(608);

    // 3. Scale down to 720p
    const scaled = calculateVideoScaledDimensions(1920, 1080, '720p');
    expect(scaled.width).toBe(1280);

    // 4. Estimate compressed file size
    const estBytes = estimateCompressedVideoSize(duration, '720p', 'medium');
    expect(estBytes).toBeGreaterThan(0);

    // 5. Calculate audio units (30s = 1 unit)
    const audioUnits = calculateAudioExtractionUnits(duration);
    expect(audioUnits.costCredits).toBe(1);

    // 6. AI Audio Noise Removal execution
    const provider = new MockAudioAiProvider();
    const result = await provider.removeNoise({ audioUrl: 'https://example.com/audio.wav', durationSeconds: duration });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/e2e/videoMvpFlow.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 3: Run full test suite and verify production build**

Run: `./node_modules/.bin/vitest run`
Expected: All tests pass.
Run: `./node_modules/.bin/next build`
Expected: Production build succeeds with `/video-editor` prerendered.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/videoMvpFlow.test.ts
git commit -m "test: add Phase 3 video MVP end-to-end integration test suite"
```

