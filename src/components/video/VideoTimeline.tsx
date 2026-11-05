'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimestamp } from '@/lib/video/videoTrimmer';

export function calculateHandlePositions(
  startTime: number,
  endTime: number,
  duration: number
): { startPct: number; endPct: number } {
  if (duration <= 0) {
    return { startPct: 0, endPct: 100 };
  }
  const startPct = Math.max(0, Math.min(100, (startTime / duration) * 100));
  const endPct = Math.max(0, Math.min(100, (endTime / duration) * 100));
  return { startPct, endPct };
}

export interface VideoTimelineProps {
  duration: number;
  currentTime: number;
  startTime: number;
  endTime: number;
  onTrimChange: (start: number, end: number) => void;
  onSeek: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function VideoTimeline({
  duration,
  currentTime,
  startTime,
  endTime,
  onTrimChange,
  onSeek,
  isPlaying,
  onTogglePlay,
}: VideoTimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<'start' | 'end' | 'playhead' | null>(null);

  const { startPct, endPct } = calculateHandlePositions(startTime, endTime, duration);
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const trimmedDuration = Math.max(0, endTime - startTime);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * duration);
  };

  const handleStartHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = Number(e.target.value);
    if (newStart < endTime - 0.5) {
      onTrimChange(newStart, endTime);
    }
  };

  const handleEndHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = Number(e.target.value);
    if (newEnd > startTime + 0.5) {
      onTrimChange(startTime, newEnd);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Controls Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={onTogglePlay}
            className="h-8 w-8 p-0 rounded-full"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </Button>

          <span className="font-mono text-xs font-semibold">
            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-zinc-500">
          <Scissors className="w-3.5 h-3.5 text-primary" />
          <span>
            Trim Range: <strong className="text-foreground">{formatTimestamp(startTime)}</strong> -{' '}
            <strong className="text-foreground">{formatTimestamp(endTime)}</strong>{' '}
            <span className="text-primary font-mono">({trimmedDuration.toFixed(1)}s)</span>
          </span>
        </div>
      </div>

      {/* Main Timeline Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden cursor-pointer border border-border"
      >
        {/* Filmstrip hash background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]" />

        {/* Shaded unselected left segment */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-black/40 z-10 pointer-events-none"
          style={{ width: `${startPct}%` }}
        />

        {/* Active trimmed window */}
        <div
          className="absolute top-0 bottom-0 bg-primary/20 border-y-2 border-primary z-10 pointer-events-none"
          style={{
            left: `${startPct}%`,
            width: `${Math.max(0, endPct - startPct)}%`,
          }}
        />

        {/* Shaded unselected right segment */}
        <div
          className="absolute top-0 bottom-0 right-0 bg-black/40 z-10 pointer-events-none"
          style={{ width: `${Math.max(0, 100 - endPct)}%` }}
        />

        {/* Playhead Vertical Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
          style={{ left: `${Math.max(0, Math.min(100, playheadPct))}%` }}
        >
          <div className="w-2.5 h-2.5 -ml-1 bg-red-500 rounded-full shadow" />
        </div>

        {/* Draggable Trim Handles */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={startTime}
          onChange={handleStartHandleChange}
          className="absolute inset-0 opacity-0 cursor-ew-resize z-20 pointer-events-auto"
          title="Adjust trim start point"
        />

        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={endTime}
          onChange={handleEndHandleChange}
          className="absolute inset-0 opacity-0 cursor-ew-resize z-20 pointer-events-auto"
          title="Adjust trim end point"
        />
      </div>
    </div>
  );
}
