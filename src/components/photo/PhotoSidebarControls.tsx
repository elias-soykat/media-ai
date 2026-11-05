'use client';

import React, { useRef } from 'react';
import {
  Wand2,
  Crop,
  Maximize2,
  Sliders,
  Palette,
  FileDown,
  RefreshCw,
  Sparkles,
  Loader2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancementParams, ENHANCEMENT_PRESETS } from '@/lib/photo/imageEnhancer';
import { BACKGROUND_PRESETS } from '@/lib/photo/backgroundCompositor';
import { estimateCompressedSize, formatFileSize } from '@/lib/photo/imageTransforms';

export interface PhotoTool {
  id: 'bg-remover' | 'bg-changer' | 'enhancer' | 'cropper' | 'resizer' | 'compressor' | 'converter';
  label: string;
  description: string;
  isAi?: boolean;
}

export const PHOTO_TOOLS: PhotoTool[] = [
  {
    id: 'bg-remover',
    label: 'AI Background Remover',
    description: 'Instant cutout with AI',
    isAi: true,
  },
  {
    id: 'bg-changer',
    label: 'Background Changer',
    description: 'Replace background with colors, gradients, or custom image',
  },
  {
    id: 'enhancer',
    label: 'Image Enhancer',
    description: 'Tune brightness, contrast, saturation & sharpness',
  },
  {
    id: 'cropper',
    label: 'Image Cropper',
    description: 'Crop to standard aspect ratios',
  },
  {
    id: 'resizer',
    label: 'Image Resizer',
    description: 'Scale dimensions by pixels or percentage',
  },
  {
    id: 'compressor',
    label: 'Image Compressor',
    description: 'Reduce file size with visual quality control',
  },
  {
    id: 'converter',
    label: 'Format Converter',
    description: 'Convert between WebP, PNG, and JPEG',
  },
];

export interface PhotoSidebarControlsProps {
  activeTool: string;
  onSelectTool: (id: string) => void;
  // Enhancer props
  enhancementValues: EnhancementParams;
  onChangeEnhancement: (values: Partial<EnhancementParams>) => void;
  onApplyPreset: (presetKey: keyof typeof ENHANCEMENT_PRESETS) => void;
  // Cropper props
  aspectRatio: string;
  onChangeAspectRatio: (ratio: string) => void;
  // Resizer props
  resizeOptions: {
    width: number;
    height: number;
    percentage: number;
    maintainAspectRatio: boolean;
  };
  originalDimensions?: { width: number; height: number };
  onChangeResize: (options: Partial<{
    width: number;
    height: number;
    percentage: number;
    maintainAspectRatio: boolean;
  }>) => void;
  // Compressor props
  compressionQuality: number;
  onChangeQuality: (quality: number) => void;
  // Converter props
  targetFormat: 'jpg' | 'png' | 'webp';
  onChangeFormat: (format: 'jpg' | 'png' | 'webp') => void;
  // Background Changer props
  bgOptions: {
    type: 'color' | 'gradient' | 'image' | 'transparent';
    color: string;
    gradientId: string;
    bgImageUrl?: string;
  };
  onChangeBgOptions: (options: Partial<{
    type: 'color' | 'gradient' | 'image' | 'transparent';
    color: string;
    gradientId: string;
    bgImageUrl?: string;
  }>) => void;
  // AI props
  onTriggerAiRemoveBg?: () => void;
  isAiLoading?: boolean;
  hasLoadedImage?: boolean;
}

export function PhotoSidebarControls({
  activeTool,
  onSelectTool,
  enhancementValues,
  onChangeEnhancement,
  onApplyPreset,
  aspectRatio,
  onChangeAspectRatio,
  resizeOptions,
  originalDimensions = { width: 1920, height: 1080 },
  onChangeResize,
  compressionQuality,
  onChangeQuality,
  targetFormat,
  onChangeFormat,
  bgOptions,
  onChangeBgOptions,
  onTriggerAiRemoveBg,
  isAiLoading = false,
  hasLoadedImage = false,
}: PhotoSidebarControlsProps) {
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Estimated file size calculation
  const currentW = resizeOptions.width || originalDimensions.width;
  const currentH = resizeOptions.height || originalDimensions.height;
  const estimatedBytes = estimateCompressedSize(
    currentW,
    currentH,
    targetFormat,
    compressionQuality
  );
  const estimatedSizeLabel = formatFileSize(estimatedBytes);

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        onChangeBgOptions({ type: 'image', bgImageUrl: url });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWidthChange = (newWidth: number) => {
    if (resizeOptions.maintainAspectRatio && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      const newHeight = Math.round(newWidth * ratio);
      onChangeResize({ width: newWidth, height: newHeight });
    } else {
      onChangeResize({ width: newWidth });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    if (resizeOptions.maintainAspectRatio && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      const newWidth = Math.round(newHeight * ratio);
      onChangeResize({ width: newWidth, height: newHeight });
    } else {
      onChangeResize({ height: newHeight });
    }
  };

  const handlePercentageChange = (pct: number) => {
    const newWidth = Math.round((originalDimensions.width * pct) / 100);
    const newHeight = Math.round((originalDimensions.height * pct) / 100);
    onChangeResize({ width: newWidth, height: newHeight, percentage: pct });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tool Selector Grid */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Editing Tools
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {PHOTO_TOOLS.map((tool) => {
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
                  {tool.id === 'bg-remover' && <Wand2 className="w-4 h-4 shrink-0" />}
                  {tool.id === 'bg-changer' && <Palette className="w-4 h-4 shrink-0" />}
                  {tool.id === 'enhancer' && <Sliders className="w-4 h-4 shrink-0" />}
                  {tool.id === 'cropper' && <Crop className="w-4 h-4 shrink-0" />}
                  {tool.id === 'resizer' && <Maximize2 className="w-4 h-4 shrink-0" />}
                  {tool.id === 'compressor' && <FileDown className="w-4 h-4 shrink-0" />}
                  {tool.id === 'converter' && <RefreshCw className="w-4 h-4 shrink-0" />}
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
        {/* 1. AI Background Remover */}
        {activeTool === 'bg-remover' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">AI Background Remover</h3>
              <p className="text-xs text-zinc-500 mt-1">
                One-click cutout isolating subjects cleanly with transparency.
              </p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border text-xs space-y-2">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Free Trial Available</span>
              </div>
              <p className="text-zinc-500">
                1 free run included per account. Future runs use 1 credit ($0.05).
              </p>
            </div>
            <Button
              className="w-full"
              disabled={!hasLoadedImage || isAiLoading}
              onClick={onTriggerAiRemoveBg}
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing Background...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Remove Background
                </>
              )}
            </Button>
          </div>
        )}

        {/* 2. Background Changer */}
        {activeTool === 'bg-changer' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Background Changer</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Apply solid colors, studio gradients, custom image, or keep transparent.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1 text-[11px]">
              {(['transparent', 'color', 'gradient', 'image'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onChangeBgOptions({ type })}
                  className={`py-1.5 rounded-md font-medium capitalize text-center transition-all ${
                    bgOptions.type === type
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-zinc-500 hover:text-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {bgOptions.type === 'color' && (
              <div className="space-y-2">
                <label className="text-xs font-medium">Preset Colors</label>
                <div className="grid grid-cols-6 gap-2">
                  {BACKGROUND_PRESETS.solidColors.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => onChangeBgOptions({ color: hex })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        bgOptions.color === hex
                          ? 'border-primary scale-110'
                          : 'border-zinc-300 dark:border-zinc-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="color"
                    value={bgOptions.color}
                    onChange={(e) => onChangeBgOptions({ color: e.target.value })}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgOptions.color}
                    onChange={(e) => onChangeBgOptions({ color: e.target.value })}
                    className="flex-1 text-xs px-2.5 py-1.5 border border-border rounded-lg bg-background"
                  />
                </div>
              </div>
            )}

            {bgOptions.type === 'gradient' && (
              <div className="space-y-2">
                <label className="text-xs font-medium">Studio Gradients</label>
                <div className="space-y-1.5">
                  {BACKGROUND_PRESETS.gradients.map((grad) => (
                    <button
                      key={grad.id}
                      onClick={() => onChangeBgOptions({ gradientId: grad.id })}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs flex items-center justify-between transition-all ${
                        bgOptions.gradientId === grad.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-zinc-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <span className="font-medium">{grad.name}</span>
                      <div
                        className="w-12 h-5 rounded border border-border shadow-inner"
                        style={{
                          background: `linear-gradient(to right, ${grad.stops[0].color}, ${grad.stops[1].color})`,
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bgOptions.type === 'image' && (
              <div className="space-y-3">
                <label className="text-xs font-medium">Custom Background Image</label>
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCustomBgUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => bgFileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5 mr-2" />
                  Choose Background Image...
                </Button>
                {bgOptions.bgImageUrl && (
                  <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border">
                    <img
                      src={bgOptions.bgImageUrl}
                      alt="Custom BG"
                      className="w-10 h-10 object-cover rounded"
                    />
                    <span className="text-xs text-zinc-500 truncate flex-1">
                      Custom background loaded
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Image Enhancer */}
        {activeTool === 'enhancer' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Image Adjustments</h3>
              <p className="text-xs text-zinc-500 mt-1">Fine-tune exposure and color curves.</p>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Quick Presets</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['vivid', 'warm', 'cool', 'studio', 'bw'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => onApplyPreset(key)}
                    className="px-2 py-1.5 text-xs rounded-md border border-border hover:bg-zinc-100 dark:hover:bg-zinc-800 uppercase font-medium"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-2">
              {[
                { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
                { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
                { key: 'exposure', label: 'Exposure', min: -100, max: 100 },
                { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
                { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
              ].map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{item.label}</span>
                    <span className="font-mono text-zinc-500">
                      {(enhancementValues as any)[item.key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    value={(enhancementValues as any)[item.key]}
                    onChange={(e) =>
                      onChangeEnhancement({ [item.key]: Number(e.target.value) })
                    }
                    className="w-full accent-primary h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Image Cropper */}
        {activeTool === 'cropper' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Aspect Ratio Crop</h3>
              <p className="text-xs text-zinc-500 mt-1">Preset ratios for social media & web.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['original', '1:1', '16:9', '4:3', '4:5', '9:16'].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => onChangeAspectRatio(ratio)}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                    aspectRatio === ratio
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  {ratio.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. Image Resizer */}
        {activeTool === 'resizer' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Resize Dimensions</h3>
              <p className="text-xs text-zinc-500 mt-1">Scale by pixels or percentage.</p>
            </div>

            {/* Percentage Scale Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span>Scale Percentage</span>
                <span className="font-mono text-primary font-bold">
                  {resizeOptions.percentage || 100}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={resizeOptions.percentage || 100}
                onChange={(e) => handlePercentageChange(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-medium">Width (px)</label>
                <input
                  type="number"
                  value={resizeOptions.width || ''}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 border border-border rounded-lg bg-background"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Height (px)</label>
                <input
                  type="number"
                  value={resizeOptions.height || ''}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 border border-border rounded-lg bg-background"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={resizeOptions.maintainAspectRatio}
                onChange={(e) => onChangeResize({ maintainAspectRatio: e.target.checked })}
                className="rounded accent-primary"
              />
              <span>Maintain aspect ratio</span>
            </label>
          </div>
        )}

        {/* 6. Image Compressor */}
        {activeTool === 'compressor' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Quality Compression</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Reduce download payload with visual quality balance.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span>Quality</span>
                <span className="font-mono text-primary font-bold">{compressionQuality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={compressionQuality}
                onChange={(e) => onChangeQuality(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-border flex justify-between items-center text-xs">
              <span className="text-zinc-500">Estimated Output Size:</span>
              <span className="font-mono font-bold text-primary">{estimatedSizeLabel}</span>
            </div>
          </div>
        )}

        {/* 7. Format Converter */}
        {activeTool === 'converter' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Target File Format</h3>
              <p className="text-xs text-zinc-500 mt-1">Convert to standard web image formats.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['webp', 'png', 'jpg'] as const).map((fmt) => (
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
      </div>
    </div>
  );
}
