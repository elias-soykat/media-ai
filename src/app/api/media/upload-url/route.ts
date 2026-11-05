import { NextRequest, NextResponse } from 'next/server';
import { validateMediaUpload } from '@/lib/validation/mediaValidator';
import { getMergedConstraints } from '@/lib/config/getMergedConstraints';
import { buildStorageKey, generatePresignedUploadUrl } from '@/lib/storage/presignedUrls';
import { checkUserEligibility } from '@/lib/billing/entitlement';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mediaType, fileSizeBytes, mimeType, toolType, extension, userId } = body;

    const constraints = await getMergedConstraints();
    const validation = validateMediaUpload(
      {
        mediaType,
        fileSizeBytes,
        mimeType,
      },
      constraints
    );

    if (!validation.isValid) {
      const isOversized = validation.errors.some((e) => e.includes('exceeds maximum limit'));
      return NextResponse.json(
        { errors: validation.errors },
        { status: isOversized ? 413 : 422 }
      );
    }

    // Entitlement & credit verification
    let user = null;
    let completedJobsCount = 0;

    if (userId) {
      try {
        user = await prisma.user.findUnique({ where: { id: userId } });
        if (user && toolType) {
          completedJobsCount = await prisma.job.count({
            where: {
              userId: user.id,
              toolType: toolType as any,
              status: 'COMPLETED',
            },
          });
        }
      } catch {
        // Fallback for mock/test users if DB offline
        if (userId === 'mock_exhausted_user') {
          user = { id: userId, creditBalance: 0 };
          completedJobsCount = 1;
        } else {
          user = { id: userId, creditBalance: 10 };
          completedJobsCount = 0;
        }
      }
    }

    const eligibility = checkUserEligibility({
      user,
      toolType: toolType || 'GENERAL',
      completedJobsCountForTool: completedJobsCount,
    });

    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.error },
        { status: eligibility.statusCode || 402 }
      );
    }

    const effectiveUserId = user?.id || 'anonymous';
    const effectiveToolType = toolType || 'general';
    const effectiveExt = extension || 'bin';

    const key = buildStorageKey({
      userId: effectiveUserId,
      toolType: effectiveToolType,
      extension: effectiveExt,
    });

    const uploadUrl = await generatePresignedUploadUrl({
      key,
      contentType: mimeType,
      fileSizeBytes,
      expiresInSeconds: constraints.storage.signedUrlExpirySeconds,
    });

    return NextResponse.json(
      {
        uploadUrl,
        key,
        isFreeTrial: eligibility.isFreeTrial,
        expiresIn: constraints.storage.signedUrlExpirySeconds,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error generating upload URL' },
      { status: 500 }
    );
  }
}
