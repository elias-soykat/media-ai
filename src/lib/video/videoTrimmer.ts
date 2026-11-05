/**
 * Video Trimmer Engine
 * Provides client-side timestamp parsing, formatting, duration, and range validation.
 */

export interface TrimRangeValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Formats a given number of seconds into "MM:SS" or "HH:MM:SS".
 */
export function formatTimestamp(seconds: number, includeHours: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';

  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (includeHours || hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Parses timestamp strings like "MM:SS", "HH:MM:SS", or "SS.ms" into float seconds.
 */
export function parseTimestamp(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const clean = timeStr.trim();

  // If simple numeric string
  if (/^\d+(\.\d+)?$/.test(clean)) {
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
  }

  const parts = clean.split(':').map((p) => parseFloat(p));
  if (parts.some((p) => isNaN(p))) return 0;

  if (parts.length === 2) {
    // MM:SS
    const [mins, secs] = parts;
    return mins * 60 + secs;
  } else if (parts.length === 3) {
    // HH:MM:SS
    const [hrs, mins, secs] = parts;
    return hrs * 3600 + mins * 60 + secs;
  }

  return 0;
}

/**
 * Validates whether a selected trim range [startTime, endTime] is within bounds and satisfies minimum duration.
 */
export function validateTrimRange(
  startTime: number,
  endTime: number,
  duration: number,
  minDuration: number = 0.5
): TrimRangeValidation {
  if (isNaN(startTime) || isNaN(endTime) || isNaN(duration)) {
    return { isValid: false, error: 'Invalid time values provided' };
  }

  if (startTime < 0) {
    return { isValid: false, error: 'Start time cannot be negative' };
  }

  if (endTime > duration) {
    return { isValid: false, error: 'End time cannot exceed total video duration' };
  }

  if (startTime >= endTime) {
    return { isValid: false, error: 'Start time must be less than end time' };
  }

  const trimDuration = endTime - startTime;
  if (trimDuration < minDuration) {
    return {
      isValid: false,
      error: `Trimmed clip must be at least ${minDuration} seconds (selected: ${trimDuration.toFixed(1)}s)`,
    };
  }

  return { isValid: true };
}

/**
 * Calculates exact trimmed duration.
 */
export function calculateTrimmedDuration(startTime: number, endTime: number): number {
  return Math.max(0, endTime - startTime);
}

