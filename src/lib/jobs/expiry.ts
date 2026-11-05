export function isJobExpired(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return false;
  const expiryTime = new Date(expiresAt).getTime();
  return Date.now() > expiryTime;
}

export function formatTimeRemaining(expiresAt: Date | string | null | undefined): string {
  if (!expiresAt) return '';
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Expired';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `Expires in ${hours}h`;
  }
  return `Expires in ${minutes}m`;
}

