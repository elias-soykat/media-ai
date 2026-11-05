import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client } from './r2Client';
import { APP_CONSTRAINTS } from '@/config/constraints';

export interface StorageKeyParams {
  userId: string;
  toolType: string;
  extension: string;
}

export function buildStorageKey({ userId, toolType, extension }: StorageKeyParams): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const cleanExt = extension.replace(/^\./, '');
  return `temp/${userId}/${toolType}/${timestamp}_${randomStr}.${cleanExt}`;
}

export interface PresignedUploadUrlOptions {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

export async function generatePresignedUploadUrl(
  options: PresignedUploadUrlOptions
): Promise<string> {
  const client = getR2Client();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'online-editing-temp';
  const expiresIn = options.expiresInSeconds ?? APP_CONSTRAINTS.storage.signedUrlExpirySeconds;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: options.key,
    ContentType: options.contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function generatePresignedDownloadUrl(
  key: string,
  expiresInSeconds?: number
): Promise<string> {
  const client = getR2Client();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'online-editing-temp';
  const expiresIn = expiresInSeconds ?? APP_CONSTRAINTS.storage.signedUrlExpirySeconds;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

