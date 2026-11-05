import { describe, it, expect, vi } from 'vitest';
import { APP_CONSTRAINTS } from '@/config/constraints';
import { validateMediaUpload } from '@/lib/validation/mediaValidator';
import { applyEnhancements, clampPixel, ENHANCEMENT_PRESETS } from '@/lib/photo/imageEnhancer';
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
import { hashPassword, verifyPassword, generateSessionToken, verifySessionToken } from '@/lib/auth/authService';
import { CREDIT_PACKS } from '@/lib/billing/paddleClient';
import { generatePaddleWebhookSignature, verifyPaddleWebhookSignature } from '@/lib/billing/paddleWebhookValidator';
import { checkUserEligibility } from '@/lib/billing/entitlement';
import { buildStorageKey } from '@/lib/storage/presignedUrls';
import { prisma } from '@/lib/prisma';
import { POST as paddleWebhookPost } from '@/app/api/webhooks/paddle/route';
import { NextRequest } from 'next/server';

describe('Comprehensive Full-Stack MVP System Audit', () => {
  describe('1. Global Constraints & Dual-Enforcement Layer', () => {
    it('should accurately enforce photo file size limits', () => {
      // 20 MB photo -> valid
      const validPhoto = validateMediaUpload(
        {
          mediaType: 'photo',
          fileSizeBytes: 20 * 1024 * 1024,
          mimeType: 'image/png',
        },
        APP_CONSTRAINTS
      );
      expect(validPhoto.isValid).toBe(true);

      // 30 MB photo -> rejected (> 25MB)
      const oversizedPhoto = validateMediaUpload(
        {
          mediaType: 'photo',
          fileSizeBytes: 30 * 1024 * 1024,
          mimeType: 'image/png',
        },
        APP_CONSTRAINTS
      );
      expect(oversizedPhoto.isValid).toBe(false);
      expect(oversizedPhoto.errors[0]).toMatch(/25MB/i);
    });

    it('should accurately enforce video duration and resolution limits', () => {
      // 120s 1080p -> valid (< 180s, <= 1080p)
      const validVideo = validateMediaUpload(
        {
          mediaType: 'video',
          fileSizeBytes: 50 * 1024 * 1024,
          mimeType: 'video/mp4',
          durationSeconds: 120,
          resolution: { width: 1920, height: 1080 },
        },
        APP_CONSTRAINTS
      );
      expect(validVideo.isValid).toBe(true);

      // 240s 4K video -> rejected (> 180s, > 1080p)
      const invalidVideo = validateMediaUpload(
        {
          mediaType: 'video',
          fileSizeBytes: 120 * 1024 * 1024,
          mimeType: 'video/mp4',
          durationSeconds: 240,
          resolution: { width: 3840, height: 2160 },
        },
        APP_CONSTRAINTS
      );
      expect(invalidVideo.isValid).toBe(false);
      expect(invalidVideo.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate namespaced R2 storage keys with user separation', () => {
      const key = buildStorageKey({
        userId: 'usr_audit_42',
        toolType: 'PHOTO_BG_REMOVER',
        extension: 'png',
      });
      expect(key).toMatch(
        /^temp\/usr_audit_42\/PHOTO_BG_REMOVER\/[0-9]+_[a-z0-9]+\.png$/
      );
    });
  });

  describe('2. Browser-Native Photo Editing Engine', () => {
    it('should adjust pixel RGB values without modifying alpha channel', () => {
      const rawData = new Uint8ClampedArray([50, 100, 150, 255]);
      const mockImageData = {
        data: rawData,
        width: 1,
        height: 1,
      } as ImageData;

      const enhanced = applyEnhancements(mockImageData, { brightness: 15 });
      expect(enhanced.data[0]).toBe(65);
      expect(enhanced.data[1]).toBe(115);
      expect(enhanced.data[2]).toBe(165);
      expect(enhanced.data[3]).toBe(255);
      expect(clampPixel(300)).toBe(255);
      expect(clampPixel(-10)).toBe(0);
      expect(Object.keys(ENHANCEMENT_PRESETS)).toContain('studio');
    });

    it('should calculate centered crop rect with even-pixel parity', () => {
      const rect = calculateCropRect(1920, 1080, '1:1');
      expect(rect.width).toBe(1080);
      expect(rect.height).toBe(1080);
      expect(rect.x).toBe((1920 - 1080) / 2);
      expect(rect.y).toBe(0);
      expect(rect.width % 2).toBe(0);
    });

    it('should calculate proportional resizing with aspect ratio lock and percentages', () => {
      const scaled = calculateTargetDimensions(1920, 1080, {
        width: 960,
        maintainAspectRatio: true,
      });
      expect(scaled.width).toBe(960);
      expect(scaled.height).toBe(540);

      const percentScaled = calculateTargetDimensions(1000, 800, {
        percentage: 25,
        maintainAspectRatio: true,
      });
      expect(percentScaled.width).toBe(250);
      expect(percentScaled.height).toBe(200);

      expect(formatToMimeType('webp')).toBe('image/webp');
    });

    it('should calculate background layer contain/cover positioning and presets', () => {
      const fitted = calculateFittedDimensions(800, 600, 1600, 1200, 'cover');
      expect(fitted.drawWidth).toBe(800);
      expect(fitted.drawHeight).toBe(600);
      expect(fitted.dx).toBe(0);
      expect(fitted.dy).toBe(0);
      expect(BACKGROUND_PRESETS.solidColors).toContain('#FFFFFF');
    });
  });

  describe('3. Browser-Native Video & Audio Engine', () => {
    it('should calculate trimmed boundaries and durations accurately', () => {
      const valid = validateTrimRange(10, 25, 60);
      expect(valid.isValid).toBe(true);

      const trimmedDuration = calculateTrimmedDuration(10, 25);
      expect(trimmedDuration).toBe(15);
      expect(formatTimestamp(65)).toBe('01:05');
      expect(parseTimestamp('01:05')).toBe(65);
    });

    it('should resize video to social aspect ratios (9:16 vertical reels)', () => {
      const rect = calculateVideoCropRect(1920, 1080, '9:16');
      expect(rect.width % 2).toBe(0);
      expect(rect.height % 2).toBe(0);
      expect(rect.width).toBe(608);

      const scaled = calculateVideoScaledDimensions(1920, 1080, '720p');
      expect(scaled.width).toBe(1280);
      expect(scaled.height).toBe(720);
      expect(SUPPORTED_VIDEO_PRESETS).toHaveProperty('9:16');
    });

    it('should estimate compression size reduction for quality tiers', () => {
      // 60s 1080p video: medium compression is between 10MB and 40MB
      const size = estimateCompressedVideoSize(60, '1080p', 'medium');
      expect(size).toBeGreaterThan(10 * 1024 * 1024);
      expect(size).toBeLessThan(40 * 1024 * 1024);
    });
  });

  describe('4. Authentication, Security, and Session Management', () => {
    it('should hash passwords with PBKDF2 and verify with timing safety', () => {
      const { hash, salt } = hashPassword('CorrectPassword123!');
      expect(verifyPassword('CorrectPassword123!', hash, salt)).toBe(true);
      expect(verifyPassword('AttackerWrongPassword', hash, salt)).toBe(false);
    });

    it('should verify signed session tokens and reject forged tokens', () => {
      const token = generateSessionToken('usr_legit_user');
      const verified = verifySessionToken(token);
      expect(verified?.userId).toBe('usr_legit_user');

      // Forged token
      expect(verifySessionToken(token + 'tampered')).toBeNull();
    });
  });

  describe('5. Paddle Monetization & Cryptographic Webhooks', () => {
    it('should provide 3 PRD credit packs with correct volume discounts', () => {
      expect(CREDIT_PACKS.starter.credits).toBe(50);
      expect(CREDIT_PACKS.pro.credits).toBe(200);
      expect(CREDIT_PACKS.studio.credits).toBe(500);
      expect(CREDIT_PACKS.studio.pricePerCredit).toBeLessThan(
        CREDIT_PACKS.starter.pricePerCredit
      );
    });

    it('should verify HMAC-SHA256 signatures with timestamp drift rejection', () => {
      const secret = 'pdl_secret_comprehensive';
      const payload = JSON.stringify({ event_type: 'transaction.completed' });

      // Valid signature (fresh)
      const freshSig = generatePaddleWebhookSignature(payload, secret);
      expect(verifyPaddleWebhookSignature(payload, freshSig, secret, 300)).toBe(
        true
      );

      // Replay signature (10 minutes old > 300s window)
      const staleTs = Math.floor(Date.now() / 1000) - 600;
      const staleSig = generatePaddleWebhookSignature(payload, secret, staleTs);
      expect(verifyPaddleWebhookSignature(payload, staleSig, secret, 300)).toBe(
        false
      );
    });

    it('should process webhook idempotently using unique paddleTxnId', async () => {
      const secret =
        process.env.PADDLE_WEBHOOK_SECRET || 'mock_paddle_webhook_secret';
      const txnId = 'txn_audit_idempotent_999';
      const payload = JSON.stringify({
        event_type: 'transaction.completed',
        data: {
          id: txnId,
          custom_data: {
            userId: 'usr_audit_buyer',
            credits: 200,
            packId: 'pro',
          },
        },
      });
      const sig = generatePaddleWebhookSignature(payload, secret);

      // 1. First execution -> succeeds and credits user
      vi.spyOn(prisma.creditTransaction, 'findUnique').mockResolvedValueOnce(
        null
      );
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'usr_audit_buyer',
        email: 'buyer@example.com',
        creditBalance: 10,
      } as any);
      vi.spyOn(prisma, '$transaction').mockResolvedValueOnce([
        {} as any,
        {} as any,
      ]);

      const req1 = new NextRequest(
        'http://localhost:3000/api/webhooks/paddle',
        {
          method: 'POST',
          body: payload,
          headers: { 'Paddle-Signature': sig },
        }
      );
      const res1 = await paddleWebhookPost(req1);
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.status).toBe('success');
      expect(json1.credited).toBe(200);

      // 2. Second execution (replay / retry) -> returns already_processed
      vi.spyOn(prisma.creditTransaction, 'findUnique').mockResolvedValueOnce({
        id: 'rec_already_done',
        paddleTxnId: txnId,
        amount: 200,
        userId: 'usr_audit_buyer',
        reason: 'Paddle purchase',
        createdAt: new Date(),
      } as any);

      const req2 = new NextRequest(
        'http://localhost:3000/api/webhooks/paddle',
        {
          method: 'POST',
          body: payload,
          headers: { 'Paddle-Signature': sig },
        }
      );
      const res2 = await paddleWebhookPost(req2);
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.status).toBe('already_processed');
    });
  });

  describe('6. Entitlement Engine & Free Trial Lifecycle', () => {
    it('should grant browser-native tools to all users without authentication or credits', () => {
      const result = checkUserEligibility({
        user: null, // anonymous
        toolType: 'PHOTO_CROPPER',
        completedJobsCountForTool: 100,
      });
      expect(result.eligible).toBe(true);
      expect(result.isFreeTrial).toBe(false);
    });

    it('should enforce exactly 1 free run for AI tools, then require credits', () => {
      const user = { id: 'usr_trial_test', creditBalance: 0 };

      // Job count 0 -> 1st free run
      const run1 = checkUserEligibility({
        user,
        toolType: 'PHOTO_BG_REMOVER',
        completedJobsCountForTool: 0,
      });
      expect(run1.eligible).toBe(true);
      expect(run1.isFreeTrial).toBe(true);

      // Job count 1, 0 credits -> Rejected with 402 Credit Exhausted
      const run2 = checkUserEligibility({
        user,
        toolType: 'PHOTO_BG_REMOVER',
        completedJobsCountForTool: 1,
      });
      expect(run2.eligible).toBe(false);
      expect(run2.statusCode).toBe(402);
      expect(run2.error).toMatch(/Credit exhausted/);

      // User buys credits (creditBalance: 50) -> Eligible via credits
      const run3 = checkUserEligibility({
        user: { id: 'usr_trial_test', creditBalance: 50 },
        toolType: 'PHOTO_BG_REMOVER',
        completedJobsCountForTool: 1,
      });
      expect(run3.eligible).toBe(true);
      expect(run3.isFreeTrial).toBe(false);
    });
  });
});
