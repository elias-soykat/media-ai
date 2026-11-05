import { S3Client } from '@aws-sdk/client-s3';

let r2ClientInstance: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!r2ClientInstance) {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || 'dummy_account_id';
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || 'dummy_access_key';
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || 'dummy_secret_key';

    r2ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2ClientInstance;
}
