'use client';

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface VideoPreviewProps {
  videoUrl: string | null;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  showControls?: boolean;
}

export const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(
  ({ videoUrl, onTimeUpdate, onDurationChange, showControls = true }, forwardedRef) => {
    const internalRef = useRef<HTMLVideoElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLVideoElement>) || internalRef;

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const togglePlay = () => {
      const el = ref.current;
      if (!el) return;
      if (el.paused) {
        el.play();
        setIsPlaying(true);
      } else {
        el.pause();
        setIsPlaying(false);
      }
    };

    const toggleMute = () => {
      const el = ref.current;
      if (!el) return;
      el.muted = !isMuted;
      setIsMuted(!isMuted);
    };

    const handleTimeUpdate = () => {
      const el = ref.current;
      if (!el) return;
      const t = el.currentTime;
      setCurrentTime(t);
      onTimeUpdate?.(t);
    };

    const handleLoadedMetadata = () => {
      const el = ref.current;
      if (!el) return;
      const d = el.duration;
      setDuration(d);
      onDurationChange?.(d);
    };

    const handleSeek = (time: number) => {
      const el = ref.current;
      if (!el) return;
      el.currentTime = time;
      setCurrentTime(time);
    };

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
        {videoUrl ? (
          <div className="relative max-w-full max-h-full flex flex-col items-center">
            <video
              ref={ref}
              src={videoUrl}
              crossOrigin="anonymous"
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className="max-h-[70vh] max-w-[80vw] object-contain rounded-xl shadow-md bg-black"
            />

            {/* Optional Player Controls Bar */}
            {showControls && (
              <div className="w-full max-w-xl mt-4 bg-background border border-border rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <Button size="sm" variant="ghost" onClick={togglePlay}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <span className="text-xs font-mono text-zinc-500 min-w-[5rem]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Scrubber */}
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.01"
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="flex-1 accent-primary h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
                />

                <Button size="sm" variant="ghost" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-zinc-400 text-sm">No video loaded</div>
        )}
      </div>
    );
  }
);

VideoPreview.displayName = 'VideoPreview';
