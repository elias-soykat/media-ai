'use client';

import React from 'react';
import {
  Scissors,
  FileDown,
  Maximize2,
  RefreshCw,
  Volume2,
  Sparkles,
  Loader2,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimestamp } from '@/lib/video/videoTrimmer';
import {
  SUPPORTED_VIDEO_PRESETS,
  estimateCompressedVideoSize,
} from '@/lib/video/videoTransforms';
import {
  calculateAudioExtractionUnits,
  AUDIO_CLEANING_PRESETS,
} from '@/lib/video/audioRemuxer';
import { formatFileSize } from '@/lib/photo/imageTransforms';

export interface VideoTool {
  id: 'trimmer' | 'compressor' | 'resizer' | 'converter' | 'noise-remover';
  label: string;
  description: string;
  isAi?: boolean;
}

export const VIDEO_TOOLS: VideoTool[] = [
  {
    id: 'trimmer',
    label: 'Video Trimmer',
    description: 'Cut video to exact start and end timestamps',
  },
  {
    id: 'compressor',
    label: 'Video Compressor',
    description: 'Reduce file size with resolution and quality presets',
  },
  {
    id: 'resizer',
    label: 'Video Resizer',
    description: 'Crop and adapt for 16:9, 9:16 Reels, and 1:1',
  },
  {
    id: 'converter',
    label: 'Format Converter',
    description: 'Convert between MP4, WebM, and MOV containers',
  },
  {
    id: 'noise-remover',
    label: 'AI Audio Noise Remover',
    description: 'Isolate speech and suppress background wind and hums',
    isAi: true,
  },
];

export interface VideoSidebarControlsProps {
  activeTool: string;
  onSelectTool: (id: string) => void;
  // Trimmer props
  duration: number;
  startTime: number;
  endTime: number;
  onChangeTrim: (start: number, end: number) => void;
  // Compressor props
  compressionQuality: 'low' | 'medium' | 'high';
  onChangeQuality: (quality: 'low' | 'medium' | 'high') => void;
  targetResolution: '1080p' | '720p' | '480p';
  onChangeResolution: (res: '1080p' | '720p' | '480p') => void;
  // Resizer props
  aspectRatio: string;
  onChangeAspectRatio: (ratio: string) => void;
  // Converter props
  targetFormat: 'mp4' | 'webm' | 'mov';
  onChangeFormat: (fmt: 'mp4' | 'webm' | 'mov') => void;
  // Noise Remover props
  noisePreset: 'balanced' | 'aggressive' | 'subtle';
  onChangeNoisePreset: (preset: 'balanced' | 'aggressive' | 'subtle') => void;
  onTriggerNoiseRemoval?: () => void;
  isAiLoading?: boolean;
  hasCleanedAudio?: boolean;
  isComparingAudio?: boolean;
  onToggleCompareAudio?: () => void;
  hasLoadedVideo?: boolean;
}

export function VideoSidebarControls({
  activeTool,
  onSelectTool,
  duration,
  startTime,
  endTime,
  onChangeTrim,
  compressionQuality,
  onChangeQuality,
  targetResolution,
  onChangeResolution,
  aspectRatio,
  onChangeAspectRatio,
  targetFormat,
  onChangeFormat,
  noisePreset,
  onChangeNoisePreset,
  onTriggerNoiseRemoval,
  isAiLoading = false,
  hasCleanedAudio = false,
  isComparingAudio = false,
  onToggleCompareAudio,
  hasLoadedVideo = false,
}: VideoSidebarControlsProps) {
  const trimmedDuration = Math.max(0, endTime - startTime);
  const effectiveDuration = trimmedDuration > 0 ? trimmedDuration : duration;

  // Estimated file size
  const estimatedBytes = estimateCompressedVideoSize(
    effectiveDuration,
    targetResolution,
    compressionQuality
  );
  const estimatedSizeStr = formatFileSize(estimatedBytes);

  // Audio unit billing calculation
  const { costCredits } = calculateAudioExtractionUnits(effectiveDuration);

  return (
    <div className="flex flex-col gap-6">
      {/* Tool Selector Grid */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Video Tools
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {VIDEO_TOOLS.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg text-left text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {tool.id === 'trimmer' && <Scissors className="w-4 h-4 shrink-0" />}
                  {tool.id === 'compressor' && <FileDown className="w-4 h-4 shrink-0" />}
                  {tool.id === 'resizer' && <Maximize2 className="w-4 h-4 shrink-0" />}
                  {tool.id === 'converter' && <RefreshCw className="w-4 h-4 shrink-0" />}
                  {tool.id === 'noise-remover' && <Volume2 className="w-4 h-4 shrink-0" />}
                  <span>{tool.label}</span>
                </div>
                {tool.isAi && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-primary/10 text-primary dark:bg-primary/20'
                    }`}
                  >
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Active Tool Configuration Panel */}
      <div className="space-y-4">
        {/* 1. Video Trimmer */}
        {activeTool === 'trimmer' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Trim Video Duration</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Drag timeline handles below or fine-tune exact timestamps.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Start Time</label>
                <input
                  type="text"
                  value={formatTimestamp(startTime)}
                  readOnly
                  className="w-full text-xs font-mono px-2.5 py-1.5 border border-border rounded-lg bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">End Time</label>
                <input
                  type="text"
                  value={formatTimestamp(endTime)}
                  readOnly
                  className="w-full text-xs font-mono px-2.5 py-1.5 border border-border rounded-lg bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border text-xs flex justify-between items-center">
              <span className="text-zinc-500">Clip Duration:</span>
              <span className="font-mono font-bold text-primary">
                {trimmedDuration.toFixed(1)}s
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => onChangeTrim(0, duration)}
            >
              Reset to Full Duration
            </Button>
          </div>
        )}

        {/* 2. Video Compressor */}
        {activeTool === 'compressor' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Compression Settings</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Balance target video bitrate with visual clarity.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Quality Profile</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => onChangeQuality(q)}
                    className={`py-1.5 rounded-lg border text-xs font-medium capitalize text-center transition-all ${
                      compressionQuality === q
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Resolution Target</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['1080p', '720p', '480p'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => onChangeResolution(res)}
                    className={`py-1.5 rounded-lg border text-xs font-medium text-center transition-all ${
                      targetResolution === res
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border flex justify-between items-center text-xs">
              <span className="text-zinc-500">Estimated Output Size:</span>
              <span className="font-mono font-bold text-primary">{estimatedSizeStr}</span>
            </div>
          </div>
        )}

        {/* 3. Video Resizer */}
        {activeTool === 'resizer' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Aspect Ratio & Framing</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Crop or scale for target social platform standards.
              </p>
            </div>

            <div className="space-y-2">
              {Object.values(SUPPORTED_VIDEO_PRESETS).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onChangeAspectRatio(preset.id)}
                  className={`w-full p-2.5 rounded-lg border text-left text-xs flex flex-col gap-0.5 transition-all ${
                    aspectRatio === preset.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-zinc-50 dark:hover:bg-zinc-900 text-foreground'
                  }`}
                >
                  <span className="font-bold">{preset.label}</span>
                  <span className="text-[11px] text-zinc-500">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. Format Converter */}
        {activeTool === 'converter' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Output Container</h3>
              <p className="text-xs text-zinc-500 mt-1">Export video in target web container format.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['mp4', 'webm', 'mov'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => onChangeFormat(fmt)}
                  className={`p-2.5 rounded-lg border text-xs font-bold uppercase transition-all ${
                    targetFormat === fmt
                      ? 'border-primary bg-primary text-white'
                      : 'border-border hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. AI Audio Noise Remover */}
        {activeTool === 'noise-remover' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">AI Speech Isolation</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Filter ambient noise, wind, and hums with bandwidth-optimized audio extraction.
              </p>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border text-xs space-y-2">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Free Trial Included</span>
              </div>
              <p className="text-zinc-500">
                1 free run per account. Future runs use 1 credit ($0.05) per 30 seconds.
              </p>
              <div className="pt-1 flex justify-between font-mono font-semibold">
                <span>Cost for this clip:</span>
                <span className="text-primary">{costCredits} credit(s)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Filter Intensity</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['subtle', 'balanced', 'aggressive'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => onChangeNoisePreset(p)}
                    className={`py-1.5 rounded-lg border text-xs font-medium capitalize text-center transition-all ${
                      noisePreset === p
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border hover:bg-zinc-50 dark:hover:bg-zinc-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={!hasLoadedVideo || isAiLoading}
              onClick={onTriggerNoiseRemoval}
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cleaning Audio...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Clean Audio with AI
                </>
              )}
            </Button>

            {hasCleanedAudio && (
              <Button
                variant={isComparingAudio ? 'primary' : 'outline'}
                className="w-full text-xs"
                onClick={onToggleCompareAudio}
              >
                <Radio className="w-3.5 h-3.5 mr-2" />
                {isComparingAudio ? 'Listening to Cleaned Audio' : 'Switch to Original Audio'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
