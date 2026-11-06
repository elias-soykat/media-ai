# AI-Powered Online Photo & Video Editing Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.2.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.0-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-S3_Compatible-f38020?style=flat&logo=cloudflare)](https://www.cloudflare.com/products/r2/)
[![Paddle](https://img.shields.io/badge/Paddle-Merchant_of_Record-29333d)](https://www.paddle.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0.5-6e9f18?style=flat&logo=vitest)](https://vitest.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose_Ready-2496ed?style=flat&logo=docker)](https://www.docker.com/)

An enterprise-ready, cost-effective, browser-first online photo and video editing platform. It brings high-performance media manipulation directly into the web browser, combining deterministic client-side processing (via HTML5 Canvas, Web Audio API, and WebCodecs) with specialized cloud-native AI providers (remove.bg, fal.ai BiRefNet, ElevenLabs) for professional-grade creative workflows.

---

## Table of Contents

- [1. Project Overview & Vision](#1-project-overview--vision)
- [2. What Does the Project Do?](#2-what-does-the-project-do)
  - [2.1 Photo Editing Suite](#21-photo-editing-suite)
  - [2.2 Video Editing Suite](#22-video-editing-suite)
  - [2.3 Specialized AI Tools](#23-specialized-ai-tools)
  - [2.4 Project Management & Asset Lifecycle](#24-project-management--asset-lifecycle)
- [3. Architecture & System Design](#3-architecture--system-design)
  - [3.1 High-Level Architecture](#31-high-level-architecture)
  - [3.2 Hybrid Processing Strategy](#32-hybrid-processing-strategy)
  - [3.3 Centralized Constraints & Dual-Enforcement](#33-centralized-constraints--dual-enforcement)
- [4. Monetization & Business Model](#4-monetization--business-model)
- [5. Technology Stack](#5-technology-stack)
- [6. Directory Structure](#6-directory-structure)
- [7. Getting Started](#7-getting-started)
  - [7.1 Prerequisites](#71-prerequisites)
  - [7.2 Installation](#72-installation)
  - [7.3 Environment Configuration](#73-environment-configuration)
  - [7.4 Database Setup](#74-database-setup)
  - [7.5 Starting the Application](#75-starting-the-application)
- [8. Environment Variables Reference](#8-environment-variables-reference)
- [9. Testing & Quality Assurance](#9-testing--quality-assurance)
- [10. Production Deployment](#10-production-deployment)
- [11. API Route Documentation](#11-api-route-documentation)
- [12. Roadmap](#12-roadmap)
- [13. License](#13-license)

---

## 1. Project Overview & Vision

Modern creators, social media managers, freelancers, and small business owners frequently need to perform basic yet critical media edits—such as removing image backgrounds, adjusting lighting, trimming video clips, and cleaning noisy audio. Existing solutions often force users into steep subscription costs, bloated desktop installations, or privacy-invasive cloud uploads.

### Core Product Promise
> **Professional-quality editing. Simple enough for everyone. Directly in the browser.**

### Core Pillars
1. **Browser-First Architecture:** Standard editing tasks (cropping, resizing, compression, enhancement, and video trimming) execute 100% inside the client browser. Zero server compute, zero bandwidth egress, zero latency, and complete privacy.
2. **Selective AI Acceleration:** Heavy, high-value operations (portrait segmentation and speech noise isolation) delegate to specialized AI APIs with fallback to deterministic local mock adapters for local development and testing.
3. **Bandwidth-Optimized Hybrid Pipeline:** For complex operations like video noise reduction, the browser extracts only the audio track locally (~2–5 MB) rather than uploading 50–100 MB raw video files, drastically slashing bandwidth, latency, and cloud bills.
4. **Low-Cost Infrastructure:** Designed to run in production on a single low-cost VPS ($6–$10/month) backed by Docker, Caddy, PostgreSQL, and Cloudflare R2 (zero egress fees), with Paddle as the Merchant of Record for frictionless global tax compliance.

---

## 2. What Does the Project Do?

The platform provides a suite of photo and video editing capabilities categorized into browser-native utilities and AI-assisted tools.

### 2.1 Photo Editing Suite
Located at `/photo-editor`, the photo suite provides a focused single-tool workspace:

- **AI Background Remover:** Detects portraits and foreground subjects, cleanly preserving fine details like hair strands. Outputs transparent PNGs with interactive before/after split-screen comparison.
- **AI Background Changer:** Combines AI background removal with real-time browser canvas compositing. Allows users to place cutouts against solid color backdrops, curated studio scenes, or custom image uploads with position and scale adjustments.
- **Image Enhancer:** In-browser image adjustments using deterministic Canvas pixel algorithms. Adjust brightness, contrast, saturation, exposure, and sharpness with preset filters and instant before/after sliders.
- **Image Cropper:** Responsive cropping tool supporting freeform cropping as well as industry-standard aspect ratio presets:
  - `1:1 Square` (Instagram feeds, profile avatars)
  - `16:9 Landscape` (YouTube, web banners)
  - `4:3 Standard` (Presentations, legacy displays)
  - `4:5 Social Portrait` (Instagram portrait posts)
  - `9:16 Story / Reel` (TikTok, Instagram Stories, YouTube Shorts)
- **Image Resizer:** Precise pixel scaling or percentage-based scaling with an aspect-ratio lock option.
- **Image Compressor:** Client-side JPEG/WebP quality optimization with real-time file size reduction estimation and live visual comparison.
- **Format Converter:** Converts between `JPG`, `PNG`, and `WebP` formats instantly without uploading files to a server.

### 2.2 Video Editing Suite
Located at `/video-editor`, the video workspace delivers smooth playback and timeline controls:

- **Video Trimmer:** Dual-handle precision timeline scrubber allowing start and end timestamp trimming with millisecond accuracy and non-destructive client-side export.
- **Video Compressor:** Preset-based downscaling (1080p, 720p, 480p) and bitrate compression to prepare video files for social and email sharing.
- **Video Resizer:** Aspect-ratio reformatting with letterboxing, fill, and fit modes across `16:9`, `9:16`, `1:1`, and `4:5`.
- **Hybrid AI Audio Noise Remover:** Intelligently eliminates ambient noise (traffic, fans, background chatter, wind) while preserving natural voice dynamics and vocal frequencies.

### 2.3 Specialized AI Tools
Located at `/ai-tools`, a centralized hub showcases and guides users into the AI-assisted tools with instant pre-flight file validation, sample before/after demonstrations, and credit balance requirements.

### 2.4 Project Management & Asset Lifecycle
Located at `/my-projects`:
- **Persistent Job History:** Stores job metadata (tool used, timestamps, status, input/output file dimensions) in PostgreSQL.
- **24-Hour Transient Cloud Storage:** AI-processed assets stored on Cloudflare R2 automatically expire after 24 hours via R2 lifecycle rules. The UI features a real-time countdown badge (`Expires in 18h`). Once expired, historical audit records remain visible with an `Expired` state while storage costs remain at $0.
- **Zero-Storage Browser Tools:** Files edited with browser-native tools are never uploaded to cloud storage; they remain purely in client memory and download instantly.

---

## 3. Architecture & System Design

### 3.1 High-Level Architecture

```
                                  Internet (HTTPS :443)
                                            │
                                            ▼
                             ┌─────────────────────────────┐
                             │     Caddy Reverse Proxy     │
                             │  (Automatic TLS / SSL / ACME)│
                             └──────────────┬──────────────┘
                                            │
                                 Docker Bridge Network
                                            │
                                            ▼
                             ┌─────────────────────────────┐
                             │  Next.js 15 Standalone App  │
                             │   (React 19 / TypeScript)   │
                             └──────┬───────────────┬──────┘
                                    │               │
            ┌───────────────────────┘               └───────────────────────┐
            ▼                                                               ▼
 ┌───────────────────────┐                                       ┌───────────────────────┐
 │   PostgreSQL 16 DB    │                                       │     Cloudflare R2     │
 │  (Prisma ORM Models:  │                                       │  (S3-Compatible Zero  │
 │  Users, Jobs, Credits,│                                       │   Egress Media Store, │
 │  System Constraints)  │                                       │   24h Expiration)     │
 └───────────────────────┘                                       └───────────────────────┘
            ▲                                                               ▲
            │                                                               │
            │                    Third-Party Cloud APIs                     │
            └───────────┬───────────────────────────────────────┬───────────┘
                        ▼                                       ▼
             ┌─────────────────────┐                 ┌─────────────────────┐
             │ AI Photo Providers  │                 │ AI Audio Providers  │
             │ (remove.bg / fal.ai │                 │    (ElevenLabs /    │
             │   BiRefNet model)   │                 │   Mock Provider)    │
             └─────────────────────┘                 └─────────────────────┘
```

### 3.2 Hybrid Processing Strategy

```
Standard Editing (Cropping, Resizing, Compressing, Enhancing, Trimming)
   User File ────────► Browser Memory (Canvas 2D / Web Audio) ────────► Instant Download
   (0 Byte Cloud Upload · 0 VPS CPU · 100% Private · Zero Latency)

AI Audio Noise Removal (Bandwidth-Optimized Hybrid Pipeline)
   Raw Video (100MB) ──► Browser extracts Audio Track via Web Audio API (~2-5MB WAV)
                                   │
                                   ▼
                         Upload 2-5MB Audio to /api/audio/remove-noise
                                   │
                                   ▼
                         AI Audio Provider Isolation (ElevenLabs)
                                   │
                                   ▼
                         Return Cleaned Audio Track to Browser
                                   │
                                   ▼
                         Client-Side Remuxing into Original Video Stream
```

### 3.3 Centralized Constraints & Dual-Enforcement

Operational limits and thresholds are defined in typed configuration (`src/config/constraints.ts`) and dynamically overridden at runtime via the `SystemConstraint` database table:

```typescript
export const APP_CONSTRAINTS = {
  photo: {
    maxFileSizeBytes: 25 * 1024 * 1024,      // 25 MB
    maxDimensionPx: 8192,                   // 8K resolution
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  video: {
    maxFileSizeBytes: 100 * 1024 * 1024,    // 100 MB
    maxDurationSeconds: 180,                 // 3 minutes
    maxResolution: { width: 1920, height: 1080 }, // 1080p
    supportedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
  audio: {
    maxFileSizeBytes: 10 * 1024 * 1024,      // 10 MB extracted audio
    supportedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp4'],
  },
  storage: {
    retentionHours: 24,                      // Auto-purge AI artifacts after 24 hours
    signedUrlExpirySeconds: 3600,            // 1-hour presigned URL validity
  },
  billing: {
    initialFreeCredits: 1,                   // 1 free run per feature upon signup
    costs: {
      photoBackgroundRemoval: 1,             // 1 credit per image
      photoBackgroundChanger: 1,             // 1 credit per image
      audioNoiseRemovalPer30s: 1,            // 1 credit per 30 seconds of audio
    },
  },
  rateLimits: {
    freeJobsPerHour: 10,
    paidJobsPerHour: 120,
  },
};
```

- **Client Enforcement:** `useMediaValidator` inspects file sizes, MIME types, and HTML5 video metadata (`duration`, `videoWidth`, `videoHeight`) during drag-and-drop to provide instant visual error feedback before uploading.
- **Server Enforcement:** Server-side route handlers re-validate binary buffers and parameters against `getMergedConstraints()` before executing cloud AI operations or consuming user credits.

---

## 4. Monetization & Business Model

The project utilizes a friction-free freemium business model powered by **Paddle** as the Merchant of Record (MoR).

| Tier | Price | Features Included |
|---|---|---|
| **Free / Anonymous** | $0 | Unlimited browser-native tools (Crop, Resize, Compress, Convert, Enhance, Trim). No registration required. |
| **New User Trial** | $0 (Upon signup) | **1 free successful execution** per AI tool (`initialFreeCredits = 1`). Failed attempts never deduct credits. |
| **Pay-As-You-Go** | From $5.00 | Top-up credit bundles (e.g. 50, 150, 500 credits) with no recurring monthly commitments. |
| **Pro Monthly** | $12.00 / month | Recurring monthly credit allocation, priority queueing, and extended upload limits. |

### Unit Economics
- **Photo Background Removal:** 1 credit per processed image.
- **Photo Background Replacement:** 1 credit per processed image.
- **Video Audio Noise Removal:** 1 credit per 30-second audio block (rounded up).

---

## 5. Technology Stack

### Frontend
- **Framework:** [Next.js 15.2.0](https://nextjs.org/) (App Router, Server Actions)
- **Library:** [React 19.0.0](https://react.dev/)
- **Language:** [TypeScript 5.7.3](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 3.4.17](https://tailwindcss.com/) with PostCSS & Autoprefixer
- **Icons:** [Lucide React 1.16.0](https://lucide.dev/)
- **Client Processing:** HTML5 Canvas 2D API, Web Audio API (`AudioContext`, `OfflineAudioContext`), WebCodecs, HTML5 Video.

### Backend & Data
- **Runtime:** Node.js 22 LTS
- **Database:** PostgreSQL 16
- **ORM:** [Prisma 6.4.0](https://www.prisma.io/)
- **Object Storage:** Cloudflare R2 via `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- **Authentication:** PBKDF2 (SHA-512) password hashing with cryptographic salt and HMAC signed session cookies
- **Validation:** [Zod 3.24.0](https://zod.dev/) for request payloads and schema definitions

### AI Integration
- **Photo AI Providers:** `RemoveBgProvider` (remove.bg API), `FalAiProvider` (fal.ai BiRefNet model), `MockPhotoAiProvider` (zero-cost deterministic local development)
- **Audio AI Providers:** `ElevenLabsAudioProvider` (speech isolation API), `MockAudioAiProvider` (zero-cost local testing)

### Billing & Deployment
- **Payment Gateway:** Paddle Billing API (v2) with HMAC SHA-256 webhook verification
- **Deployment Platform:** Docker & Docker Compose with Caddy 2 reverse proxy (automated Let's Encrypt TLS)
- **Test Framework:** [Vitest 3.0.5](https://vitest.dev/) with 40+ unit and integration test suites

---

## 6. Directory Structure

```
├── Caddyfile                         # Caddy reverse proxy and SSL configuration
├── Dockerfile                        # Multi-stage production container build
├── docker-compose.yml                # Multi-container orchestration (App, DB, Caddy)
├── docs/
│   ├── DEPLOYMENT.md                 # Single-VPS deployment guide
│   ├── PRD.md                        # Complete Product Requirements Document
│   └── superpowers/plans/            # Architectural and implementation specifications
├── prisma/
│   └── schema.prisma                 # Database schema (User, Job, CreditTransaction, SystemConstraint)
├── public/                           # Static assets, presets, and sample media
├── scripts/
│   └── check-credentials.js          # Health check & credential verification utility
├── src/
│   ├── app/
│   │   ├── (auth)/                   # Authentication routes (/account/login, /account/signup)
│   │   ├── account/                  # User dashboard and transaction history
│   │   ├── ai-tools/                 # AI features showcase directory
│   │   ├── api/                      # Next.js App Router API endpoints
│   │   │   ├── account/              # User transactions and balance APIs
│   │   │   ├── audio/                # Audio noise removal API
│   │   │   ├── auth/                 # Login, signup, logout, session APIs
│   │   │   ├── billing/              # Paddle checkout and session generation
│   │   │   ├── config/               # Dynamic system constraints endpoint
│   │   │   ├── media/                # Presigned URL generation for R2 uploads
│   │   │   ├── photo/                # Photo background removal API
│   │   │   └── webhooks/             # Paddle and AI asynchronous webhooks
│   │   ├── my-projects/              # Job history, countdown badges, re-download
│   │   ├── photo-editor/             # Dedicated photo editor workspace
│   │   ├── pricing/                  # Pricing tiers and credit package checkout
│   │   ├── video-editor/             # Dedicated video editor workspace
│   │   ├── layout.tsx                # Global root layout & navigation shell
│   │   └── page.tsx                  # Landing page (Hero, tools grid, FAQ)
│   ├── components/
│   │   ├── layout/                   # Navbar, Footer, WorkspaceShell
│   │   ├── photo/                    # Photo sidebar controls and adjustment sliders
│   │   ├── preview/                  # CanvasPreview and VideoPreview (with split comparison)
│   │   ├── ui/                       # Reusable UI primitives (Button, Alert, etc.)
│   │   ├── upload/                   # MediaDropzone with drag-and-drop validation
│   │   └── video/                    # VideoTimeline and VideoSidebarControls
│   ├── config/
│   │   └── constraints.ts            # Centralized typed constraints (APP_CONSTRAINTS)
│   ├── hooks/
│   │   └── useMediaValidator.ts      # Client-side media pre-flight validation hook
│   ├── lib/
│   │   ├── ai/                       # Pluggable photo and audio AI provider adapters
│   │   ├── audio/                    # Browser Web Audio API extraction utilities
│   │   ├── auth/                     # Password hashing, verification, session tokens
│   │   ├── billing/                  # Paddle API client, webhook validator, entitlements
│   │   ├── config/                   # Merged constraint resolver (code defaults + DB)
│   │   ├── jobs/                     # Job manager, lifecycle tracking, and expiry logic
│   │   ├── photo/                    # Canvas image transformations, cropping, enhancer
│   │   ├── storage/                  # Cloudflare R2 client and presigned URL helpers
│   │   ├── validation/               # Zod validation schemas and media guards
│   │   └── video/                    # Video trimming, transforms, and audio remuxing
│   └── types/
│       └── constraints.ts            # TypeScript definitions for constraints
└── tests/                            # 40+ Vitest test suites (Unit, API, E2E, Auth, Billing)
```

---

## 7. Getting Started

### 7.1 Prerequisites
- **Node.js:** `v20.x` or `v22.x` (LTS recommended)
- **Package Manager:** `npm` (v10+)
- **PostgreSQL Database:** PostgreSQL 15+ (local instance or cloud database such as Neon / Supabase)
- **Cloudflare R2 Bucket:** (Optional for local development; mock storage is supported)

### 7.2 Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/online-editing.git
cd online-editing
npm install
```

### 7.3 Environment Configuration
Create a `.env` file in the project root:

```bash
cp .env.example .env
```

If you don't have external provider API keys yet, configure mock mode for a 100% free local development experience:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/online_editing?schema=public"

# Auth Session Secret (Generate with: openssl rand -base64 32)
SESSION_SECRET="your_development_session_secret_32_characters_long"

# Pluggable AI Providers (Use 'mock' for local development without API keys)
AI_PHOTO_PROVIDER="mock"
AI_AUDIO_PROVIDER="mock"

# Cloudflare R2 Storage (Optional in mock mode)
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key"
R2_SECRET_ACCESS_KEY="your_r2_secret_key"
R2_BUCKET_NAME="online-editing-media"
R2_PUBLIC_DOMAIN="https://media.yourdomain.com"
R2_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"

# Paddle Billing (Optional in development)
PADDLE_API_KEY="pdl_test_..."
PADDLE_WEBHOOK_SECRET="pdl_ntfset_..."
```

Verify your credentials using the included diagnostics script:

```bash
node scripts/check-credentials.js
```

### 7.4 Database Setup
Generate the Prisma Client and run migrations:

```bash
npx prisma generate
npx prisma db push
```

*(Optional)* Seed default system constraints or inspect the database using Prisma Studio:

```bash
npx prisma studio
```

### 7.5 Starting the Application

#### Development Server
Start the Next.js development server with Turbopack / Fast Refresh:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Production Build
Build the optimized standalone production bundle:

```bash
npm run build
npm start
```

---

## 8. Environment Variables Reference

| Variable | Required | Default / Fallback | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (Prisma pooled or direct). |
| `SESSION_SECRET` | **Yes** | Internal fallback in dev | Cryptographic secret for signing auth session cookies (minimum 32 chars). |
| `AI_PHOTO_PROVIDER` | No | `mock` | Selected AI photo provider: `mock`, `remove.bg`, or `fal.ai`. |
| `REMOVE_BG_API_KEY` | If using `remove.bg` | — | API key for remove.bg background removal. |
| `FAL_KEY` | If using `fal.ai` | — | API key for fal.ai (BiRefNet portrait segmentation model). |
| `AI_AUDIO_PROVIDER` | No | `mock` | Selected AI audio provider: `mock` or `elevenlabs`. |
| `ELEVENLABS_API_KEY` | If using `elevenlabs` | — | API key for ElevenLabs Audio Isolation API. |
| `R2_ACCOUNT_ID` | If using R2 | — | Cloudflare account identifier. |
| `R2_ACCESS_KEY_ID` | If using R2 | — | Cloudflare R2 S3 API access key ID. |
| `R2_SECRET_ACCESS_KEY` | If using R2 | — | Cloudflare R2 S3 API secret access key. |
| `R2_BUCKET_NAME` | If using R2 | — | Name of your Cloudflare R2 bucket. |
| `R2_PUBLIC_DOMAIN` | If using R2 | — | Public CDN or custom domain mapped to the R2 bucket. |
| `R2_ENDPOINT` | If using R2 | — | S3-compatible R2 endpoint (`https://<account_id>.r2.cloudflarestorage.com`). |
| `PADDLE_API_KEY` | If using payments | — | Paddle Vendor API authorization key. |
| `PADDLE_WEBHOOK_SECRET` | If using payments | — | Secret key used to verify Paddle webhook signatures. |

---

## 9. Testing & Quality Assurance

The codebase includes an extensive automated test suite covering unit operations, component interactions, API routes, and end-to-end monetization flows.

### Running Tests
Execute the entire test suite via Vitest:

```bash
npm test
```

Run tests in watch mode during development:

```bash
npx vitest
```

Run a specific test suite (e.g. video trimmer or photo transformations):

```bash
npx vitest tests/video/videoTrimmer.test.ts
npx vitest tests/photo/imageTransforms.test.ts
```

### Test Coverage Highlights
- **Image Transformations:** Canvas crop geometry, aspect ratios, bilinear scaling, and format conversions.
- **Video Calculations:** Timestamp formatting, dual-handle range validation, and aspect ratio crop boxes.
- **Hybrid Audio Extraction:** Calculation of 30-second billing units and presets.
- **Provider Adapters:** Verifies mock, remove.bg, and fal.ai adapters with data URLs and external URLs.
- **Authentication & Security:** PBKDF2 hash verification, session cookie signing, and timing-safe comparison.
- **Monetization & Entitlement:** 1-credit trial enforcement, credit deduction logic, and Paddle webhook HMAC signature verification.

---

## 10. Production Deployment

The project is optimized for deployment to a single low-cost **Ubuntu VPS ($6–$10/month)** using Docker Compose and Caddy.

### Single-Command Deployment via Docker Compose

1. **Clone to server:**
   ```bash
   git clone https://github.com/your-username/online-editing.git /opt/editor
   cd /opt/editor
   ```

2. **Configure `.env`:**
   Set `APP_DOMAIN=editor.yourdomain.com`, `DATABASE_URL`, and credentials.

3. **Launch containers:**
   ```bash
   docker compose up -d --build
   ```

4. **Run migrations inside container:**
   ```bash
   docker compose exec app npx prisma db push
   ```

Caddy automatically provisions and renews SSL certificates from Let's Encrypt for your domain. For detailed VPS hardening, firewall configuration, and automated backups, see the [Single VPS Deployment Guide](docs/DEPLOYMENT.md).

---

## 11. API Route Documentation

All API routes are served under `/api` and utilize JSON bodies:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user account with email and password | No |
| `POST` | `/api/auth/login` | Authenticate and issue an HTTP-only session cookie | No |
| `POST` | `/api/auth/logout` | Terminate session and invalidate cookie | No |
| `GET` | `/api/auth/session` | Fetch active authenticated user profile & credit balance | No |
| `POST` | `/api/photo/remove-background` | Remove background from image via AI provider | Free Trial or 1 Credit |
| `POST` | `/api/audio/remove-noise` | Speech isolation and noise removal on audio track | Free Trial or 1 Credit / 30s |
| `POST` | `/api/media/upload-url` | Generate presigned S3 upload URL for Cloudflare R2 | Optional |
| `GET` | `/api/config/limits` | Retrieve active system constraints and media limits | No |
| `POST` | `/api/billing/checkout` | Generate Paddle checkout session for credit purchase | Yes |
| `POST` | `/api/webhooks/paddle` | Cryptographically verified Paddle payment webhook | Verified signature |
| `POST` | `/api/webhooks/ai-provider` | Asynchronous completion callback for long-running AI jobs | Verified payload |
| `GET` | `/api/account/transactions` | Retrieve user's credit purchase and usage history | Yes |

---

## 12. Roadmap

- [x] **Phase 1: Foundation & Architecture** (Monorepo, responsive workspace shells, centralized constraints, Prisma schemas).
- [x] **Phase 2: Photo MVP** (Browser canvas crop, resize, compressor, converter, enhancer, AI background cutout & changer).
- [x] **Phase 3: Video MVP** (Browser video trimmer, compressor, resizer, Web Audio API hybrid noise removal).
- [x] **Phase 4: Monetization & Release** (Paddle MoR checkout, credit transactions, R2 transient storage with 24h expiration, single-VPS Docker/Caddy deployment).
- [ ] **Phase 5: Planned Enhancements**
  - Automatic subtitle generator with Whisper / speech-to-text API.
  - In-browser background removal using lightweight ONNX Runtime Web / Transformers.js models.
  - Video speed adjustment and reverse playback controls.
  - Multi-track audio mixing and background music library.

---

## 13. License

This project is licensed under the [MIT License](LICENSE).

