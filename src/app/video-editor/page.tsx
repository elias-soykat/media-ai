'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { VideoPreview } from '@/components/preview/VideoPreview';
import { VideoTimeline } from '@/components/video/VideoTimeline';
import { MediaDropzone } from '@/components/upload/MediaDropzone';
import { VideoSidebarControls, VIDEO_TOOLS } from '@/components/video/VideoSidebarControls';
import { extractAudioFromVideo } from '@/lib/audio/browserAudioExtractor';
import { validateTrimRange } from '@/lib/video/videoTrimmer';
import { createRemuxedStream } from '@/lib/video/audioRemuxer';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, Loader2 } from 'lucide-react';

export default function VideoEditorPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('video.mp4');
  const [activeTool, setActiveTool] = useState<string>('trimmer');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Playback & Timing state
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Settings state
  const [compressionQuality, setCompressionQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetResolution, setTargetResolution] = useState<'1080p' | '720p' | '480p'>('1080p');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [targetFormat, setTargetFormat] = useState<'mp4' | 'webm' | 'mov'>('mp4');
  const [noisePreset, setNoisePreset] = useState<'balanced' | 'aggressive' | 'subtle'>('balanced');
  const [cleanedAudioUrl, setCleanedAudioUrl] = useState<string | null>(null);
  const [isComparingAudio, setIsComparingAudio] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalFileRef = useRef<File | null>(null);
  const previousUrlRef = useRef<string | null>(null);

  // Clean up object URLs on replacement or unmount to prevent browser heap memory leaks
  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, []);

  const handleFileSelect = (file: File) => {
    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current);
    }

    originalFileRef.current = file;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    previousUrlRef.current = url;
    setVideoUrl(url);
    setCleanedAudioUrl(null);
    setCurrentTime(0);
    setStartTime(0);
  };

  const handleDurationChange = (d: number) => {
    setDuration(d);
    setEndTime(d);
  };

  const handleTimeUpdate = (t: number) => {
    setCurrentTime(t);

    // Keep cleaned audio element synchronized with video playback
    if (audioRef.current && Math.abs(audioRef.current.currentTime - t) > 0.15) {
      audioRef.current.currentTime = t;
    }

    // Auto-loop or clamp playback within trim boundaries
    if (endTime > 0 && t >= endTime && isPlaying) {
      if (videoRef.current) {
        videoRef.current.currentTime = startTime;
        setCurrentTime(startTime);
        if (audioRef.current) audioRef.current.currentTime = startTime;
      }
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (currentTime < startTime || currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
        if (audioRef.current) audioRef.current.currentTime = startTime;
        setCurrentTime(startTime);
      }
      videoRef.current.play();
      if (cleanedAudioUrl && isComparingAudio) {
        audioRef.current?.play();
      }
      setIsPlaying(true);
    }
  };

  // Synchronize audio routing between original video and AI-cleaned audio track
  useEffect(() => {
    if (!videoRef.current) return;

    if (cleanedAudioUrl && isComparingAudio) {
      // Mute original video track, play cleaned audio track
      videoRef.current.muted = true;
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.currentTime = videoRef.current.currentTime;
        if (isPlaying) audioRef.current.play();
      }
    } else {
      // Listen to original video audio track
      videoRef.current.muted = false;
      if (audioRef.current) {
        audioRef.current.muted = true;
        audioRef.current.pause();
      }
    }
  }, [isComparingAudio, cleanedAudioUrl, isPlaying]);

  // AI Audio Noise Removal execution
  const handleTriggerNoiseRemoval = async () => {
    if (!originalFileRef.current) return;
    setIsAiLoading(true);
    try {
      // 1. Extract lightweight mono WAV audio client-side using Web Audio API
      const audioBlob = await extractAudioFromVideo(originalFileRef.current);

      // Convert audio blob to data URL
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      const audioDataUrl = await base64Promise;

      const trimDuration = endTime > startTime ? endTime - startTime : duration;

      // 2. Call backend noise removal endpoint
      const res = await fetch('/api/audio/remove-noise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: audioDataUrl,
          userId: 'demo_user',
          durationSeconds: trimDuration || 30,
          preset: noisePreset,
        }),
      });

      const data = await res.json();
      if (res.ok && data.outputAudioUrl) {
        setCleanedAudioUrl(data.outputAudioUrl);
        setIsComparingAudio(true);
      } else {
        alert(data.error || 'Failed to remove audio noise');
      }
    } catch (err: any) {
      alert(err.message || 'Error extracting and processing audio');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleReset = () => {
    setStartTime(0);
    setEndTime(duration);
    setCompressionQuality('medium');
    setTargetResolution('1080p');
    setAspectRatio('16:9');
    setTargetFormat('mp4');
    setCleanedAudioUrl(null);
    setIsComparingAudio(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
    }
  };

  // Export video with trimmed range and remuxed audio
  const handleDownload = async () => {
    if (!videoUrl || !videoRef.current) return;

    // Validate trim range before export
    if (endTime > 0) {
      const validation = validateTrimRange(startTime, endTime, duration);
      if (!validation.isValid) {
        alert(validation.error || 'Invalid trim range');
        return;
      }
    }

    setIsExporting(true);

    try {
      // Check if MediaRecorder is available for browser-side export remuxing
      if (typeof window !== 'undefined' && 'MediaRecorder' in window && videoRef.current) {
        const stream = createRemuxedStream(
          videoRef.current,
          audioRef.current || (videoRef.current as any)
        );

        const mimeType = targetFormat === 'webm' ? 'video/webm' : 'video/mp4;codecs=avc1';
        const recorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const exportBlob = new Blob(chunks, { type: recorder.mimeType });
          const exportUrl = URL.createObjectURL(exportBlob);
          const a = document.createElement('a');
          a.href = exportUrl;
          const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
          a.download = `${nameWithoutExt}_edited.${targetFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(exportUrl);
          setIsExporting(false);
        };

        // Record trimmed segment
        videoRef.current.currentTime = startTime;
        recorder.start();
        await videoRef.current.play();

        const recordDurationMs = Math.max(500, (endTime - startTime) * 1000);
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
            videoRef.current?.pause();
          }
        }, recordDurationMs);
        return;
      }
    } catch {
      // Graceful fallback to direct download if MediaRecorder is blocked
    }

    // Direct download fallback
    const a = document.createElement('a');
    a.href = videoUrl;
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    a.download = `${nameWithoutExt}_edited.${targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsExporting(false);
  };

  return (
    <WorkspaceShell
      title="Video Editor Studio"
      leftSidebar={
        <VideoSidebarControls
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          duration={duration}
          startTime={startTime}
          endTime={endTime}
          onChangeTrim={(start, end) => {
            setStartTime(start);
            setEndTime(end);
          }}
          compressionQuality={compressionQuality}
          onChangeQuality={setCompressionQuality}
          targetResolution={targetResolution}
          onChangeResolution={setTargetResolution}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={setAspectRatio}
          targetFormat={targetFormat}
          onChangeFormat={setTargetFormat}
          noisePreset={noisePreset}
          onChangeNoisePreset={setNoisePreset}
          onTriggerNoiseRemoval={handleTriggerNoiseRemoval}
          isAiLoading={isAiLoading}
          hasCleanedAudio={Boolean(cleanedAudioUrl)}
          isComparingAudio={isComparingAudio}
          onToggleCompareAudio={() => setIsComparingAudio(!isComparingAudio)}
          hasLoadedVideo={Boolean(videoUrl)}
        />
      }
      previewArea={
        videoUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <VideoPreview
              ref={videoRef}
              videoUrl={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              showControls={false}
            />

            {/* Hidden audio element for synchronized cleaned audio playback */}
            {cleanedAudioUrl && (
              <audio
                ref={audioRef}
                src={cleanedAudioUrl}
                crossOrigin="anonymous"
                className="hidden"
              />
            )}
          </div>
        ) : (
          <div className="w-full max-w-lg p-6">
            <MediaDropzone
              mediaType="video"
              onFileAccepted={handleFileSelect}
            />
          </div>
        )
      }
      timeline={
        videoUrl && duration > 0 ? (
          <VideoTimeline
            duration={duration}
            currentTime={currentTime}
            startTime={startTime}
            endTime={endTime}
            onTrimChange={(start, end) => {
              setStartTime(start);
              setEndTime(end);
            }}
            onSeek={handleSeek}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
          />
        ) : undefined
      }
      rightSidebar={
        videoUrl ? (
          <div className="flex flex-col h-full justify-between gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Export Settings</h3>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">File Name:</span>
                  <span className="font-mono truncate max-w-[120px]">{fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Target Container:</span>
                  <span className="font-mono uppercase font-bold text-primary">
                    {targetFormat}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Resolution:</span>
                  <span className="font-mono font-medium">{targetResolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Aspect Ratio:</span>
                  <span className="font-mono font-medium">{aspectRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Active Tool:</span>
                  <span className="font-medium capitalize">
                    {VIDEO_TOOLS.find((t) => t.id === activeTool)?.label || activeTool}
                  </span>
                </div>
                {cleanedAudioUrl && (
                  <div className="flex justify-between text-primary font-medium">
                    <span>Audio Track:</span>
                    <span>{isComparingAudio ? 'AI Cleaned' : 'Original'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                size="lg"
                disabled={isExporting}
                onClick={handleDownload}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting Video...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export & Download
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All Edits
              </Button>
            </div>
          </div>
        ) : undefined
      }
    />
  );
}
