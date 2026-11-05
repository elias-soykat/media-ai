'use client';

import React, { useState } from 'react';
import { MediaDropzone } from '@/components/upload/MediaDropzone';
import { Sparkles, Scissors, Image as ImageIcon, Volume2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo');

  const handleFileAccepted = (file: File) => {
    console.log('File accepted for editing:', file.name, file.size);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-start py-12 px-4 sm:px-6">
      {/* Hero Header */}
      <div className="max-w-3xl text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Browser-Native & AI-Powered</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Professional Editing. <br />
          <span className="text-primary">Directly in your browser.</span>
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Remove backgrounds, enhance photos, trim videos, and reduce audio noise with one-click simplicity. No downloads required.
        </p>
      </div>

      {/* Tabs for Upload */}
      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('photo')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'photo'
              ? 'bg-white dark:bg-zinc-900 text-foreground shadow-sm'
              : 'text-zinc-500 hover:text-foreground'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Photo Tools
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'video'
              ? 'bg-white dark:bg-zinc-900 text-foreground shadow-sm'
              : 'text-zinc-500 hover:text-foreground'
          }`}
        >
          <Scissors className="w-4 h-4" />
          Video Tools
        </button>
      </div>

      {/* Interactive Dropzone */}
      <div className="w-full max-w-2xl mb-16">
        <MediaDropzone
          mediaType={activeTab}
          title={activeTab === 'photo' ? 'Drop photo to start editing' : 'Drop video to start editing'}
          onFileAccepted={handleFileAccepted}
        />
      </div>

      {/* Quick Access Tool Grid */}
      <div className="w-full max-w-5xl">
        <h2 className="text-xl font-bold tracking-tight mb-6 text-center">Popular Editing Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/photo-editor?tool=bg-remove"
            className="p-5 rounded-xl border border-border bg-background hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-primary flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors flex items-center justify-between">
              AI Background Remover
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-500">Remove image backgrounds instantly with hair-level detail.</p>
          </Link>

          <Link
            href="/photo-editor?tool=enhance"
            className="p-5 rounded-xl border border-border bg-background hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-600 flex items-center justify-center mb-3">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-green-600 transition-colors flex items-center justify-between">
              Image Enhancer
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-500">Adjust sharpness, brightness, and contrast deterministically in browser.</p>
          </Link>

          <Link
            href="/video-editor?tool=trimmer"
            className="p-5 rounded-xl border border-border bg-background hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mb-3">
              <Scissors className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-purple-600 transition-colors flex items-center justify-between">
              Video Trimmer
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-500">Cut and trim video segments with timeline precision.</p>
          </Link>

          <Link
            href="/video-editor?tool=noise-remover"
            className="p-5 rounded-xl border border-border bg-background hover:border-primary/50 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center mb-3">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-orange-600 transition-colors flex items-center justify-between">
              Audio Noise Remover
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-500">Reduce background hiss, fan noise, and traffic while keeping speech clear.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
