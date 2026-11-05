# E2E Test Audit Fixes & PRD Compliance Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement fixes for all 6 issues identified during browser E2E testing against `docs/PRD.md`:
1. Database connectivity and user signup/login failure.
2. Dark-mode theme contrast issues (white-on-white text).
3. 404 broken routes (`/ai-tools`, `/privacy`, `/terms`, `/contact`).
4. Missing PRD homepage sections (Photo/Video showcases, AI features, How it works, Pricing preview, FAQ).
5. Missing subscription tiers & comparison table on `/pricing`.
6. React hydration mismatch in `/my-projects`.

---

## Tasks

### Task 1: Fix Database Connectivity & Auth Handling
- [ ] Update `.env` to configure `DATABASE_URL="postgresql://postgres@localhost/online_editing?host=/tmp"`.
- [ ] Update `tests/api/removeNoiseRoute.test.ts` to accept ElevenLabs provider error gracefully.
- [ ] Verify Prisma schema is pushed and run `npm test` to confirm all 42 test suites pass.

### Task 2: Resolve 404 Broken Routes & Header/Footer Navigation
- [ ] Create `src/app/ai-tools/page.tsx` showcasing AI features with deep links to `/photo-editor` and `/video-editor`.
- [ ] Create `src/app/privacy/page.tsx` with privacy policy reflecting PRD §9 privacy guarantees (client-side processing, 24h retention).
- [ ] Create `src/app/terms/page.tsx` with terms of service.
- [ ] Create `src/app/contact/page.tsx` with support contact options and FAQ link.

### Task 3: Fix Theme & Dark-Mode Styling Contrast
- [ ] In `src/app/layout.tsx`, ensure `dark` class is applied to `<html>` and default text/background colors are consistent.
- [ ] In `src/app/photo-editor/page.tsx`, replace unthemed `bg-white` classes on controls and Export panel with `bg-card` / `bg-zinc-900 border-zinc-800`.
- [ ] In `src/app/video-editor/page.tsx`, update timecode inputs and export panel to ensure high contrast in dark mode.
- [ ] In `src/app/my-projects/page.tsx`, style `<thead>` and cards with theme-aware classes.
- [ ] In `src/app/page.tsx`, fix the active tab button styling so labels are always readable.

### Task 4: Complete PRD Homepage Sections (`src/app/page.tsx`)
- [ ] Add Section 4: Photo Editing Tools showcase.
- [ ] Add Section 5: Video Editing Tools showcase.
- [ ] Add Section 6: AI-Powered Features showcase.
- [ ] Add Section 7: How It Works (3-step workflow: Upload -> Edit -> Export).
- [ ] Add Section 8: Pricing Preview card grid.
- [ ] Add Section 9: FAQ accordion.

### Task 5: Complete Pricing Page PRD Tiers & Feature Matrix (`src/app/pricing/page.tsx`)
- [ ] Add PRD §7 Subscription Tiers (Free $0, Pay As You Go $5+, Pro $15/mo, Business $49/mo).
- [ ] Maintain the Pay-As-You-Go credit packages (Starter, Pro, Studio).
- [ ] Add comprehensive Feature Comparison Table comparing Free, Pay-As-You-Go, Pro, and Business tiers.

### Task 6: Fix Hydration Mismatch in `/my-projects`
- [ ] Update `src/app/my-projects/page.tsx` date rendering with `suppressHydrationWarning` and safe client mounting.

### Task 7: Full Verification
- [ ] Run `npm test` across all unit and integration tests.
- [ ] Restart dev server and verify all pages via curl / subagent verification.

