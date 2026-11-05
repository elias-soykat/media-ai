'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, AlertCircle, FileCheck } from 'lucide-react';
import { useMediaValidator } from '@/hooks/useMediaValidator';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface MediaDropzoneProps {
  mediaType: 'photo' | 'video' | 'audio';
  onFileAccepted: (file: File) => void;
  title?: string;
  description?: string;
}

export function MediaDropzone({
  mediaType,
  onFileAccepted,
  title = 'Upload Media',
  description,
}: MediaDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { validate, inspectVideoMetadata, constraints } = useMediaValidator(mediaType);

  const maxMb =
    mediaType === 'photo'
      ? Math.round(constraints.photo.maxFileSizeBytes / (1024 * 1024))
      : mediaType === 'video'
      ? Math.round(constraints.video.maxFileSizeBytes / (1024 * 1024))
      : Math.round(constraints.audio.maxFileSizeBytes / (1024 * 1024));

  const acceptMimes =
    mediaType === 'photo'
      ? constraints.photo.supportedMimeTypes.join(',')
      : mediaType === 'video'
      ? constraints.video.supportedMimeTypes.join(',')
      : constraints.audio.supportedMimeTypes.join(',');

  const processFile = async (file: File) => {
    setErrorMessage(null);
    const localValidation = validate(file);
    if (!localValidation.isValid) {
      setErrorMessage(localValidation.error);
      return;
    }

    if (mediaType === 'video') {
      try {
        const meta = await inspectVideoMetadata(file);
        if (meta.duration > constraints.video.maxDurationSeconds) {
          setErrorMessage(
            `Video duration (${Math.round(meta.duration)}s) exceeds max limit of ${constraints.video.maxDurationSeconds}s.`
          );
          return;
        }

        if (
          meta.width > constraints.video.maxResolution.width ||
          meta.height > constraints.video.maxResolution.height
        ) {
          setErrorMessage(
            `Video resolution (${meta.width}x${meta.height}) exceeds max limit of ${constraints.video.maxResolution.width}x${constraints.video.maxResolution.height} (1080p).`
          );
          return;
        }
      } catch (err) {
        setErrorMessage('Invalid or corrupt video file. Unable to decode video.');
        return;
      }
    }

    setSelectedFile(file);
    onFileAccepted(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptMimes}
          onChange={handleInputChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <FileCheck className="w-12 h-12 text-green-600 mb-2" />
            <p className="font-semibold text-foreground text-sm">{selectedFile.name}</p>
            <p className="text-xs text-zinc-500">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
            </p>
            <Button size="sm" variant="outline" className="mt-2">
              Choose Another File
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <UploadCloud className="w-12 h-12 text-zinc-400 mb-2" />
            <h3 className="font-semibold text-foreground text-base">{title}</h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              {description || `Drag and drop your ${mediaType} file here, or click to browse.`}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Max {maxMb}MB • Up to {mediaType === 'video' ? '3 mins' : '8192px'}
            </p>
          </div>
        )}
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="max-w-2xl mt-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </Alert>
      )}
    </div>
  );
}

