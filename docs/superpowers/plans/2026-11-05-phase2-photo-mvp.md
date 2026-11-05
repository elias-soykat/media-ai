# Phase 2: Photo MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Phase 2 Photo MVP: browser-native photo enhancer, cropper, resizer, compressor, and format converter, an AI background removal provider adapter and API route, a browser compositing engine for background changing, and a unified interactive photo editor workspace.

**Architecture:** Standard image adjustments and transformations (cropping, resizing, compression, enhancements, and background compositing) execute 100% locally in-browser via the HTML5 Canvas API and Web Workers for zero server cost and maximum privacy. AI background removal communicates with a provider-agnostic backend adapter (`src/lib/ai/photoProvider.ts`) that verifies user credit eligibility, dispatches processing, and returns transparent PNG cutouts. The photo editor workspace integrates all 7 photo tools into a responsive 3-panel UI.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Lucide React, HTML5 Canvas API, OffscreenCanvas, Prisma ORM, Cloudflare R2, Vitest.

**Spec:** [`docs/PRD.md`](file:///home/elias/elias/online-editing/docs/PRD.md)

## Global Constraints

- Max photo file size: 25 MB (`26214400` bytes).
- Max image dimensions: 8192 × 8192 px.
- Supported input formats: `image/jpeg`, `image/png`, `image/webp`.
- Standard photo utilities (enhancer, cropper, resizer, compressor, converter) must run locally in browser with zero account registration required.
- AI background remover and background changer require authentication and enforce 1 free trial run per feature per account (`INITIAL_FREE_AI_CREDITS = 1`), with subsequent runs consuming 1 credit.
- Output formats: PNG (for background transparency), JPEG, and WebP.
- Quality preservation: Output resolution and aspect ratio must be strictly preserved unless explicitly resized or cropped by the user.

## Review Focus

1. **Canvas pixel buffer overflow or memory allocation failure on large images:** When processing images near the 8192px / 25MB boundary, the enhancer/cropper handles calculations and canvas resizing safely without browser memory crashes.
2. **Loss of transparent alpha channel in background removal exports:** Background removal and composited PNG exports strictly maintain full 32-bit RGBA alpha transparency without flattening to black/white backgrounds.
3. **Credit deduction safety on failed AI background removal:** If an external AI provider fails or rejects an image, the backend ensures the user's credit balance is untouched and the free trial allowance remains intact.
4. **Deterministic and reversible image enhancement math:** Contrast, brightness, saturation, exposure, and sharpness adjustments calculate without color clipping distortion or non-linear clamping artifacts.
5. **Accurate compression file size estimation:** The compressor correctly applies quality quantization factors and outputs valid downloadable Blob files matching user-selected format and quality.

---

### Task 1: Deterministic Browser Image Enhancer Engine

**Files:**
- Create: `src/lib/photo/imageEnhancer.ts`
- Test: `tests/photo/imageEnhancer.test.ts`

**Interfaces:**
- Consumes: `ImageData` (RGBA pixel buffer), adjustment parameters (`brightness`, `contrast`, `saturation`, `exposure`, `sharpness`).
- Produces: `applyEnhancements(imageData: ImageData, adjustments: EnhancementAdjustments): ImageData`, `ENHANCEMENT_PRESETS` configuration with presets: `Original`, `Vivid`, `Warm`, `Cool`, `Studio`, `BlackAndWhite`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/photo/imageEnhancer.test.ts
import { describe, it, expect } from 'vitest';
import { applyEnhancements, ENHANCEMENT_PRESETS, clampPixel } from '@/lib/photo/imageEnhancer';

describe('Image Enhancer Engine', () => {
  it('should clamp pixel values strictly between 0 and 255', () => {
    expect(clampPixel(260)).toBe(255);
    expect(clampPixel(-15)).toBe(0);
    expect(clampPixel(128)).toBe(128);
  });

  it('should apply brightness adjustments correctly to RGBA channels without touching alpha', () => {
    // 1x1 image: RGBA(100, 100, 100, 255)
    const rawData = new Uint8ClampedArray([100, 100, 100, 255]);
    const mockImageData = {
      data: rawData,
      width: 1,
      height: 1,
    } as ImageData;

    const enhanced = applyEnhancements(mockImageData, { brightness: 20 });
    expect(enhanced.data[0]).toBe(120);
    expect(enhanced.data[1]).toBe(120);
    expect(enhanced.data[2]).toBe(120);
    expect(enhanced.data[3]).toBe(255); // Alpha preserved
  });

  it('should include all required PRD presets', () => {
    const presetNames = Object.keys(ENHANCEMENT_PRESETS);
    expect(presetNames).toContain('vivid');
    expect(presetNames).toContain('warm');
    expect(presetNames).toContain('cool');
    expect(presetNames).toContain('studio');
    expect(presetNames).toContain('bw');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/photo/imageEnhancer.test.ts`
Expected: FAIL with "Cannot find module '@/lib/photo/imageEnhancer'".

- [ ] **Step 3: Implement `imageEnhancer.ts`**

Implement pixel adjustment mathematics:
- Brightness: `pixel + (brightness * 2.55)`
- Contrast: factor `F = (259 * (contrast + 255)) / (255 * (259 - contrast))` applied to `F * (pixel - 128) + 128`
- Exposure: `pixel * Math.pow(2, exposure / 100)`
- Saturation: RGB to Grayscale luminance calculation `gray = 0.2989*r + 0.5870*g + 0.1140*b`, then interpolate `gray + (channel - gray) * (1 + saturation/100)`
- Sharpness: 3x3 convolution kernel with Laplacian sharpening matrix.
- `ENHANCEMENT_PRESETS`: Object containing defined values for vivid, warm, cool, studio, and black & white.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/photo/imageEnhancer.test.ts`
Expected: PASS with 3 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/photo/imageEnhancer.ts tests/photo/imageEnhancer.test.ts
git commit -m "feat: implement deterministic browser image enhancement engine and presets"
```

---

### Task 2: Browser Image Cropper, Resizer, Compressor & Format Converter

**Files:**
- Create: `src/lib/photo/imageTransforms.ts`
- Test: `tests/photo/imageTransforms.test.ts`

**Interfaces:**
- Consumes: Canvas context or image dimensions, transformation parameters.
- Produces:
  - `calculateCropRect(sourceWidth: number, sourceHeight: number, aspectRatio: string | number, cropArea?: Rect): Rect`
  - `calculateTargetDimensions(currentWidth: number, currentHeight: number, options: ResizeOptions): { width: number, height: number }`
  - `formatToMimeType(format: 'jpg' | 'png' | 'webp'): string`
  - `estimateCompressedSize(width: number, height: number, format: 'jpg' | 'png' | 'webp', quality: number): number`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/photo/imageTransforms.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateTargetDimensions,
  formatToMimeType,
  calculateCropRect,
} from '@/lib/photo/imageTransforms';

describe('Image Transformations Engine', () => {
  it('should calculate proportional resized dimensions when preserving aspect ratio', () => {
    // 1920x1080 resized to width 960 with aspect ratio preserved
    const target = calculateTargetDimensions(1920, 1080, {
      width: 960,
      maintainAspectRatio: true,
    });
    expect(target.width).toBe(960);
    expect(target.height).toBe(540);
  });

  it('should resize by percentage correctly', () => {
    const target = calculateTargetDimensions(1000, 800, {
      percentage: 50,
      maintainAspectRatio: true,
    });
    expect(target.width).toBe(500);
    expect(target.height).toBe(400);
  });

  it('should map standard formats to MIME types', () => {
    expect(formatToMimeType('jpg')).toBe('image/jpeg');
    expect(formatToMimeType('png')).toBe('image/png');
    expect(formatToMimeType('webp')).toBe('image/webp');
  });

  it('should compute centered crop rectangle for preset aspect ratios', () => {
    // 1920x1080 image cropped to 1:1 square
    const rect = calculateCropRect(1920, 1080, '1:1');
    expect(rect.width).toBe(1080);
    expect(rect.height).toBe(1080);
    expect(rect.x).toBe((1920 - 1080) / 2);
    expect(rect.y).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/photo/imageTransforms.test.ts`
Expected: FAIL with "Cannot find module '@/lib/photo/imageTransforms'".

- [ ] **Step 3: Implement `imageTransforms.ts`**

Implement aspect ratio parsing (`1:1`, `16:9`, `4:3`, `4:5`, `9:16`), dimension calculation, centered cropping geometry, MIME type resolution, and bytes-to-string formatters.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/photo/imageTransforms.test.ts`
Expected: PASS with 4 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/photo/imageTransforms.ts tests/photo/imageTransforms.test.ts
git commit -m "feat: implement image cropping, resizing, compression, and format conversion logic"
```

---

### Task 3: AI Photo Provider Adapter Layer (remove.bg / fal.ai / Mock)

**Files:**
- Create: `src/lib/ai/photoProvider.ts`
- Test: `tests/ai/photoProvider.test.ts`

**Interfaces:**
- Consumes: `PhotoBackgroundRemovalOptions` (`imageUrl`, `apiKey`, `providerName`).
- Produces: `getPhotoAiProvider(providerName?: string): PhotoAiProvider`, `PhotoAiProvider.removeBackground(options): Promise<BackgroundRemovalResult>`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/ai/photoProvider.test.ts
import { describe, it, expect } from 'vitest';
import { getPhotoAiProvider, MockPhotoAiProvider } from '@/lib/ai/photoProvider';

describe('AI Photo Provider Adapter', () => {
  it('should return mock provider when configured or in test environment', () => {
    const provider = getPhotoAiProvider('mock');
    expect(provider).toBeInstanceOf(MockPhotoAiProvider);
    expect(provider.providerName).toBe('mock');
  });

  it('should execute mock background removal and return transparent cutout result', async () => {
    const provider = new MockPhotoAiProvider();
    const result = await provider.removeBackground({
      imageUrl: 'https://example.com/source.jpg',
    });
    expect(result.success).toBe(true);
    expect(result.outputUrl).toBeDefined();
    expect(result.format).toBe('png');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ai/photoProvider.test.ts`
Expected: FAIL with "Cannot find module '@/lib/ai/photoProvider'".

- [ ] **Step 3: Implement `photoProvider.ts`**

Define interface `PhotoAiProvider`:
- `providerName: string`
- `removeBackground(options: BackgroundRemovalInput): Promise<BackgroundRemovalResult>`
Implement `MockPhotoAiProvider` (generates sample transparent cutout or passes through for testing), `RemoveBgProvider` (communicates with `api.remove.bg/v1.0/removebg`), and `FalAiProvider` (`fal-ai/birefnet`). Implement `getPhotoAiProvider(name)` factory function checking `AI_PHOTO_PROVIDER` env variable.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ai/photoProvider.test.ts`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/photoProvider.ts tests/ai/photoProvider.test.ts
git commit -m "feat: implement provider-independent AI background removal adapter"
```

---

### Task 4: AI Photo Background Remover Backend Endpoint (`/api/photo/remove-background`)

**Files:**
- Create: `src/app/api/photo/remove-background/route.ts`
- Test: `tests/api/removeBackgroundRoute.test.ts`

**Interfaces:**
- Consumes: `NextRequest` with `{ imageUrl, userId }`, `checkUserEligibility`, `getPhotoAiProvider`, Prisma client.
- Produces: `POST /api/photo/remove-background` handler returning `{ jobId, outputUrl, isFreeTrial, remainingCredits }`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/api/removeBackgroundRoute.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/photo/remove-background/route';
import { NextRequest } from 'next/server';

describe('POST /api/photo/remove-background', () => {
  it('should reject unauthenticated requests without userId with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/photo/remove-background', {
      method: 'POST',
      body: JSON.stringify({ imageUrl: 'https://r2.domain.com/temp/photo.jpg' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should reject with 402 if user has exhausted free trial and has zero credits', async () => {
    const req = new NextRequest('http://localhost:3000/api/photo/remove-background', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl: 'https://r2.domain.com/temp/photo.jpg',
        userId: 'mock_exhausted_user',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(402);
  });

  it('should process background removal successfully for eligible user', async () => {
    const req = new NextRequest('http://localhost:3000/api/photo/remove-background', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl: 'https://r2.domain.com/temp/photo.jpg',
        userId: 'new_user_1',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.outputUrl).toBeDefined();
    expect(json.isFreeTrial).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/removeBackgroundRoute.test.ts`
Expected: FAIL with "Cannot find module '@/app/api/photo/remove-background/route'".

- [ ] **Step 3: Implement `src/app/api/photo/remove-background/route.ts`**

Validate input, check user entitlement via `checkUserEligibility`. If eligible, invoke `getPhotoAiProvider().removeBackground({ imageUrl })`. Create persistent job record in Prisma with `status: COMPLETED` and `expiresAt: now + 24 hours`. If user was not on free trial, deduct 1 credit and create `CreditTransaction` record. If provider fails, return HTTP 502 without deducting credits.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/removeBackgroundRoute.test.ts`
Expected: PASS with 3 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/photo/remove-background/route.ts tests/api/removeBackgroundRoute.test.ts
git commit -m "feat: add AI background removal API route with entitlement verification and job logging"
```

---

### Task 5: Browser Canvas Compositor for Background Changer

**Files:**
- Create: `src/lib/photo/backgroundCompositor.ts`
- Test: `tests/photo/backgroundCompositor.test.ts`

**Interfaces:**
- Consumes: Foreground image with alpha channel, Background options (`type: 'color' | 'image' | 'gradient'`, color hex, image URL, scaling, offset).
- Produces: `renderCompositedCanvas(options: CompositorOptions): HTMLCanvasElement`, `BACKGROUND_PRESETS` list (Solid colors, Professional Studio gradients, Office/Desk environments).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/photo/backgroundCompositor.test.ts
import { describe, it, expect } from 'vitest';
import {
  BACKGROUND_PRESETS,
  calculateFittedDimensions,
} from '@/lib/photo/backgroundCompositor';

describe('Background Changer Compositor', () => {
  it('should provide preset solid colors and gradient backgrounds', () => {
    expect(BACKGROUND_PRESETS.solidColors).toContain('#FFFFFF');
    expect(BACKGROUND_PRESETS.solidColors).toContain('#000000');
    expect(BACKGROUND_PRESETS.gradients.length).toBeGreaterThan(0);
  });

  it('should calculate correct contain/cover positioning for background layers', () => {
    // 800x600 canvas, 1600x1200 background image with cover fit
    const fitted = calculateFittedDimensions(800, 600, 1600, 1200, 'cover');
    expect(fitted.drawWidth).toBe(800);
    expect(fitted.drawHeight).toBe(600);
    expect(fitted.dx).toBe(0);
    expect(fitted.dy).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/photo/backgroundCompositor.test.ts`
Expected: FAIL with "Cannot find module '@/lib/photo/backgroundCompositor'".

- [ ] **Step 3: Implement `backgroundCompositor.ts`**

Implement background fit calculation (`cover`, `contain`), coordinate offset and scale multipliers, presets list (`BACKGROUND_PRESETS`), and compositing functions drawing background first then foreground cutout on top.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/photo/backgroundCompositor.test.ts`
Expected: PASS with 2 passed tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/photo/backgroundCompositor.ts tests/photo/backgroundCompositor.test.ts
git commit -m "feat: implement browser-native background replacement compositor and presets"
```

---

### Task 6: Unified Photo Editor Workspace Page (`/photo-editor`)

**Files:**
- Create: `src/components/photo/PhotoSidebarControls.tsx`
- Create: `src/app/photo-editor/page.tsx`
- Modify: `src/components/layout/Navbar.tsx` (ensure active link styling)
- Test: `tests/photo/photoEditorPage.test.ts`

**Interfaces:**
- Consumes: `WorkspaceShell`, `CanvasPreview`, `MediaDropzone`, `imageEnhancer`, `imageTransforms`, `backgroundCompositor`.
- Produces: Complete interactive photo editor workspace page at `/photo-editor` supporting 7 tools:
  1. AI Background Remover
  2. Background Changer
  3. Image Enhancer
  4. Image Cropper
  5. Image Resizer
  6. Image Compressor
  7. Format Converter

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/photo/photoEditorPage.test.ts`
Expected: FAIL with "Cannot find module '@/components/photo/PhotoSidebarControls'".

- [ ] **Step 3: Implement `PhotoSidebarControls.tsx` and `src/app/photo-editor/page.tsx`**

Build `PhotoSidebarControls.tsx` with accordion or tabs for each tool (sliders for Enhancer, aspect ratio pills for Cropper, width/height inputs for Resizer, quality slider for Compressor, format radio for Converter, background picker for Changer, and 1-click button for AI Remover). Build `src/app/photo-editor/page.tsx` embedding `WorkspaceShell`, image state management, canvas rendering, comparison slider, and export download button.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/photo/photoEditorPage.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 5: Commit**

```bash
git add src/components/photo/PhotoSidebarControls.tsx src/app/photo-editor/page.tsx tests/photo/photoEditorPage.test.ts
git commit -m "feat: implement unified 7-tool photo editor workspace page"
```

---

### Task 7: End-to-End Photo MVP Integration & Test Suite Verification

**Files:**
- Create: `tests/e2e/photoMvpFlow.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: All Phase 2 photo modules.
- Produces: 100% passing test suite across all 7 photo tools and clean Next.js build.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/e2e/photoMvpFlow.test.ts
import { describe, it, expect } from 'vitest';
import { applyEnhancements, ENHANCEMENT_PRESETS } from '@/lib/photo/imageEnhancer';
import { calculateTargetDimensions, calculateCropRect } from '@/lib/photo/imageTransforms';
import { BACKGROUND_PRESETS } from '@/lib/photo/backgroundCompositor';
import { MockPhotoAiProvider } from '@/lib/ai/photoProvider';

describe('Phase 2 Photo MVP End-to-End Integration Suite', () => {
  it('should successfully chain enhance, crop calculation, resize, and background composite', async () => {
    // 1. Enhancer preset applied
    const preset = ENHANCEMENT_PRESETS.vivid;
    expect(preset.contrast).toBeGreaterThan(0);

    // 2. Cropper calculation
    const crop = calculateCropRect(1920, 1080, '1:1');
    expect(crop.width).toBe(1080);

    // 3. Resizer calculation
    const resized = calculateTargetDimensions(crop.width, crop.height, { width: 500, maintainAspectRatio: true });
    expect(resized.width).toBe(500);
    expect(resized.height).toBe(500);

    // 4. AI Background removal
    const provider = new MockPhotoAiProvider();
    const result = await provider.removeBackground({ imageUrl: 'https://example.com/test.png' });
    expect(result.success).toBe(true);

    // 5. Background replacement presets
    expect(BACKGROUND_PRESETS.solidColors).toContain('#FFFFFF');
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run tests/e2e/photoMvpFlow.test.ts`
Expected: PASS with 1 passed test.

- [ ] **Step 3: Run full test suite and verify production build**

Run: `npm test`
Expected: All tests pass.
Run: `npm run build`
Expected: Production build succeeds with `/photo-editor` prerendered.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/photoMvpFlow.test.ts
git commit -m "test: add Phase 2 photo MVP end-to-end integration test suite"
```

