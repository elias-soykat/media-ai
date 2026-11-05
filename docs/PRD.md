# Product Requirements Document (PRD)
## AI-Powered Online Photo & Video Editing Platform

**Document status:** MVP Specification  
**Product stage:** MVP / Initial Release  
**Product strategy:** Quality-first, browser-first, AI-powered  
**Primary platform:** Web application  
**Target experience:** Professional, simple, fast, intuitive

---

# 1. Product Vision

Build a professional online photo and video editing platform that allows anyone to improve, edit, and process their media without installing desktop software or learning complicated editing tools.

The platform will combine:

- Browser-native media editing.
- High-quality AI-powered editing.
- Third-party AI processing APIs for advanced operations.
- An exceptionally simple and professional user experience.

Users should be able to upload media, select an editing operation, preview the result, and download the finished file with minimal effort.

### Core product promise

**Professional-quality editing. Simple enough for everyone. Directly in the browser.**

# 2. Product Objectives

The MVP must achieve the following objectives:

1. Deliver professional-quality results for every launched editing feature.
2. Make common photo and video editing operations accessible through one-click workflows.
3. Perform standard editing operations locally inside the browser.
4. Use external AI providers only when they provide a meaningful quality advantage.
5. Provide instant previews wherever technically possible.
6. Minimize processing time without compromising output quality.
7. Offer free access to browser-native tools.
8. Introduce a freemium model for expensive AI-powered processing.
9. Establish an extensible architecture for adding more editing capabilities later.

# 3. Target Users

### Primary users

- Content creators.
- YouTubers and video creators.
- Freelancers.
- Social media managers.
- Job seekers preparing professional photographs and video introductions.
- Small businesses and online sellers.
- General users who need quick photo and video improvements.

### Main user problems

- Removing backgrounds requires complicated software.
- Recordings contain distracting background noise.
- Photo quality is not good enough for professional use.
- Common editing software is unnecessarily complicated.
- Users need to perform simple tasks without learning professional editing applications.
- Many online AI editing services are expensive or have complicated workflows.

# 4. MVP Feature Scope

The MVP should contain a deliberately limited number of features.

## 4.1 Photo Editing

| Feature | Processing | Priority |
|---|---|---|
| Background Remover | Third-party AI API | P0 |
| Background Changer | AI background removal + browser compositing | P0 |
| Image Enhancer | Browser-based adjustments | P0 |
| Image Cropper | Browser-native | P0 |
| Image Resizer | Browser-native | P0 |
| Image Compressor | Browser-native | P0 |
| Image Format Converter | Browser-native | P0 |

### Feature requirements

**A. AI Background Remover**

- Automatically identify and remove image backgrounds.
- Preserve hair, edges, and fine details.
- Support transparent PNG output.
- Provide original/result comparison.
- Maintain original image resolution where the provider supports it.
- Avoid artificial-looking edges.
- Enforce dynamic image input limits (max file size, max dimensions).

**B. AI Background Changer**

- Allow users to select preset backgrounds.
- Allow users to upload custom backgrounds.
- Support solid colors and image backgrounds.
- Maintain subject proportions and positioning.
- Provide a live preview.
- Allow background positioning and scaling.

**C. Image Enhancer**

- Brightness adjustment.
- Contrast adjustment.
- Saturation adjustment.
- Exposure adjustment.
- Sharpness adjustment.
- Preset enhancement options.
- Before/after comparison.

The initial enhancer should use deterministic browser processing rather than an unvalidated AI model.

**D. Standard Image Utilities**

- Crop image.
- Resize by pixels or percentage.
- Maintain aspect ratio.
- Compress image.
- Convert JPG, PNG, and WebP.
- Download processed images.

All standard utilities should work without account registration.

### Photo processing constraints (Configurable)

All photo limits are governed by the centralized configuration system (`APP_CONSTRAINTS`):

- **Max photo file size:** 25 MB (default, adjustable via config).
- **Max image dimensions:** 8192 × 8192 px (default, adjustable via config).
- **Supported input formats:** JPEG, PNG, WebP (standard web formats).
- **Output formats:** PNG (for transparency), JPEG, WebP.

## 4.2 Video Editing

| Feature | Processing | Priority |
|---|---|---|
| Video Trimmer | Browser-native | P0 |
| Video Compressor | Browser-native | P0 |
| Video Resizer | Browser-native | P0 |
| Video Format Converter | Browser-native, codec-dependent | P0 |
| Audio Noise Remover | Third-party AI API (Hybrid Pipeline) | P0 |
| Automatic Subtitles | Speech-to-text API | P1 |

### Feature requirements

**A. Video Trimmer**

- Upload a video within configured size and duration limits.
- Display a simple timeline.
- Select start and end timestamps.
- Preview the selected portion.
- Export the trimmed video.
- Preserve audio synchronization.

**B. Video Compressor**

- Support quality presets (e.g., Low, Medium, High compression).
- Allow target resolution selection (e.g., 720p, 1080p).
- Display estimated output size where possible.
- Preserve acceptable visual quality.
- Provide downloadable output.

**C. Video Resizer**

- Support 16:9, 9:16, 1:1, and 4:5.
- Provide fit, fill, and crop options.
- Allow positioning adjustments.
- Preview before exporting.

**D. AI Audio Noise Remover (Hybrid Bandwidth-Optimized Pipeline)**

To minimize bandwidth costs, latency, and cloud compute:
- **Client-side audio extraction:** The browser extracts the audio track locally using Web Audio API / AudioContext into a compact audio format (16kHz or 44.1kHz mono WAV or MP3, typically 2–5 MB), avoiding uploading large raw video files (50–100 MB).
- **Lightweight upload:** Only the extracted audio is uploaded to the backend and processed by the AI provider (e.g., ElevenLabs / specialist audio API).
- **Speech preservation:** Reduces background fan, traffic, wind, and keyboard noise while preserving speech clarity and natural voice tone.
- **Client-side remuxing:** The cleaned audio is returned to the browser and remuxed with the original video stream without re-encoding video tracks, saving expensive server compute.
- **Fallback:** In browsers where client-side remuxing is unsupported, lightweight server-side remuxing serves as a secondary path.
- **Audio comparison:** Allow instant before/after audio comparison.

**E. Automatic Subtitles (P1)**

- Automatically transcribe speech.
- Generate timestamped subtitles.
- Allow users to correct transcription errors.
- Support subtitle styling.
- Export SRT.
- Optionally render subtitles into the video.

Only launch this feature after transcription accuracy and language support meet the quality requirements.

### Video processing constraints (Configurable)

To ensure client stability, prevent WebAssembly memory crashes (Wasm 2GB limit), and keep cloud costs minimal:

- **Max video file size:** 100 MB (default, adjustable via config).
- **Max video duration:** 180 seconds (3 minutes) (default, adjustable via config).
- **Max video resolution:** 1080p (1920 × 1080) for client-side processing (default, adjustable via config).
- **Supported video containers:** MP4, WebM, QuickTime (MOV).
- **Browser-native engine:** FFmpeg.wasm / WebCodecs with Web Workers to prevent UI freezing.

# 5. Features Explicitly Deferred

These features are valuable but should not be included in the first release because they introduce additional quality, infrastructure, or integration risks.

| Feature | Reason for postponement |
|---|---|
| Eye Contact Correction | Requires sophisticated facial reconstruction |
| Video Background Removal | Complex temporal consistency and edge quality |
| Video Background Replacement | Depends on reliable video segmentation |
| Video Upscaling | Expensive and hardware-intensive |
| Video Stabilization | Requires advanced motion estimation |
| Object Removal | Generative reconstruction quality |
| Photo Restoration | Requires specialist restoration models |
| Face Restoration | Facial identity preservation risks |
| Advanced Portrait Retouching | Requires careful natural-looking results |
| Filler Word Removal | Requires transcription and accurate editing |
| AI Video Translation | Complex multilingual pipeline |
| Automatic Video Clipping | Requires additional AI analysis |
| AI Video Generation | Outside initial product scope |

These are planned expansion opportunities, not permanent exclusions.

# 6. Application Structure

The application should have a clean, professional interface.

### Main navigation

- Home
- Photo Editor
- Video Editor
- AI Tools
- My Projects (Processing History & Downloads)
- Pricing
- Account

### Home page

The home page should immediately communicate the product's purpose.

Required sections:

1. Hero section with a clear product value proposition.
2. Upload photo/video action.
3. Popular editing tools.
4. Photo editing tools.
5. Video editing tools.
6. AI-powered features.
7. How it works.
8. Pricing.
9. FAQ.

### Editing interface

Each editing tool should have its own dedicated workspace.

Recommended layout:

- Left sidebar: Editing options and settings.
- Center: Media preview.
- Right sidebar: Export settings or contextual controls.
- Bottom: Simple timeline when working with video.

Avoid unnecessary panels, complicated professional timelines, and excessive settings.

### Editing workflow

1. Select an editing tool.
2. Upload a file (validated against global constraints).
3. Preview the original.
4. Configure available options.
5. Start processing.
6. View the result.
7. Compare before and after.
8. Download the result.

Users should never be forced into a full editing studio for a simple operation.

### My Projects and Storage Lifecycle (MVP Scope)

To keep initial cloud and infrastructure costs minimal while providing a clean user experience:

- **Browser-Native Tools:** 100% client-side memory, private, instant download; zero server storage or bandwidth cost.
- **My Projects (Persistent Metadata Only):** Stores persistent job metadata, tool used, timestamps, and status history in PostgreSQL.
- **Transient Storage & 24-Hour Retention:** Media files generated by AI jobs are stored on Cloudflare R2 via secure signed URLs with an automated 24-hour expiration rule (`retentionHours = 24`, configurable). The UI displays a remaining-time countdown badge ("Expires in 18h"); once expired, the metadata history remains visible with an "Expired" status badge, but the storage asset is deleted.
- **Permanent Cloud File Storage:** Long-term media hosting and asset libraries are deferred to future paid tiers.

# 7. User Authentication and Monetization

The product will use a freemium business model with low upfront payment infrastructure costs.

### Browser-native tools

- No registration required.
- Free usage.
- No processing credits required.
- Local processing.
- No mandatory media uploads to external services.

### API-powered tools

- Login required.
- Free AI usage: Exactly **one successful free use per feature per account** (configurable via `initialFreeCredits = 1`).
- Failed processing attempts do not consume credits or the free trial allowance.
- Additional usage requires credits or a subscription.
- Clear pricing and credit cost displayed before processing.
- Credit unit economics (Configurable):
  - Photo Background Removal: 1 credit per image.
  - Photo Background Changer: 1 credit per image.
  - Video Audio Noise Removal: 1 credit per 30 seconds of audio.

### Account features

- Email registration.
- Login and logout.
- Password reset.
- User profile.
- Usage history.
- Credit balance.
- Subscription management.
- Processing history (persistent metadata).

### Payment infrastructure (Merchant of Record)

To eliminate international sales tax, VAT calculation, and compliance overhead without fixed monthly costs:

- **Primary Provider:** **Paddle** (Merchant of Record for checkout, pay-as-you-go credit packages, and recurring subscriptions).
- **Alternative:** **Lemon Squeezy** as a drop-in secondary MoR option.
- Both options operate on a purely transactional fee basis ($0 monthly subscription fee for the merchant).

### Initial pricing structure

| Plan | Suggested price | Main benefits |
|---|---:|---|
| Free | $0 | Browser tools + free AI trials |
| Pay as you go | From $5 | Processing credits |
| Pro | $12–$19/month | Monthly credits and premium tools |
| Business | $39–$79/month | Higher allowances and team features |

These are initial pricing hypotheses, not finalized prices. Actual credit packages and prices must be managed via configuration and based on measured provider costs.

# 8. Technical Architecture

### Low-Cost Foundation & Deployment Strategy

To ensure initial development and deployment costs remain near $0 and scale cleanly as the user base expands:

- **Application Topology:** **One monorepo, initially deployed on one VPS** (single low-cost Ubuntu VPS, $6–$10/month on Hetzner or DigitalOcean). Full-stack Next.js (App Router with TypeScript) unifying frontend UI, API routes, and server actions to eliminate multi-repo overhead and minimize infrastructure surface area.
- **Hosting & Web Server:** Node.js standalone server managed via PM2 or Docker, fronted by Caddy or Nginx for automated SSL and reverse proxying.
- **Cloud Storage:** **Cloudflare R2** (S3-compatible API). Provides **zero egress fees**, 10 GB free storage, and 10M read / 1M write operations/month. Temporary media files are managed via signed URLs with configurable auto-deletion.
- **Database:** Managed PostgreSQL hosted on **Supabase or Neon** (generous free tiers for MVP).
- **Background Processing:** **Provider webhooks initially** (asynchronous AI jobs from providers like fal.ai, remove.bg, and audio APIs send webhook callbacks directly to Next.js API endpoints to finalize jobs and update DB records). **BullMQ is introduced only when volume justifies dedicated queueing**.
- **Redis:** **Optional at launch** (zero Redis dependency needed on day 1; webhook-driven processing avoids mandatory queue infrastructure).
- **Payments:** **Paddle as primary Merchant of Record**, with **Lemon Squeezy as alternative**. Both handle global tax/VAT compliance, checkout, credits, and subscriptions with $0 monthly platform fees.

### Frontend

- React.
- TypeScript.
- Next.js (App Router).
- Tailwind CSS & shadcn/ui.
- Web Workers.
- Canvas API.
- Web Audio API (for browser-side audio extraction & analysis).
- WebCodecs.
- WebGPU where supported.
- WebAssembly.
- FFmpeg.wasm where appropriate (configured with SharedArrayBuffer and COOP/COEP headers).

### Browser AI

- ONNX Runtime Web.
- Transformers.js.
- MediaPipe.

### Backend

- Next.js Server Actions & API Routes (Node.js runtime).
- TypeScript.
- PostgreSQL (via Prisma or Drizzle ORM, hosted on Supabase/Neon).
- Webhook endpoints for asynchronous third-party AI callbacks.
- S3-compatible signed URL generation (Cloudflare R2).
- Secure third-party API integrations.
- Optional scale-out queue: Redis + BullMQ (introduced when usage exceeds webhook direct-write capacity).

### AI providers

Initial provider candidates:

- fal.ai for image and video AI models.
- remove.bg for background removal.
- ElevenLabs / specialist audio API for audio noise removal.
- Deepgram for speech transcription.
- Additional specialist providers when justified by quality benchmarks.

### 8.1 Centralized Typed Constraints with Database Overrides & Dual-Enforcement Architecture

All operational thresholds, media limits, quotas, and retention rules **must not be hardcoded** across application components. Instead, they are defined in a centralized typed configuration object with runtime database overrides, enforced strictly at both client and server boundaries.

#### A. Central Constraints Schema & Database Override Pattern

1. **Code-Level Typed Defaults (`APP_CONSTRAINTS`):**

```typescript
export const APP_CONSTRAINTS = {
  photo: {
    maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB
    maxDimensionPx: 8192,
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  video: {
    maxFileSizeBytes: 100 * 1024 * 1024, // 100 MB
    maxDurationSeconds: 180, // 3 minutes
    maxResolution: { width: 1920, height: 1080 }, // 1080p
    supportedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
  audio: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB (client-extracted snippet)
    supportedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp4'],
  },
  storage: {
    retentionHours: 24, // Auto-prune AI files from R2 after 24 hours
    signedUrlExpirySeconds: 3600, // 1 hour download/upload validity
  },
  billing: {
    initialFreeCredits: 1, // Exactly 1 successful free use per feature per account
    costs: {
      photoBackgroundRemoval: 1,
      photoBackgroundChanger: 1,
      audioNoiseRemovalPer30s: 1,
    },
  },
  rateLimits: {
    freeJobsPerHour: 10,
    paidJobsPerHour: 120,
  },
} as const;

export type AppConstraints = typeof APP_CONSTRAINTS;
```

2. **Database Overrides (`system_constraints` table):**
   - At runtime, the server merges the hardcoded typed defaults with key-value overrides stored in PostgreSQL (`system_constraints` table).
   - Allows an administrator to adjust limits (e.g. increase video max size to 150MB or change retention hours) instantly via database update without requiring a code redeploy.

#### B. Dual-Layer Enforcement Mechanism

1. **Frontend Enforcement (Pre-flight client checks):**
   - **Immediate validation:** Upon file selection (via drag-and-drop or file picker), the client immediately validates `file.size` and MIME type against the active constraints.
   - **Video metadata inspection:** Before initializing heavy processing in FFmpeg.wasm or canvas, the client inspects HTML5 `<video>` metadata (`duration`, `videoWidth`, `videoHeight`).
   - **User feedback:** Non-conforming files trigger friendly, actionable error messages immediately, preventing browser lockup and wasted user time.
   - **Dynamic sync:** The frontend fetches the active constraints from a lightweight endpoint (`GET /api/config/limits`) cached via SWR/TanStack Query, falling back to typed defaults if offline.

2. **Authoritative Backend & Webhook Enforcement:**
   - **Signed URL generation:** When an authenticated user requests a presigned upload URL for AI processing, the backend validates payload headers (Content-Length, Content-Type, file extension) against active constraints.
   - **Account eligibility & credit validation:** Backend checks account credit balance or single-free-use eligibility before generating signed upload URLs or initiating provider calls.
   - **Webhook & callback validation:** Webhooks from third-party AI providers re-verify job validity and payload sizes before persisting job completion and deducting user credits.
   - **Strict rejection:** Invalid or excessive payloads are rejected with HTTP 413 (Payload Too Large) or HTTP 422 (Unprocessable Entity).

### Architectural requirements

1. Use a provider-independent AI adapter layer.
2. Do not expose API credentials in frontend code.
3. Support processing status and progress tracking via Server-Sent Events (SSE) or client polling against the job status endpoint.
4. Support job cancellation where providers allow it.
5. Implement secure presigned URL file uploads and downloads.
6. Implement automatic temporary file deletion via Cloudflare R2 lifecycle rules (`retentionHours`).
7. Handle API failures and retries gracefully without deducting user credits.
8. Support future provider replacement without rewriting the frontend.
9. Keep standard editing independent of AI provider availability.
10. Maintain separate browser and API processing pipelines.
11. Centralize all constraints in typed configuration with database overrides and dual-layer frontend/backend enforcement.

# 9. Non-Functional Requirements

## Quality

Quality is the highest product priority.

- No visibly damaged output.
- Preserve original media quality whenever technically possible.
- Avoid unnecessary recompression.
- Preserve facial identity.
- Maintain natural background-removal edges.
- Maintain audio/video synchronization.
- Avoid incorrect cropping and aspect-ratio distortion.
- Validate final exports.

## Performance

- Fast initial application loading.
- Lazy-load heavy editing modules.
- Load AI models only when needed.
- Use Web Workers for intensive local tasks.
- Display processing progress.
- Support cancellation.
- Avoid blocking the main browser thread.
- Use adaptive processing according to device capability.

## Compatibility

Target modern desktop browsers first:

- Chrome.
- Edge.
- Firefox.
- Safari.

Mobile browser support should be progressive, with appropriate file-size and processing limitations.

## Privacy and Security

- Keep browser-native editing local.
- Clearly disclose when an external AI provider receives media.
- Never upload user media without consent.
- Use secure upload URLs.
- Protect API credentials.
- Delete temporary processing files according to a documented retention policy.
- Provide account and project deletion.

# 10. Quality Assurance and Acceptance Criteria

Every editing feature must pass a quality review before public release.

### Photo background removal

- Hair and fine edges remain natural.
- No obvious missing body parts.
- No excessive background artifacts.
- Transparent export works correctly.
- Resolution is preserved where supported.

### Image enhancement

- No excessive sharpening.
- No artificial color changes.
- No unwanted distortion.
- Exported image is visually consistent with the preview.

### Video processing

- Audio and video remain synchronized.
- Correct duration.
- Correct aspect ratio.
- No corrupted exports.
- Acceptable compression quality.
- Output plays in supported browsers and media players.

### Audio noise removal

- Speech remains understandable.
- Voice does not sound excessively artificial.
- Background noise is meaningfully reduced.
- No unexpected audio clipping or missing segments.

### Product-wide acceptance

- All editing actions work reliably.
- Errors are understandable.
- Processing progress is visible.
- Original files remain unchanged.
- Downloaded output matches the preview.
- No broken or misleading controls.

**Release policy:** If a feature cannot consistently meet its quality benchmark, keep it out of the public MVP rather than releasing an inferior version.

# 11. MVP Success Metrics

Measure:

- Successful processing rate.
- Output quality evaluation.
- Average processing time.
- Processing failure rate.
- User completion rate.
- Repeat usage per feature.
- Free-to-paid conversion.
- API cost per successful job.
- Gross margin per processing operation.
- User satisfaction.

Suggested initial quality gates:

- At least 98% successful processing for supported inputs.
- Zero known critical export-corruption issues.
- No unexpected charges for failed jobs.
- Every public feature passes a documented representative-media quality test.

These are release targets, not assumed existing performance.

# 12. Development Phases

### Phase 1 — Foundation

- Project setup (one monorepo, full-stack Next.js App Router).
- Centralized typed constraints configuration (`APP_CONSTRAINTS`) with PostgreSQL runtime overrides (`system_constraints`) and dual-layer validation.
- Design system & responsive application shell.
- Upload component with instant pre-flight validation (file size, duration, dimensions).
- Media preview & canvas components.
- Browser processing engine (Canvas API, Web Audio API, Web Workers, FFmpeg.wasm).
- User authentication (email/password).
- Database (PostgreSQL via Supabase/Neon) and Cloudflare R2 temporary storage setup.
- Webhook endpoints for asynchronous AI job callbacks.

### Phase 2 — Photo MVP

- Background removal.
- Background changer.
- Image enhancer.
- Cropper.
- Resizer.
- Compressor.
- Format converter.
- Before/after comparison.

### Phase 3 — Video MVP

- Video trimmer.
- Video compressor.
- Video resizer.
- Format conversion.
- Audio noise removal (browser-side audio extraction + AI processing + client remuxing).
- Video preview and export.

### Phase 4 — Monetization and release

- AI provider integration via async webhooks.
- Free processing allowance (1 successful free run per feature per account).
- Credit management.
- Paddle payment integration (with Lemon Squeezy alternative).
- Persistent metadata and job history in "My Projects".
- Quality assurance and benchmark testing.
- Single VPS deployment (PM2/Docker + Caddy/Nginx).

### Phase 5 — Expansion

- Eye contact correction.
- Video background removal.
- Automatic subtitles.
- AI object removal.
- Image upscaling.
- Video enhancement.
- Advanced audio tools.
- Other AI-powered editing capabilities.

# 13. Final MVP Scope

The initial public release should contain:

**Photo editing:**
- 1 AI background remover.
- 1 background changer.
- 1 image enhancer.
- 4 standard image utilities.

**Video editing:**
- 4 standard video utilities.
- 1 AI audio noise remover.

**Platform functionality:**
- Upload and preview.
- Before/after comparison.
- Export and download.
- Authentication for premium AI processing.
- Free AI processing allowance.
- Credit-based billing.
- Processing history.
- Responsive, professional interface.

This is intentionally a focused product rather than a miniature copy of Photoshop or Premiere Pro.

---

# 14. Product Development Philosophy

The following principles must guide every development decision:

1. Quality before feature quantity.
2. Simplicity before complexity.
3. Browser-native processing before paid APIs when quality is equivalent.
4. Specialist AI APIs when they produce meaningfully better results.
5. Never compromise output quality to reduce processing costs.
6. Never release an AI feature without testing representative inputs.
7. Maintain a consistent design language across all editing tools.
8. Design the architecture so new features can be introduced without restructuring the entire product.

**Final product vision:**

Create an online creative editing toolkit that users trust because it consistently delivers professional results, not because it advertises the largest number of AI features.