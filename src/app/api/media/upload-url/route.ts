import { NextRequest, NextResponse } from 'next/server';
import { validateMediaUpload } from '@/lib/validation/mediaValidator';
import { getMergedConstraints } from '@/lib/config/getMergedConstraints';
import { buildStorageKey, generatePresignedUploadUrl } from '@/lib/storage/presignedUrls';

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

    const effectiveUserId = userId || 'anonymous';
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
      expiresInSeconds: constraints.storage.signedUrlExpirySeconds,
    });

    return NextResponse.json(
      {
        uploadUrl,
        key,
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
