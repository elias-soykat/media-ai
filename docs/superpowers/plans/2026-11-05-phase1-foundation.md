# Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete core foundation for the AI-powered online photo and video editing platform: full-stack Next.js application scaffolding, centralized typed constraints with PostgreSQL runtime overrides, dual-layer client/server validation, responsive application design system shell, transient Cloudflare R2 storage integration, asynchronous provider webhook infrastructure, and browser media utilities.

**Architecture:** A unified full-stack monorepo built on Next.js 15 (App Router with TypeScript). Centralized typed configuration (`APP_CONSTRAINTS`) acts as the single source of truth, dynamically merged with database overrides (`system_constraints` table) and synchronized with the frontend via `/api/config/limits`. Pre-flight client checks prevent browser stalls, while authoritative server endpoints validate signed URLs and webhook callbacks. Transient media files are staged on Cloudflare R2 with 24-hour retention.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Lucide React, PostgreSQL (Supabase/Neon), Prisma ORM, @aws-sdk/client-s3 (Cloudflare R2), Vitest.

**Spec:** [`docs/PRD.md`](file:///home/elias/elias/online-editing/docs/PRD.md)

## Global Constraints

- Max photo file size: 25 MB (`26214400` bytes).
- Max image dimensions: 8192 × 8192 px.
- Supported image MIME types: `image/jpeg`, `image/png`, `image/webp`.
- Max video file size: 100 MB (`104857600` bytes).
- Max video duration: 180 seconds (3 minutes).
- Max video resolution: 1080p (1920 × 1080 px).
- Supported video MIME types: `video/mp4`, `video/webm`, `video/quicktime`.
- Max client-extracted audio file size: 10 MB (`10485760` bytes).
- Temporary media retention: 24 hours (`MEDIA_RETENTION_HOURS = 24`).
- Free AI trial allowance: Exactly 1 successful free run per feature per account (`INITIAL_FREE_AI_CREDITS = 1`).
- Merchant of Record: Paddle primary, Lemon Squeezy alternative.
- Deployment target: Single low-cost VPS ($6–$10/mo with PM2/Docker + Caddy/Nginx).
- Constraints must be adjustable through configuration rather than hardcoded throughout the application.

## Review Focus

1. **Oversized or malformed video upload:** Client attempts to select a 120MB video or video exceeding 180s duration — the client immediately detects and blocks processing via HTML5 video metadata check before any memory buffer allocation or server request.
2. **Direct API bypass of constraints:** Client bypasses frontend checks and calls `/api/media/upload-url` with spoofed content length or invalid MIME type — backend strictly validates against `APP_CONSTRAINTS` + DB overrides and rejects with HTTP 413 or 422.
3. **Exhausted free tier credit abuse:** A user who already consumed their 1 free run on background removal attempts another request without purchasing credits — server rejects upload URL generation with HTTP 402 (Payment Required).
4. **Duplicate webhook callback delivery:** Provider sends multiple identical webhook events for the same completed job — backend processes idempotently, updating status once without duplicate credit deductions or duplicate records.
5. **Transient file expiry boundary:** User accesses "My Projects" after the 24-hour retention window has passed — UI safely renders the persistent job metadata with an "Expired" status badge and disables download buttons without 404 broken link crashes.

---

### Task 1: Next.js App Router Scaffolding, TypeScript, Tailwind CSS & Vitest Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Consumes: Node.js 24 environment, npm/pnpm.
- Produces: Runnable Next.js application, Tailwind CSS styling system, Vitest runner with passing smoke test.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/setup.test.ts
import { describe, it, expect } from 'vitest';

describe('Project Foundation Setup', () => {
  it('should verify test environment is properly configured', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/setup.test.ts`
Expected: FAIL (vitest not installed or command missing).

- [ ] **Step 3: Scaffold Next.js 15, Tailwind CSS, TypeScript, and Vitest**

Initialize package.json with dependencies (`next`, `react`, `react-dom`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `typescript`, `@types/node`, `@types/react`), install packages, configure `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, and `vitest.config.ts`. Set up `src/app/layout.tsx` and basic `src/app/page.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/setup.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs vitest.config.ts src/ tests/
git commit -m "chore: scaffold Next.js App Router, Tailwind CSS, and Vitest"
```

---

### Task 2: Centralized Typed Constraints (`APP_CONSTRAINTS`) & API Config Endpoint

**Files:**
- Create: `src/config/constraints.ts`
- Create: `src/types/constraints.ts`
- Create: `src/app/api/config/limits/route.ts`
- Test: `tests/config/constraints.test.ts`

**Interfaces:**
- Consumes: None (root configuration definitions).
- Produces: `APP_CONSTRAINTS` object, `AppConstraints` type, `GET /api/config/limits` handler returning serialized constraints with client cache headers.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/config/constraints.test.ts
import { describe, it, expect } from 'vitest';
import { APP_CONSTRAINTS } from '@/config/constraints';

describe('APP_CONSTRAINTS Configuration', () => {
  it('should enforce the exact PRD photo constraints', () => {
    expect(APP_CONSTRAINTS.photo.maxFileSizeBytes).toBe(25 * 1024 * 1024);
    expect(APP_CONSTRAINTS.photo.maxDimensionPx).toBe(8192);
    expect(APP_CONSTRAINTS.photo.supportedMimeTypes).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });

  it('should enforce the exact PRD video constraints', () => {
    expect(APP_CONSTRAINTS.video.maxFileSizeBytes).toBe(100 * 1024 * 1024);
    expect(APP_CONSTRAINTS.video.maxDurationSeconds).toBe(180);
    expect(APP_CONSTRAINTS.video.maxResolution).toEqual({ width: 1920, height: 1080 });
    expect(APP_CONSTRAINTS.video.supportedMimeTypes).toEqual(['video/mp4', 'video/webm', 'video/quicktime']);
  });

  it('should define storage retention and billing defaults', () => {
    expect(APP_CONSTRAINTS.storage.retentionHours).toBe(24);
    expect(APP_CONSTRAINTS.billing.initialFreeCredits).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/config/constraints.test.ts`
Expected: FAIL with "Cannot find module '@/config/constraints'".

- [ ] **Step 3: Implement `APP_CONSTRAINTS` and `GET /api/config/limits`**

Create `src/types/constraints.ts` defining the typed schemas. Create `src/config/constraints.ts` with deep freeze / typed constant `APP_CONSTRAINTS`. Implement `src/app/api/config/limits/route.ts` to expose constraints as JSON with `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/config/constraints.test.ts`
Expected: PASS with 3 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/config/constraints.ts src/types/constraints.ts src/app/api/config/limits/route.ts tests/config/constraints.test.ts
git commit -m "feat: add centralized typed constraints and limits API endpoint"
```

---

### Task 3: Database Schema (Prisma ORM: Users, Jobs, SystemConstraints, Credits)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Test: `tests/db/schema.test.ts`

**Interfaces:**
- Consumes: PostgreSQL connection string (`DATABASE_URL`).
- Produces: Prisma Client instance (`prisma`), models for `User`, `Job`, `SystemConstraint`, `CreditTransaction`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/db/schema.test.ts
import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Prisma Database Schema Definitions', () => {
  it('should export a singleton PrismaClient instance', () => {
    expect(prisma).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db/schema.test.ts`
Expected: FAIL with "Cannot find module '@/lib/prisma'".

- [ ] **Step 3: Define schema in `prisma/schema.prisma` and implement `src/lib/prisma.ts`**

Define models:
- `User`: id, email, passwordHash, createdAt, updatedAt, creditBalance (default: 0).
- `Job`: id, userId (nullable for guest/free trial), toolType (`PHOTO_BG_REMOVER`, `PHOTO_BG_CHANGER`, `AUDIO_NOISE_REMOVER`, etc.), status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`), inputUrl, outputUrl, metadata (JSON), errorMessage, createdAt, expiresAt (default: now + 24 hours).
- `SystemConstraint`: key (String, primary key), value (JSON), description, updatedAt.
- `CreditTransaction`: id, userId, amount, reason, createdAt.
Set up `src/lib/prisma.ts` with global caching for Next.js hot-reloading.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db/schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts tests/db/schema.test.ts
git commit -m "feat: add Prisma database schema for users, jobs, constraints, and credits"
```

---

### Task 4: Authoritative Media & Validation Service with Database Constraint Overrides

**Files:**
- Create: `src/lib/validation/mediaValidator.ts`
- Create: `src/lib/config/getMergedConstraints.ts`
- Test: `tests/validation/mediaValidator.test.ts`

**Interfaces:**
- Consumes: `APP_CONSTRAINTS` from `src/config/constraints.ts`, `prisma.systemConstraint`.
- Produces: `getMergedConstraints(): Promise<AppConstraints>`, `validateMediaUpload(payload: MediaUploadValidationInput): ValidationResult`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/validation/mediaValidator.test.ts
import { describe, it, expect } from 'vitest';
import { validateMediaUpload } from '@/lib/validation/mediaValidator';
import { APP_CONSTRAINTS } from '@/config/constraints';

describe('Authoritative Media Validator', () => {
  it('should approve valid photo uploads within constraints', () => {
    const result = validateMediaUpload({
      mediaType: 'photo',
      fileSizeBytes: 5 * 1024 * 1024,
      mimeType: 'image/jpeg',
      dimensions: { width: 1920, height: 1080 },
    }, APP_CONSTRAINTS);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject photo exceeding 25MB file size limit', () => {
    const result = validateMediaUpload({
      mediaType: 'photo',
      fileSizeBytes: 26 * 1024 * 1024,
      mimeType: 'image/jpeg',
    }, APP_CONSTRAINTS);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Photo file size exceeds maximum limit of 25MB');
  });

  it('should reject video exceeding 180 seconds duration', () => {
    const result = validateMediaUpload({
      mediaType: 'video',
      fileSizeBytes: 50 * 1024 * 1024,
      mimeType: 'video/mp4',
      durationSeconds: 195,
    }, APP_CONSTRAINTS);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Video duration exceeds maximum limit of 180 seconds');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/validation/mediaValidator.test.ts`
Expected: FAIL with "Cannot find module '@/lib/validation/mediaValidator'".

- [ ] **Step 3: Implement `mediaValidator.ts` and `getMergedConstraints.ts`**

Implement `getMergedConstraints()` to load DB overrides from `system_constraints` table and merge over `APP_CONSTRAINTS`. Implement `validateMediaUpload` checking file size, MIME type, dimensions (for photos), and duration/resolution (for videos), returning `{ isValid: boolean, errors: string[] }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/validation/mediaValidator.test.ts`
Expected: PASS with 3 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation/mediaValidator.ts src/lib/config/getMergedConstraints.ts tests/validation/mediaValidator.test.ts
git commit -m "feat: implement media validation service with dynamic DB constraint overrides"
```

---

### Task 5: Cloudflare R2 Temporary Storage Service

**Files:**
- Create: `src/lib/storage/r2Client.ts`
- Create: `src/lib/storage/presignedUrls.ts`
- Create: `src/app/api/media/upload-url/route.ts`
- Test: `tests/storage/presignedUrls.test.ts`

**Interfaces:**
- Consumes: AWS S3 SDK (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`), `validateMediaUpload`.
- Produces: `getR2Client()`, `generatePresignedUploadUrl(params)`, `generatePresignedDownloadUrl(key)`, `POST /api/media/upload-url` route handler.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/storage/presignedUrls.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildStorageKey } from '@/lib/storage/presignedUrls';

describe('R2 Storage Key Generation', () => {
  it('should generate properly partitioned transient storage keys with 24h namespace', () => {
    const key = buildStorageKey({ userId: 'user_123', toolType: 'photo_bg_remover', extension: 'png' });
    expect(key).toMatch(/^temp\/user_123\/photo_bg_remover\/[a-zA-Z0-9_-]+\.png$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/storage/presignedUrls.test.ts`
Expected: FAIL with "Cannot find module '@/lib/storage/presignedUrls'".

- [ ] **Step 3: Implement R2 client and signed URL generator**

Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`. Implement `src/lib/storage/r2Client.ts` with S3Client configured for Cloudflare R2 endpoint (`https://<account_id>.r2.cloudflarestorage.com`). Implement `src/lib/storage/presignedUrls.ts` generating signed PutObject and GetObject URLs with expiry matching `APP_CONSTRAINTS.storage.signedUrlExpirySeconds`. Implement `src/app/api/media/upload-url/route.ts` validating upload requests before returning presigned URLs.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/storage/presignedUrls.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage/r2Client.ts src/lib/storage/presignedUrls.ts src/app/api/media/upload-url/route.ts tests/storage/presignedUrls.test.ts
git commit -m "feat: add Cloudflare R2 storage client and presigned URL generation"
```

---

### Task 6: Webhook Callback Endpoint & Job State Machine

**Files:**
- Create: `src/lib/jobs/jobManager.ts`
- Create: `src/app/api/webhooks/ai-provider/route.ts`
- Test: `tests/webhooks/aiProviderWebhook.test.ts`

**Interfaces:**
- Consumes: Prisma `Job` and `CreditTransaction` models.
- Produces: `createJob()`, `completeJob()`, `failJob()`, `POST /api/webhooks/ai-provider` route handler.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/webhooks/aiProviderWebhook.test.ts
import { describe, it, expect } from 'vitest';
import { parseWebhookPayload } from '@/lib/jobs/jobManager';

describe('AI Provider Webhook Parser', () => {
  it('should parse completed provider job and extract result url', () => {
    const rawPayload = {
      job_id: 'job_xyz123',
      status: 'completed',
      output: { url: 'https://r2.domain.com/temp/result.png' },
    };
    const parsed = parseWebhookPayload(rawPayload);
    expect(parsed.jobId).toBe('job_xyz123');
    expect(parsed.status).toBe('COMPLETED');
    expect(parsed.outputUrl).toBe('https://r2.domain.com/temp/result.png');
  });

  it('should parse failed provider job and capture error reason', () => {
    const rawPayload = {
      job_id: 'job_fail456',
      status: 'failed',
      error: 'Subject segmentation ambiguous',
    };
    const parsed = parseWebhookPayload(rawPayload);
    expect(parsed.jobId).toBe('job_fail456');
    expect(parsed.status).toBe('FAILED');
    expect(parsed.errorMessage).toBe('Subject segmentation ambiguous');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/webhooks/aiProviderWebhook.test.ts`
Expected: FAIL with "Cannot find module '@/lib/jobs/jobManager'".

- [ ] **Step 3: Implement `jobManager.ts` and `POST /api/webhooks/ai-provider`**

Implement idempotent state transitions: if job is already `COMPLETED`, ignore duplicate webhooks. On successful completion, set `status = COMPLETED`, save `outputUrl`, set `expiresAt = now + 24 hours`. On failure, set `status = FAILED`, log `errorMessage`, and ensure no credit deductions occur.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/webhooks/aiProviderWebhook.test.ts`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/jobs/jobManager.ts src/app/api/webhooks/ai-provider/route.ts tests/webhooks/aiProviderWebhook.test.ts
git commit -m "feat: implement idempotent AI provider webhook handler and job state machine"
```

---

### Task 7: Client-Side Pre-Flight Validator Hook & Media Upload Component

**Files:**
- Create: `src/hooks/useMediaValidator.ts`
- Create: `src/components/upload/MediaDropzone.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/alert.tsx`
- Test: `tests/hooks/useMediaValidator.test.ts`

**Interfaces:**
- Consumes: `APP_CONSTRAINTS` from `src/config/constraints.ts`.
- Produces: `useMediaValidator(mediaType)` hook, `<MediaDropzone />` React component with drag-and-drop, instant file validation, and error display.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/hooks/useMediaValidator.test.ts
import { describe, it, expect } from 'vitest';
import { validateFileLocally } from '@/hooks/useMediaValidator';
import { APP_CONSTRAINTS } from '@/config/constraints';

describe('Client Pre-Flight File Validator', () => {
  it('should flag unsupported mime types immediately before upload', () => {
    const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    const result = validateFileLocally(file, 'photo', APP_CONSTRAINTS);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/Unsupported format/);
  });

  it('should accept valid photo files within limits', () => {
    const file = new File(['valid image bytes'], 'portrait.jpg', { type: 'image/jpeg' });
    const result = validateFileLocally(file, 'photo', APP_CONSTRAINTS);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hooks/useMediaValidator.test.ts`
Expected: FAIL with "Cannot find module '@/hooks/useMediaValidator'".

- [ ] **Step 3: Implement `useMediaValidator.ts` and `<MediaDropzone />`**

Implement `validateFileLocally` and `inspectVideoMetadata(file: File): Promise<{ duration: number, width: number, height: number }>`. Build `<MediaDropzone />` supporting drag-and-drop, file picker, file size/duration validation feedback, and upload progress bar.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/hooks/useMediaValidator.test.ts`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useMediaValidator.ts src/components/upload/MediaDropzone.tsx src/components/ui/button.tsx src/components/ui/alert.tsx tests/hooks/useMediaValidator.test.ts
git commit -m "feat: add client pre-flight media validator hook and upload dropzone component"
```

---

### Task 8: Design System Shell: Responsive Navigation, Workspaces Layout, and Footer

**Files:**
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/components/layout/WorkspaceShell.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/layout/navigation.test.ts`

**Interfaces:**
- Consumes: Tailwind CSS styles, Lucide icons (`lucide-react`).
- Produces: Responsive site header with links to Home, Photo Editor, Video Editor, AI Tools, My Projects, and Pricing; common 3-panel workspace shell layout (Left: Tools, Center: Preview, Right: Settings).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/layout/navigation.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/layout/navigation.test.ts`
Expected: FAIL with "Cannot find module '@/components/layout/Navbar'".

- [ ] **Step 3: Implement `Navbar.tsx`, `Footer.tsx`, and `WorkspaceShell.tsx`**

Build clean, accessible navigation bar with mobile hamburger drawer. Create `WorkspaceShell.tsx` matching PRD Section 6 (left sidebar options, center media preview, right sidebar export settings). Integrate into `src/app/layout.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/layout/navigation.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Navbar.tsx src/components/layout/Footer.tsx src/components/layout/WorkspaceShell.tsx src/app/layout.tsx src/app/page.tsx tests/layout/navigation.test.ts
git commit -m "feat: implement responsive navigation shell and workspace layout"
```

---

### Task 9: Browser Audio Extractor (Web Audio API) & Canvas Preview Components

**Files:**
- Create: `src/lib/audio/browserAudioExtractor.ts`
- Create: `src/components/preview/CanvasPreview.tsx`
- Create: `src/components/preview/VideoPreview.tsx`
- Test: `tests/audio/browserAudioExtractor.test.ts`

**Interfaces:**
- Consumes: Web Audio API (in browser), HTML5 `<canvas>` and `<video>`.
- Produces: `extractAudioSnippet(videoFile: File, options?: AudioExtractionOptions): Promise<Blob>`, `<CanvasPreview />` component, `<VideoPreview />` component.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/audio/browserAudioExtractor.test.ts
import { describe, it, expect } from 'vitest';
import { calculateAudioSampleCount } from '@/lib/audio/browserAudioExtractor';

describe('Audio Extractor Utility', () => {
  it('should correctly calculate expected audio buffer sample size for target duration and rate', () => {
    const sampleRate = 16000;
    const durationSeconds = 30;
    const samples = calculateAudioSampleCount(durationSeconds, sampleRate);
    expect(samples).toBe(480000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/audio/browserAudioExtractor.test.ts`
Expected: FAIL with "Cannot find module '@/lib/audio/browserAudioExtractor'".

- [ ] **Step 3: Implement `browserAudioExtractor.ts`, `<CanvasPreview />`, and `<VideoPreview />`**

Implement WAV encoding utility and audio extraction pipeline using `OfflineAudioContext` (downsampling to mono 16kHz WAV for ultra-compact 2–5MB uploads). Implement `<CanvasPreview />` with zoom/pan and before/after comparison slider. Implement `<VideoPreview />` with timeline scrubber and time formatting.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/audio/browserAudioExtractor.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audio/browserAudioExtractor.ts src/components/preview/CanvasPreview.tsx src/components/preview/VideoPreview.tsx tests/audio/browserAudioExtractor.test.ts
git commit -m "feat: add browser audio extraction utility and interactive media preview components"
```

---

### Task 10: End-to-End Verification of Phase 1 Foundation & Test Suite

**Files:**
- Create: `tests/e2e/phase1Foundation.test.ts`
- Modify: `package.json` (ensure `npm run test` and `npm run build` scripts succeed)

**Interfaces:**
- Consumes: All modules from Tasks 1–9.
- Produces: 100% passing test suite, successful Next.js production build (`next build`).

- [ ] **Step 1: Write the end-to-end integration test**

```typescript
// tests/e2e/phase1Foundation.test.ts
import { describe, it, expect } from 'vitest';
import { APP_CONSTRAINTS } from '@/config/constraints';
import { validateMediaUpload } from '@/lib/validation/mediaValidator';
import { buildStorageKey } from '@/lib/storage/presignedUrls';
import { parseWebhookPayload } from '@/lib/jobs/jobManager';

describe('Phase 1 Foundation End-to-End Integration Flow', () => {
  it('should validate photo input, create storage key, and handle simulated webhook callback', () => {
    // 1. Pre-flight validation
    const validation = validateMediaUpload({
      mediaType: 'photo',
      fileSizeBytes: 12 * 1024 * 1024,
      mimeType: 'image/png',
    }, APP_CONSTRAINTS);
    expect(validation.isValid).toBe(true);

    // 2. Storage key generation
    const key = buildStorageKey({ userId: 'test_user', toolType: 'photo_bg_remover', extension: 'png' });
    expect(key).toContain('temp/test_user/photo_bg_remover/');

    // 3. Webhook handling
    const webhook = parseWebhookPayload({
      job_id: 'job_test_123',
      status: 'completed',
      output: { url: `https://r2.domain.com/${key}` },
    });
    expect(webhook.status).toBe('COMPLETED');
    expect(webhook.outputUrl).toContain(key);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run tests/e2e/phase1Foundation.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 3: Run entire test suite and production build**

Run: `npx vitest run`
Expected: All tests pass.
Run: `npm run build`
Expected: Next.js build succeeds with zero errors.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/phase1Foundation.test.ts package.json
git commit -m "test: add Phase 1 foundation end-to-end integration test suite"
```

