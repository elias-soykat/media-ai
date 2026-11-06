import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { APP_CONSTRAINTS } from '@/config/constraints';
import { getMergedConstraints } from '@/lib/config/getMergedConstraints';
import { validateMediaUpload } from '@/lib/validation/mediaValidator';
import { enhanceImage, clampPixel, applyEnhancements, ENHANCEMENT_PRESETS } from '@/lib/photo/imageEnhancer';
import { calculateTargetDimensions, calculateCropRect, formatToMimeType } from '@/lib/photo/imageTransforms';
import { calculateFittedDimensions, BACKGROUND_PRESETS } from '@/lib/photo/backgroundCompositor';
import {
  calculateTrimmedDuration,
  validateTrimRange,
  formatTimestamp,
  parseTimestamp,
} from '@/lib/video/videoTrimmer';
import {
  calculateVideoCropRect,
  calculateVideoScaledDimensions,
  estimateCompressedVideoSize,
  SUPPORTED_VIDEO_PRESETS,
} from '@/lib/video/videoTransforms';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  verifySessionToken,
} from '@/lib/auth/authService';
import { CREDIT_PACKS, createPaddleCheckoutSession } from '@/lib/billing/paddleClient';
import {
  generatePaddleWebhookSignature,
  verifyPaddleWebhookSignature,
} from '@/lib/billing/paddleWebhookValidator';
import { checkUserEligibility } from '@/lib/billing/entitlement';
import { buildStorageKey, generatePresignedUploadUrl } from '@/lib/storage/presignedUrls';
import { isJobExpired, formatTimeRemaining } from '@/lib/jobs/expiry';

// Route Handlers
import { POST as signupPost } from '@/app/api/auth/signup/route';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as logoutPost } from '@/app/api/auth/logout/route';
import { GET as sessionGet } from '@/app/api/auth/session/route';
import { POST as checkoutPost } from '@/app/api/billing/checkout/route';
import { POST as paddleWebhookPost } from '@/app/api/webhooks/paddle/route';
import { GET as limitsGet } from '@/app/api/config/limits/route';
import { GET as transactionsGet } from '@/app/api/account/transactions/route';
import { POST as uploadUrlPost } from '@/app/api/media/upload-url/route';
import { POST as removeBackgroundPost } from '@/app/api/photo/remove-background/route';
import { POST as removeNoisePost } from '@/app/api/audio/remove-noise/route';
import { NextRequest } from 'next/server';

describe('Senior QA Comprehensive User-Flow & Backend Verification', () => {
  let testUser: any = null;

  beforeAll(async () => {
    // Clean up test database records before running QA suite
    await prisma.creditTransaction.deleteMany().catch(() => {});
    await prisma.job.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
    await prisma.systemConstraint.deleteMany().catch(() => {});

    testUser = await prisma.user.create({
      data: {
        email: 'qa_monetization_user@example.com',
        passwordHash: 'dummy:hash',
        creditBalance: 0, // Starts with 0 credits
      },
    });
  });

  afterAll(async () => {
    await prisma.creditTransaction.deleteMany().catch(() => {});
    await prisma.job.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
    await prisma.systemConstraint.deleteMany().catch(() => {});
    await prisma.$disconnect();
  });

  // =========================================================================
  // JOURNEY A: First-Time Visitor (Unauthenticated Public User Flow)
  // =========================================================================
  describe('User Journey A: First-Time Visitor', () => {
    it('QA-A01: Unauthenticated session verification returns unauthenticated state', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET',
      });
      const res = await sessionGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.authenticated).toBe(false);
      expect(json.user).toBeNull();
    });

    it('QA-A02: Public configuration endpoint returns active constraints', async () => {
      const res = await limitsGet();
      expect(res.status).toBe(200);
      const constraints = await res.json();
      expect(constraints.photo.maxFileSizeBytes).toBe(25 * 1024 * 1024);
      expect(constraints.video.maxFileSizeBytes).toBe(100 * 1024 * 1024);
      expect(constraints.storage.retentionHours).toBe(24);
      expect(constraints.billing.initialFreeCredits).toBe(1);
    });

    it('QA-A03: Unauthenticated user is barred from checkout and directed to login', async () => {
      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ packId: 'pro' }),
      });
      const res = await checkoutPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/Authentication required/i);
    });

    it('QA-A04: Browser-native tools are granted to anonymous visitors with zero credits', () => {
      const cropperEligibility = checkUserEligibility({
        user: null,
        toolType: 'PHOTO_CROPPER',
        completedJobsCountForTool: 0,
      });
      expect(cropperEligibility.eligible).toBe(true);
      expect(cropperEligibility.isFreeTrial).toBe(false);

      const trimmerEligibility = checkUserEligibility({
        user: null,
        toolType: 'VIDEO_TRIMMER',
        completedJobsCountForTool: 0,
      });
      expect(trimmerEligibility.eligible).toBe(true);
      expect(trimmerEligibility.isFreeTrial).toBe(false);
    });
  });

  // =========================================================================
  // JOURNEY B: Account Registration, Authentication, & Security
  // =========================================================================
  describe('User Journey B: Registration & Authentication', () => {
    const testEmail = 'qa_tester_2026@example.com';
    const testPassword = 'StrongPassword2026!';
    let sessionCookie = '';
    let registeredUserId = '';

    it('QA-B01: Rejects registration with missing or invalid email format', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid_email_without_at', password: testPassword }),
      });
      const res = await signupPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Valid email/i);
    });

    it('QA-B02: Rejects registration with weak password (< 8 chars)', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, password: 'short' }),
      });
      const res = await signupPost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/at least 8 characters/i);
    });

    it('QA-B03: Successfully registers user, hashes password with PBKDF2/salt in PostgreSQL', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      const res = await signupPost(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.email).toBe(testEmail);
      registeredUserId = json.user.id;

      // Extract set-cookie
      const setCookie = res.headers.get('set-cookie');
      expect(setCookie).toContain('session_token=');
      sessionCookie = setCookie!.split(';')[0];

      // Verify database record
      const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
      expect(dbUser).not.toBeNull();
      expect(dbUser!.passwordHash).not.toBe(testPassword);
      expect(dbUser!.passwordHash).toContain(':'); // salt:hash format

      // Verify PBKDF2 salt and hash authenticity
      const [salt, hash] = dbUser!.passwordHash.split(':');
      expect(verifyPassword(testPassword, hash, salt)).toBe(true);
    });

    it('QA-B04: Rejects duplicate registration with HTTP 409 Conflict', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      const res = await signupPost(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toMatch(/already exists/i);
    });

    it('QA-B05: Authenticated session endpoint returns user identity via session cookie', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET',
        headers: { cookie: sessionCookie },
      });
      const res = await sessionGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.authenticated).toBe(true);
      expect(json.user.id).toBe(registeredUserId);
      expect(json.user.email).toBe(testEmail);
    });

    it('QA-B06: Rejects forged or tampered session cookie', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET',
        headers: { cookie: `${sessionCookie}_tampered` },
      });
      const res = await sessionGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.authenticated).toBe(false);
    });

    it('QA-B07: Logs out user and clears session cookie', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });
      const res = await logoutPost(req);
      expect(res.status).toBe(200);
      const cookieHeader = res.headers.get('set-cookie');
      expect(cookieHeader).toContain('session_token=');
      expect(cookieHeader).toContain('Max-Age=0');
    });

    it('QA-B08: Rejects login with incorrect password', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, password: 'WrongPassword123' }),
      });
      const res = await loginPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid email or password/i);
    });

    it('QA-B09: Successfully logs in with correct credentials and issues new session', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      const res = await loginPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.user.id).toBe(registeredUserId);
    });
  });

  // =========================================================================
  // JOURNEY C: Photo Editing Workflows (Client & Server Validation)
  // =========================================================================
  describe('User Journey C: Photo Editing Workflows', () => {
    it('QA-C01: Validates photo upload boundaries (under 25MB, supported MIME)', () => {
      const validJpg = validateMediaUpload({
        mediaType: 'photo',
        fileSizeBytes: 15 * 1024 * 1024,
        mimeType: 'image/jpeg',
      });
      expect(validJpg.isValid).toBe(true);

      const oversized = validateMediaUpload({
        mediaType: 'photo',
        fileSizeBytes: 26 * 1024 * 1024,
        mimeType: 'image/jpeg',
      });
      expect(oversized.isValid).toBe(false);
      expect(oversized.errors[0]).toMatch(/exceeds maximum limit of 25MB/i);

      const unsupportedFormat = validateMediaUpload({
        mediaType: 'photo',
        fileSizeBytes: 2 * 1024 * 1024,
        mimeType: 'image/gif',
      });
      expect(unsupportedFormat.isValid).toBe(false);
      expect(unsupportedFormat.errors[0]).toMatch(/Unsupported photo format/i);
    });

    it('QA-C02: Applies non-destructive image enhancements deterministically', () => {
      const rawData = new Uint8ClampedArray([100, 100, 100, 255]);
      const mockImageData = { data: rawData, width: 1, height: 1 } as ImageData;

      applyEnhancements(mockImageData, { brightness: 20 });
      expect(mockImageData.data[0]).toBe(120);
      expect(mockImageData.data[1]).toBe(120);
      expect(mockImageData.data[2]).toBe(120);
      expect(mockImageData.data[3]).toBe(255); // Alpha channel untouched
      expect(clampPixel(270)).toBe(255);
      expect(clampPixel(-20)).toBe(0);
    });

    it('QA-C03: Calculates centered crop with even-pixel parity for video/image codecs', () => {
      // 1920x1080 -> 1:1 aspect ratio crop
      const rect = calculateCropRect(1920, 1080, '1:1');
      expect(rect.width).toBe(1080);
      expect(rect.height).toBe(1080);
      expect(rect.x).toBe(420);
      expect(rect.y).toBe(0);
      expect(rect.width % 2).toBe(0);
    });

    it('QA-C04: Resizes image with aspect ratio lock and percentage scaling', () => {
      const scaledWidth = calculateTargetDimensions(1200, 800, {
        width: 600,
        maintainAspectRatio: true,
      });
      expect(scaledWidth.width).toBe(600);
      expect(scaledWidth.height).toBe(400);

      const percentageScale = calculateTargetDimensions(1200, 800, {
        percentage: 50,
        maintainAspectRatio: true,
      });
      expect(percentageScale.width).toBe(600);
      expect(percentageScale.height).toBe(400);

      expect(formatToMimeType('png')).toBe('image/png');
      expect(formatToMimeType('webp')).toBe('image/webp');
    });

    it('QA-C05: Computes background compositor contain/cover dimensions and offsets', () => {
      const containFit = calculateFittedDimensions(800, 800, 1600, 800, 'contain');
      expect(containFit.drawWidth).toBe(800);
      expect(containFit.drawHeight).toBe(400);
      expect(containFit.dx).toBe(0);
      expect(containFit.dy).toBe(200);

      const coverFit = calculateFittedDimensions(800, 600, 1600, 1200, 'cover');
      expect(coverFit.drawWidth).toBe(800);
      expect(coverFit.drawHeight).toBe(600);
      expect(coverFit.dx).toBe(0);
      expect(coverFit.dy).toBe(0);
      expect(BACKGROUND_PRESETS.solidColors).toContain('#FFFFFF');
    });
  });

  // =========================================================================
  // JOURNEY D: Video Editing Workflows (Trimming, Sizing, & Compression)
  // =========================================================================
  describe('User Journey D: Video Editing Workflows', () => {
    it('QA-D01: Validates video upload boundaries (under 100MB, <= 180s, <= 1080p)', () => {
      const validVideo = validateMediaUpload({
        mediaType: 'video',
        fileSizeBytes: 80 * 1024 * 1024,
        mimeType: 'video/mp4',
        durationSeconds: 150,
        resolution: { width: 1920, height: 1080 },
      });
      expect(validVideo.isValid).toBe(true);

      const oversizedVideo = validateMediaUpload({
        mediaType: 'video',
        fileSizeBytes: 105 * 1024 * 1024,
        mimeType: 'video/mp4',
      });
      expect(oversizedVideo.isValid).toBe(false);
      expect(oversizedVideo.errors[0]).toMatch(/exceeds maximum limit of 100MB/i);

      const overDurationVideo = validateMediaUpload({
        mediaType: 'video',
        fileSizeBytes: 50 * 1024 * 1024,
        mimeType: 'video/mp4',
        durationSeconds: 200,
      });
      expect(overDurationVideo.isValid).toBe(false);
      expect(overDurationVideo.errors[0]).toMatch(/exceeds maximum limit of 180 seconds/i);
    });

    it('QA-D02: Trimmer engine validates boundaries and formats MM:SS timestamps', () => {
      expect(validateTrimRange(10, 45, 120).isValid).toBe(true);
      expect(validateTrimRange(50, 20, 120).isValid).toBe(false); // Inverted range
      expect(validateTrimRange(0, 150, 120).isValid).toBe(false); // Exceeds duration
      expect(validateTrimRange(10, 10.2, 120).isValid).toBe(false); // Sub-minimum duration (<0.5s)

      expect(calculateTrimmedDuration(15.5, 45.2)).toBeCloseTo(29.7, 1);
      expect(formatTimestamp(125)).toBe('02:05');
      expect(parseTimestamp('02:05')).toBe(125);
    });

    it('QA-D03: Resizes video to vertical 9:16 reels with even-pixel parity', () => {
      const rect = calculateVideoCropRect(1920, 1080, '9:16');
      expect(rect.height).toBe(1080);
      expect(rect.width).toBe(608);
      expect(rect.width % 2).toBe(0);
      expect(rect.height % 2).toBe(0);

      const scaledDown = calculateVideoScaledDimensions(1920, 1080, '720p');
      expect(scaledDown.width).toBe(1280);
      expect(scaledDown.height).toBe(720);
      expect(SUPPORTED_VIDEO_PRESETS).toHaveProperty('9:16');
      expect(SUPPORTED_VIDEO_PRESETS).toHaveProperty('16:9');
    });

    it('QA-D04: Estimates compression size reduction accurately based on bitrate presets', () => {
      const highBytes = estimateCompressedVideoSize(60, '1080p', 'high');
      const medBytes = estimateCompressedVideoSize(60, '1080p', 'medium');
      const lowBytes = estimateCompressedVideoSize(60, '1080p', 'low');

      expect(highBytes).toBeGreaterThan(medBytes);
      expect(medBytes).toBeGreaterThan(lowBytes);
    });
  });

  // =========================================================================
  // JOURNEY E: Freemium Monetization, Real Database Credits, & Webhooks
  // =========================================================================
  describe('User Journey E: Monetization & Credit Accounting in PostgreSQL', () => {
    it('QA-E01: First AI job consumes the 1x free trial allowance without deducting credits', async () => {
      const req = new NextRequest('http://localhost:3000/api/photo/remove-background', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: 'https://example.com/test_portrait.png',
          userId: testUser.id,
        }),
      });

      const res = await removeBackgroundPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.isFreeTrial).toBe(true);
      expect(json.outputUrl).toBeDefined();

      // Verify job recorded in PostgreSQL
      const dbJob = await prisma.job.findFirst({
        where: { userId: testUser.id, toolType: 'PHOTO_BG_REMOVER' },
      });
      expect(dbJob).not.toBeNull();
      expect(dbJob!.status).toBe('COMPLETED');
      expect(dbJob!.expiresAt).not.toBeNull();

      // Verify credit balance remained 0 (free trial consumed)
      const userAfter = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(userAfter!.creditBalance).toBe(0);
    });

    it('QA-E02: Second AI job with free trial exhausted and 0 credits is rejected with HTTP 402', async () => {
      const req = new NextRequest('http://localhost:3000/api/photo/remove-background', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: 'https://example.com/test_portrait_2.png',
          userId: testUser.id,
        }),
      });

      const res = await removeBackgroundPost(req);
      expect(res.status).toBe(402);
      const json = await res.json();
      expect(json.error).toMatch(/Credit exhausted/i);
    });

    it('QA-E03: Paddle checkout session can be initiated for authenticated user', async () => {
      const token = generateSessionToken(testUser.id);
      const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ packId: 'pro' }),
        headers: { cookie: `session_token=${token}` },
      });

      const res = await checkoutPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.pack.credits).toBe(200);
      expect(json.checkoutUrl).toContain('checkout');
    });

    it('QA-E04: Paddle webhook fulfills purchase atomically and credits PostgreSQL balance', async () => {
      const secret = process.env.PADDLE_WEBHOOK_SECRET || 'mock_paddle_webhook_secret';
      const txnId = `txn_qa_${Date.now()}`;
      const payload = JSON.stringify({
        event_type: 'transaction.completed',
        data: {
          id: txnId,
          custom_data: { userId: testUser.id, credits: 200, packId: 'pro' },
        },
      });

      const sig = generatePaddleWebhookSignature(payload, secret);
      const req = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: payload,
        headers: { 'Paddle-Signature': sig },
      });

      const res = await paddleWebhookPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('success');
      expect(json.credited).toBe(200);

      // Verify PostgreSQL user creditBalance incremented to 200
      const userUpdated = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(userUpdated!.creditBalance).toBe(200);

      // Verify CreditTransaction audit record exists in PostgreSQL
      const txnRecord = await prisma.creditTransaction.findUnique({
        where: { paddleTxnId: txnId },
      });
      expect(txnRecord).not.toBeNull();
      expect(txnRecord!.amount).toBe(200);
    });

    it('QA-E05: Webhook idempotency prevents double-crediting on webhook replay', async () => {
      const secret = process.env.PADDLE_WEBHOOK_SECRET || 'mock_paddle_webhook_secret';
      // Re-send the exact same payload
      const txnRecord = await prisma.creditTransaction.findFirst({
        where: { userId: testUser.id },
      });
      const txnId = txnRecord!.paddleTxnId!;

      const payload = JSON.stringify({
        event_type: 'transaction.completed',
        data: {
          id: txnId,
          custom_data: { userId: testUser.id, credits: 200, packId: 'pro' },
        },
      });

      const sig = generatePaddleWebhookSignature(payload, secret);
      const req = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: payload,
        headers: { 'Paddle-Signature': sig },
      });

      const res = await paddleWebhookPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('already_processed');

      // Verify balance was NOT incremented again (stays 200)
      const userChecked = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(userChecked!.creditBalance).toBe(200);
    });

    it('QA-E06: Subsequent AI job consumes 1 credit atomically and creates audit ledger record', async () => {
      const req = new NextRequest('http://localhost:3000/api/photo/remove-background', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl: 'https://example.com/test_portrait_3.png',
          userId: testUser.id,
        }),
      });

      const res = await removeBackgroundPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.isFreeTrial).toBe(false);
      expect(json.remainingCredits).toBe(199);

      // Verify user balance in PostgreSQL decremented to 199
      const userAfter = await prisma.user.findUnique({ where: { id: testUser.id } });
      expect(userAfter!.creditBalance).toBe(199);

      // Verify CreditTransaction decrement record exists
      const debitTxn = await prisma.creditTransaction.findFirst({
        where: { userId: testUser.id, amount: -1 },
      });
      expect(debitTxn).not.toBeNull();
    });

    it('QA-E07: Account transactions route returns ordered ledger to the user', async () => {
      const token = generateSessionToken(testUser.id);
      const req = new NextRequest('http://localhost:3000/api/account/transactions', {
        method: 'GET',
        headers: { cookie: `session_token=${token}` },
      });

      const res = await transactionsGet(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.transactions.length).toBeGreaterThanOrEqual(2);
      expect(json.transactions[0].amount).toBe(-1); // Most recent
      expect(json.transactions[1].amount).toBe(200); // Prior purchase
    });
  });

  // =========================================================================
  // JOURNEY F: Cloud Storage, Retention, & Database Overrides
  // =========================================================================
  describe('User Journey F: Storage Retention & Database Overrides', () => {
    it('QA-F01: S3/R2 presigned upload URL generates with 24-hour expiration key', async () => {
      const req = new NextRequest('http://localhost:3000/api/media/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          mediaType: 'photo',
          fileSizeBytes: 2 * 1024 * 1024,
          mimeType: 'image/jpeg',
          toolType: 'PHOTO_BG_REMOVER',
          userId: testUser.id,
        }),
      });

      const res = await uploadUrlPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.uploadUrl).toBeDefined();
      expect(json.key).toMatch(new RegExp(`^temp/${testUser.id}/PHOTO_BG_REMOVER/`));
      // Free trial was consumed in Journey E, so user is now on purchased credits
      expect(json.isFreeTrial).toBe(false);
    });

    it('QA-F02: 24-hour expiration calculation correctly identifies active vs expired media', () => {
      const activeExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const expiredExpiresAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      expect(isJobExpired(activeExpiresAt)).toBe(false);
      expect(isJobExpired(expiredExpiresAt)).toBe(true);
      expect(formatTimeRemaining(activeExpiresAt)).toMatch(/1[12]h/);
      expect(formatTimeRemaining(expiredExpiresAt)).toBe('Expired');
    });

    it('QA-F03: Database overrides dynamically update system constraints at runtime', async () => {
      // Insert a database override into PostgreSQL
      await prisma.systemConstraint.create({
        data: {
          key: 'video.maxFileSizeBytes',
          value: 150 * 1024 * 1024, // Admin increases video size to 150MB
        },
      });

      const merged = await getMergedConstraints();
      expect(merged.video.maxFileSizeBytes).toBe(150 * 1024 * 1024);
      expect(merged.photo.maxFileSizeBytes).toBe(25 * 1024 * 1024); // Untouched default

      // Clean up override
      await prisma.systemConstraint.delete({ where: { key: 'video.maxFileSizeBytes' } });
      const resetConstraints = await getMergedConstraints();
      expect(resetConstraints.video.maxFileSizeBytes).toBe(100 * 1024 * 1024); // Returned to default
    });
  });

  // =========================================================================
  // JOURNEY G: Security, Replay Defense, & Concurrency
  // =========================================================================
  describe('User Journey G: Security & Replay Attack Defense', () => {
    it('QA-G01: Rejects Paddle webhooks with expired timestamps (>300s drift)', async () => {
      const secret = process.env.PADDLE_WEBHOOK_SECRET || 'mock_paddle_webhook_secret';
      const staleTimestamp = Math.floor(Date.now() / 1000) - 500; // 500s ago (> 300s)
      const payload = JSON.stringify({ event_type: 'transaction.completed' });
      const staleSignature = generatePaddleWebhookSignature(payload, secret, staleTimestamp);

      const req = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: payload,
        headers: { 'Paddle-Signature': staleSignature },
      });

      const res = await paddleWebhookPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid webhook signature or expired timestamp/i);
    });

    it('QA-G02: Rejects Paddle webhooks with tampered payload', async () => {
      const secret = process.env.PADDLE_WEBHOOK_SECRET || 'mock_paddle_webhook_secret';
      const payload = JSON.stringify({ event_type: 'transaction.completed' });
      const signature = generatePaddleWebhookSignature(payload, secret);

      const req = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
        method: 'POST',
        body: payload + 'tamper',
        headers: { 'Paddle-Signature': signature },
      });

      const res = await paddleWebhookPost(req);
      expect(res.status).toBe(401);
    });
  });
});
