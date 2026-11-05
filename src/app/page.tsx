'use client';

import React, { useState } from 'react';
import { MediaDropzone } from '@/components/upload/MediaDropzone';
import {
  Sparkles,
  Scissors,
  Image as ImageIcon,
  Volume2,
  ArrowRight,
  Maximize2,
  Minimize2,
  FileCode,
  Crop,
  Layers,
  UploadCloud,
  Sliders,
  DownloadCloud,
  CheckCircle2,
  HelpCircle,
  Shield,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo');

  const handleFileAccepted = (file: File) => {
    console.log('File accepted for editing:', file.name, file.size);
  };

  const photoTools = [
    { title: 'Background Remover', desc: 'AI-driven portrait cutout preserving fine hair details', href: '/photo-editor?tool=bg-remove', icon: Scissors },
    { title: 'Background Changer', desc: 'Swap cutouts onto studio backdrops or custom colors', href: '/photo-editor?tool=bg-change', icon: Layers },
    { title: 'Image Enhancer', desc: 'Fine-tune brightness, contrast, exposure & sharpness', href: '/photo-editor?tool=enhance', icon: Sliders },
    { title: 'Image Cropper', desc: 'Crop with standard aspect ratios (1:1, 16:9, 4:5)', href: '/photo-editor?tool=cropper', icon: Crop },
    { title: 'Image Resizer', desc: 'Scale pixel dimensions or percentage while maintaining ratio', href: '/photo-editor?tool=resizer', icon: Maximize2 },
    { title: 'Image Compressor', desc: 'Reduce file weight with visual quality retention preview', href: '/photo-editor?tool=compressor', icon: Minimize2 },
    { title: 'Format Converter', desc: 'Convert seamlessly between JPG, PNG, and WebP', href: '/photo-editor?tool=converter', icon: FileCode },
  ];

  const videoTools = [
    { title: 'Video Trimmer', desc: 'Dual-handle precision timeline scrubbing and cutting', href: '/video-editor?tool=trimmer', icon: Scissors },
    { title: 'Video Compressor', desc: 'Presets for web and mobile sharing (1080p, 720p, 480p)', href: '/video-editor?tool=compressor', icon: Minimize2 },
    { title: 'Video Resizer', desc: 'Format for YouTube (16:9), Shorts/Reels (9:16), or Square', href: '/video-editor?tool=resizer', icon: Maximize2 },
    { title: 'Audio Noise Remover', desc: 'Hybrid client extraction + AI speech isolation', href: '/video-editor?tool=noise-remover', icon: Volume2 },
  ];

  const howItWorksSteps = [
    {
      step: '01',
      title: 'Select or Upload',
      desc: 'Drag & drop your photo or video. Instant client validation ensures format and size conformance without waiting.',
      icon: UploadCloud,
    },
    {
      step: '02',
      title: 'Edit & Preview',
      desc: 'Use deterministic browser controls or trigger specialist AI models. Compare before/after with the split slider.',
      icon: Sliders,
    },
    {
      step: '03',
      title: 'Instant Download',
      desc: 'Export high-definition assets directly from browser memory. AI assets remain available for 24 hours in My Projects.',
      icon: DownloadCloud,
    },
  ];

  const faqs = [
    {
      q: 'Do I need to install software or register an account?',
      a: 'No. All standard image and video utilities (crop, resize, compress, trim, enhance) run 100% locally in your browser with no account and zero downloads required.',
    },
    {
      q: 'How does the free AI trial work?',
      a: 'Every registered account receives 1 successful free run per AI feature (AI Background Removal, AI Background Changer, AI Audio Noise Removal) to evaluate quality before purchasing credits.',
    },
    {
      q: 'What are the file size and duration constraints?',
      a: 'Photos support up to 25MB and 8192×8192px. Videos support up to 100MB and 180 seconds (3 minutes) in MP4, WebM, and MOV containers.',
    },
    {
      q: 'Are my uploaded media files private?',
      a: 'Yes. Browser-native tools process everything in memory on your computer. When using cloud AI, extracted assets are encrypted via signed URLs and auto-pruned from Cloudflare R2 after 24 hours.',
    },
  ];

  return (
    <main className="flex-1 flex flex-col items-center justify-start py-12 px-4 sm:px-6 space-y-24">
      {/* 1. Hero Header */}
      <section className="max-w-3xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Browser-Native & Specialist AI Engine</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Professional Editing. <br />
          <span className="text-primary">Directly in your browser.</span>
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          Remove backgrounds, enhance photos, trim videos, and reduce audio noise with one-click simplicity. Zero downloads required.
        </p>
      </section>

      {/* 2. Upload photo/video action */}
      <section className="w-full flex flex-col items-center">
        {/* Tabs for Upload */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'photo'
                ? 'bg-card dark:bg-zinc-900 text-foreground shadow-sm'
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
                ? 'bg-card dark:bg-zinc-900 text-foreground shadow-sm'
                : 'text-zinc-500 hover:text-foreground'
            }`}
          >
            <Scissors className="w-4 h-4" />
            Video Tools
          </button>
        </div>

        {/* Interactive Dropzone */}
        <div className="w-full max-w-2xl">
          <MediaDropzone
            mediaType={activeTab}
            title={activeTab === 'photo' ? 'Drop photo to start editing' : 'Drop video to start editing'}
            onFileAccepted={handleFileAccepted}
          />
        </div>
      </section>

      {/* 3. Popular Editing Tools */}
      <section className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Popular Editing Tools</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Our most frequently used one-click creative workflows</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/photo-editor?tool=bg-remove"
            className="p-5 rounded-2xl border border-border bg-card dark:bg-zinc-900/60 hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors flex items-center justify-between">
              AI Background Remover
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Remove image backgrounds instantly with hair-level detail.</p>
          </Link>

          <Link
            href="/photo-editor?tool=enhance"
            className="p-5 rounded-2xl border border-border bg-card dark:bg-zinc-900/60 hover:border-emerald-500/50 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-emerald-500 transition-colors flex items-center justify-between">
              Image Enhancer
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Adjust sharpness, brightness, and contrast deterministically in browser.</p>
          </Link>

          <Link
            href="/video-editor?tool=trimmer"
            className="p-5 rounded-2xl border border-border bg-card dark:bg-zinc-900/60 hover:border-purple-500/50 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
              <Scissors className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-purple-500 transition-colors flex items-center justify-between">
              Video Trimmer
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Cut and trim video segments with timeline precision.</p>
          </Link>

          <Link
            href="/video-editor?tool=noise-remover"
            className="p-5 rounded-2xl border border-border bg-card dark:bg-zinc-900/60 hover:border-amber-500/50 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-amber-500 transition-colors flex items-center justify-between">
              Audio Noise Remover
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Reduce background hiss, fan noise, and traffic while keeping speech clear.</p>
          </Link>
        </div>
      </section>

      {/* 4. Photo Editing Tools Showcase */}
      <section className="w-full max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 mb-2">
              <ImageIcon className="w-3.5 h-3.5" />
              Complete Photo Suite
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Photo Editing Tools</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">High-performance canvas processing and AI segmentation</p>
          </div>
          <Link
            href="/photo-editor"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Open Photo Studio <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photoTools.map((t, idx) => {
            const Icon = t.icon;
            return (
              <Link
                key={idx}
                href={t.href}
                className="p-5 rounded-2xl border border-border bg-card dark:bg-zinc-900/40 hover:border-primary/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all flex items-start gap-4"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{t.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{t.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. Video Editing Tools Showcase */}
      <section className="w-full max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500 mb-2">
              <Scissors className="w-3.5 h-3.5" />
              Video & Audio Suite
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Video Editing Tools</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Non-linear timeline editing and lightweight audio extraction</p>
          </div>
          <Link
            href="/video-editor"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Open Video Studio <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {videoTools.map((t, idx) => {
            const Icon = t.icon;
            return (
              <Link
                key={idx}
                href={t.href}
                className="p-5 rounded-2xl border border-border bg-card dark:bg-zinc-900/40 hover:border-purple-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{t.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{t.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-medium text-primary">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 6. AI-Powered Features Showcase */}
      <section className="w-full max-w-5xl rounded-3xl p-8 sm:p-12 border border-border bg-gradient-to-br from-card to-zinc-100/50 dark:from-zinc-900 dark:to-zinc-950">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
            <Zap className="w-3.5 h-3.5" />
            Specialist Cloud Models
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            AI When It Delivers Meaningful Quality
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Per PRD design principles, we only invoke cloud AI when specialist neural models decisively outperform browser-based heuristics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-border bg-card dark:bg-zinc-900/60">
            <h3 className="font-bold text-base mb-2">Neural Vision Segmentation</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              Preserves difficult boundaries including stray hairs, semi-transparent veils, and soft shadows without jagged pixelation.
            </p>
            <div className="text-xs font-semibold text-primary">1 credit / photo • 1 free trial</div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card dark:bg-zinc-900/60">
            <h3 className="font-bold text-base mb-2">Hybrid Audio Extraction</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              Browser extracts 16kHz/44.1kHz mono audio locally (2–5MB) avoiding massive 100MB video uploads before cloud noise cancellation.
            </p>
            <div className="text-xs font-semibold text-primary">1 credit / 30s • 1 free trial</div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card dark:bg-zinc-900/60">
            <h3 className="font-bold text-base mb-2">Zero-Reencode Remuxing</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
              Processed clean audio is synchronized client-side using MediaRecorder streams without degrading video quality or re-encoding.
            </p>
            <div className="text-xs font-semibold text-emerald-500">100% Client-Side Remux</div>
          </div>
        </div>
      </section>

      {/* 7. How It Works (3-step visual workflow) */}
      <section className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">How It Works</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">A streamlined 3-step creative workflow designed for speed</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {howItWorksSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="p-6 rounded-2xl border border-border bg-card dark:bg-zinc-900/40 relative">
                <span className="text-4xl font-black text-primary/20 absolute top-4 right-4">{step.step}</span>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold mb-2">{step.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Pricing Preview Section */}
      <section className="w-full max-w-5xl p-8 sm:p-12 rounded-3xl border border-border bg-card dark:bg-zinc-900/60 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Freemium + Pay-As-You-Go
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Transparent Pricing. Free Forever Browser Tools.
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enjoy unlimited local browser edits. When you need heavy AI processing, start with 1 free trial or pick credit packs from $5 with no recurring subscription traps.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            href="/photo-editor"
            className="px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center"
          >
            Try Free Tools
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm text-center flex items-center justify-center gap-2"
          >
            View All Plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 9. FAQ Accordion Section */}
      <section id="faq" className="w-full max-w-4xl scroll-mt-24">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <HelpCircle className="w-4 h-4" />
            Got Questions?
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 rounded-2xl border border-border bg-card dark:bg-zinc-900/40">
              <h3 className="font-bold text-sm sm:text-base text-foreground mb-2 flex items-center gap-2">
                <span className="text-primary font-mono text-xs">Q{idx + 1}.</span>
                {faq.q}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
