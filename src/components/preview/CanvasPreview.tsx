'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CanvasPreviewProps {
  originalImage?: string | null;
  processedImage?: string | null;
  alt?: string;
}

export function CanvasPreview({ originalImage, processedImage, alt = 'Media Preview' }: CanvasPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isComparing, setIsComparing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setSliderPosition(50);
  };

  const hasBoth = Boolean(originalImage && processedImage);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center select-none relative">
      {/* Floating Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-background/90 backdrop-blur border border-border p-1.5 rounded-lg shadow-sm">
        <Button size="sm" variant="ghost" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs font-mono px-1 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="ghost" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-border my-auto mx-0.5" />
        <Button size="sm" variant="ghost" onClick={handleReset} title="Reset View">
          <RotateCcw className="w-4 h-4" />
        </Button>

        {hasBoth && (
          <>
            <div className="w-px h-4 bg-border my-auto mx-0.5" />
            <Button
              size="sm"
              variant={isComparing ? 'primary' : 'ghost'}
              onClick={() => setIsComparing(!isComparing)}
              title="Toggle Comparison Slider"
            >
              <Columns className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Main Canvas / Image Display */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden relative cursor-grab active:cursor-grabbing"
      >
        {isComparing && hasBoth ? (
          <div
            className="relative max-w-full max-h-full overflow-hidden transition-transform duration-75"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* Processed (Right / Bottom) */}
            <img
              src={processedImage!}
              alt={alt}
              className="max-h-[75vh] w-auto object-contain block pointer-events-none"
            />

            {/* Original (Left / Top, clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={originalImage!}
                alt="Original"
                className="max-h-[75vh] w-auto object-contain block pointer-events-none max-w-none"
              />
            </div>

            {/* Slider Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize flex items-center justify-center"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[10px] font-bold text-zinc-700">
                ↔
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
            />
          </div>
        ) : (
          <div
            className="transition-transform duration-75 flex items-center justify-center"
            style={{ transform: `scale(${zoom})` }}
          >
            {processedImage ? (
              <img
                src={processedImage}
                alt={alt}
                className="max-h-[75vh] max-w-[80vw] object-contain rounded-lg shadow-sm"
              />
            ) : originalImage ? (
              <img
                src={originalImage}
                alt={alt}
                className="max-h-[75vh] max-w-[80vw] object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="text-zinc-400 text-sm">No media loaded</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

