'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { CanvasPreview } from '@/components/preview/CanvasPreview';
import { MediaDropzone } from '@/components/upload/MediaDropzone';
import { PhotoSidebarControls, PHOTO_TOOLS } from '@/components/photo/PhotoSidebarControls';
import { applyEnhancements, EnhancementParams, ENHANCEMENT_PRESETS } from '@/lib/photo/imageEnhancer';
import {
  calculateTargetDimensions,
  calculateCropRect,
  formatToMimeType,
} from '@/lib/photo/imageTransforms';
import {
  BACKGROUND_PRESETS,
  renderCompositedCanvas,
} from '@/lib/photo/backgroundCompositor';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw } from 'lucide-react';

export default function PhotoEditorPage() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [cutoutImage, setCutoutImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('photo.png');
  const [activeTool, setActiveTool] = useState<string>('enhancer');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 1920, height: 1080 });

  // Tool states
  const [enhancements, setEnhancements] = useState<EnhancementParams>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    sharpness: 0,
  });
  const [aspectRatio, setAspectRatio] = useState<string>('original');
  const [resizeOptions, setResizeOptions] = useState({
    width: 0,
    height: 0,
    percentage: 100,
    maintainAspectRatio: true,
  });
  const [compressionQuality, setCompressionQuality] = useState<number>(85);
  const [targetFormat, setTargetFormat] = useState<'jpg' | 'png' | 'webp'>('png');
  const [bgOptions, setBgOptions] = useState<{
    type: 'color' | 'gradient' | 'image' | 'transparent';
    color: string;
    gradientId: string;
    bgImageUrl?: string;
  }>({
    type: 'transparent',
    color: '#FFFFFF',
    gradientId: 'studio-grey',
  });

  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Pre-load custom background image when bgImageUrl changes
  useEffect(() => {
    if (bgOptions.bgImageUrl) {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.onload = () => {
        bgImgRef.current = bgImg;
        renderPipeline();
      };
      bgImg.src = bgOptions.bgImageUrl;
    } else {
      bgImgRef.current = null;
    }
  }, [bgOptions.bgImageUrl]);

  // Handle uploaded image
  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOriginalImage(dataUrl);
      setCutoutImage(null);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        sourceImgRef.current = img;
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setResizeOptions((prev) => ({
          ...prev,
          width: img.naturalWidth,
          height: img.naturalHeight,
          percentage: 100,
        }));
        renderPipeline(img, dataUrl, null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Pipeline execution
  const executePipeline = useCallback(
    (
      sourceImg: HTMLImageElement | null = sourceImgRef.current,
      sourceUrl: string | null = originalImage,
      cutoutUrl: string | null = cutoutImage
    ) => {
      if (!sourceImg || !sourceUrl) return;

      const workingImg = new Image();
      workingImg.crossOrigin = 'anonymous';
      workingImg.onload = () => {
        const sw = workingImg.naturalWidth;
        const sh = workingImg.naturalHeight;

        // 1. Calculate Crop
        const cropRect =
          aspectRatio === 'original'
            ? { x: 0, y: 0, width: sw, height: sh }
            : calculateCropRect(sw, sh, aspectRatio);

        // 2. Calculate Dimensions
        const targetDims = calculateTargetDimensions(cropRect.width, cropRect.height, {
          width: resizeOptions.width || cropRect.width,
          height: resizeOptions.height || cropRect.height,
          maintainAspectRatio: resizeOptions.maintainAspectRatio,
        });

        // 3. Render base crop/scaled canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetDims.width;
        canvas.height = targetDims.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
          workingImg,
          cropRect.x,
          cropRect.y,
          cropRect.width,
          cropRect.height,
          0,
          0,
          targetDims.width,
          targetDims.height
        );

        // 4. Apply Enhancements if any non-zero
        const hasEnhancements = Object.values(enhancements).some((v) => (v ?? 0) !== 0);
        if (hasEnhancements) {
          const imgData = ctx.getImageData(0, 0, targetDims.width, targetDims.height);
          const enhanced = applyEnhancements(imgData, enhancements);
          ctx.putImageData(enhanced, 0, 0);
        }

        // 5. Apply Background Compositor if bg-changer active and cutout or transparent
        if (cutoutUrl && bgOptions.type !== 'transparent') {
          const selectedGrad = BACKGROUND_PRESETS.gradients.find(
            (g) => g.id === bgOptions.gradientId
          );
          const composited = renderCompositedCanvas({
            foregroundImage: canvas,
            targetWidth: canvas.width,
            targetHeight: canvas.height,
            bgType: bgOptions.type,
            bgColor: bgOptions.color,
            bgGradient: selectedGrad,
            bgImage: bgImgRef.current || undefined,
          });
          const mime = formatToMimeType(targetFormat);
          const outputDataUrl = composited.toDataURL(mime, compressionQuality / 100);
          setProcessedImage(outputDataUrl);
          return;
        }

        const mime = formatToMimeType(targetFormat);
        const outputDataUrl = canvas.toDataURL(mime, compressionQuality / 100);
        setProcessedImage(outputDataUrl);
      };

      workingImg.src = cutoutUrl || sourceUrl;
    },
    [
      originalImage,
      cutoutImage,
      aspectRatio,
      resizeOptions,
      enhancements,
      bgOptions,
      targetFormat,
      compressionQuality,
    ]
  );

  // Debounce pipeline calls using requestAnimationFrame to prevent UI thread starvation
  const renderPipeline = useCallback(
    (
      sourceImg: HTMLImageElement | null = sourceImgRef.current,
      sourceUrl: string | null = originalImage,
      cutoutUrl: string | null = cutoutImage
    ) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        executePipeline(sourceImg, sourceUrl, cutoutUrl);
      });
    },
    [executePipeline, originalImage, cutoutImage]
  );

  useEffect(() => {
    if (originalImage && sourceImgRef.current) {
      renderPipeline();
    }
  }, [renderPipeline, originalImage]);

  // AI Background Remover trigger
  const handleTriggerAiRemoveBg = async () => {
    if (!originalImage) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/photo/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: originalImage,
          userId: 'demo_user',
        }),
      });
      const data = await res.json();
      if (res.ok && data.outputUrl) {
        setCutoutImage(data.outputUrl);
        setActiveTool('bg-changer');
      } else {
        alert(data.error || 'Failed to remove background');
      }
    } catch {
      alert('Network error removing background');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Preset applicator
  const handleApplyPreset = (key: keyof typeof ENHANCEMENT_PRESETS) => {
    const preset = ENHANCEMENT_PRESETS[key];
    if (preset) {
      setEnhancements({ ...preset });
    }
  };

  // Reset tool
  const handleReset = () => {
    setEnhancements({ brightness: 0, contrast: 0, saturation: 0, exposure: 0, sharpness: 0 });
    setAspectRatio('original');
    if (sourceImgRef.current) {
      setResizeOptions({
        width: sourceImgRef.current.naturalWidth,
        height: sourceImgRef.current.naturalHeight,
        percentage: 100,
        maintainAspectRatio: true,
      });
    }
    setCompressionQuality(85);
    setTargetFormat('png');
    setBgOptions({ type: 'transparent', color: '#FFFFFF', gradientId: 'studio-grey' });
    setCutoutImage(null);
  };

  // Download handler
  const handleDownload = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    a.download = `${nameWithoutExt}_edited.${targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <WorkspaceShell
      title="Photo Editor Studio"
      leftSidebar={
        <PhotoSidebarControls
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          enhancementValues={enhancements}
          onChangeEnhancement={(vals) => setEnhancements((p) => ({ ...p, ...vals }))}
          onApplyPreset={handleApplyPreset}
          aspectRatio={aspectRatio}
          onChangeAspectRatio={setAspectRatio}
          resizeOptions={resizeOptions}
          originalDimensions={originalDimensions}
          onChangeResize={(opts) => setResizeOptions((p) => ({ ...p, ...opts }))}
          compressionQuality={compressionQuality}
          onChangeQuality={setCompressionQuality}
          targetFormat={targetFormat}
          onChangeFormat={setTargetFormat}
          bgOptions={bgOptions}
          onChangeBgOptions={(opts) => setBgOptions((p) => ({ ...p, ...opts }))}
          onTriggerAiRemoveBg={handleTriggerAiRemoveBg}
          isAiLoading={isAiLoading}
          hasLoadedImage={Boolean(originalImage)}
        />
      }
      previewArea={
        originalImage ? (
          <CanvasPreview
            originalImage={originalImage}
            processedImage={processedImage || originalImage}
            alt="Photo Preview"
          />
        ) : (
          <div className="w-full max-w-lg p-6">
            <MediaDropzone
              mediaType="photo"
              onFileAccepted={handleFileSelect}
            />
          </div>
        )
      }
      rightSidebar={
        originalImage ? (
          <div className="flex flex-col h-full justify-between gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Export Settings</h3>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">File Name:</span>
                  <span className="font-mono truncate max-w-[120px]">{fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Output Format:</span>
                  <span className="font-mono uppercase font-bold text-primary">
                    {targetFormat}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Active Tool:</span>
                  <span className="font-medium capitalize">
                    {PHOTO_TOOLS.find((t) => t.id === activeTool)?.label || activeTool}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full" size="lg" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download Image
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
