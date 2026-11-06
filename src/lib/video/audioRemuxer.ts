/**
 * Hybrid Bandwidth-Optimized Audio Extractor & Remuxing Engine
 * Manages unit billing calculation, speech cleaning presets, and browser stream remuxing.
 */

import { APP_CONSTRAINTS } from '@/config/constraints';

export interface NoiseRemovalPreset {
  id: 'balanced' | 'aggressive' | 'subtle';
  label: string;
  description: string;
  intensity: number;
}

export const AUDIO_CLEANING_PRESETS: Record<string, NoiseRemovalPreset> = {
  balanced: {
    id: 'balanced',
    label: 'Balanced Speech',
    description: 'Removes background hum and air conditioner noise while keeping voice natural.',
    intensity: 0.7,
  },
  aggressive: {
    id: 'aggressive',
    label: 'Aggressive Filter',
    description: 'Deep reduction for wind, heavy traffic, and loud background chatter.',
    intensity: 0.95,
  },
  subtle: {
    id: 'subtle',
    label: 'Subtle Studio Polish',
    description: 'Gentle noise floor suppression for podcast and interview microphones.',
    intensity: 0.4,
  },
};

export interface AudioUnitsResult {
  units: number;
  costCredits: number;
}

/**
 * Calculates 30-second billing units and credit costs for audio noise removal.
 * Cost formula: 1 credit per 30 seconds (rounded up to nearest 30s block).
 */
export function calculateAudioExtractionUnits(durationSeconds: number): AudioUnitsResult {
  if (isNaN(durationSeconds) || durationSeconds <= 0) {
    return { units: 0, costCredits: 0 };
  }

  const units = Math.ceil(durationSeconds / 30);
  const costPerUnit = APP_CONSTRAINTS.billing.costs.audioNoiseRemovalPer30s;
  const costCredits = units * costPerUnit;

  return {
    units,
    costCredits,
  };
}

/**
 * Creates a browser-native MediaStream combining the visual video track from videoEl
 * with the cleaned audio track from audioEl without server-side re-encoding.
 */
export function createRemuxedStream(
  videoEl: HTMLVideoElement,
  audioEl: HTMLAudioElement
): MediaStream {
  if (typeof window === 'undefined') {
    throw new Error('createRemuxedStream requires a browser DOM environment');
  }

  // Acquire video stream from video element
  const videoStream: MediaStream =
    (videoEl as any).captureStream?.() ||
    (videoEl as any).mozCaptureStream?.() ||
    new MediaStream();

  // Acquire audio stream from cleaned audio element via Web Audio API
  let audioTracks: MediaStreamTrack[] = [];
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaElementSource(audioEl);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      audioTracks = dest.stream.getAudioTracks();
    }
  } catch {
    // If Web Audio API capture is unavailable, check captureStream on audioEl
    if ((audioEl as any).captureStream) {
      audioTracks = (audioEl as any).captureStream().getAudioTracks();
    }
  }

  const outputStream = new MediaStream();

  // Add video track
  videoStream.getVideoTracks().forEach((vt) => outputStream.addTrack(vt));

  // Add cleaned audio track
  if (audioTracks.length > 0) {
    audioTracks.forEach((at) => outputStream.addTrack(at));
  } else {
    // Fallback: use video stream's existing audio if audio element track failed
    videoStream.getAudioTracks().forEach((at) => outputStream.addTrack(at));
  }

  return outputStream;
}

