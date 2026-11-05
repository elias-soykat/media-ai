import React from 'react';
import Link from 'next/link';
import { Sparkles, Scissors, Image, Volume2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const metadata = {
  title: 'AI Media Editing Tools | MediaAI',
  description: 'Explore professional AI-powered media editing tools directly in your browser.',
};

export default function AiToolsPage() {
  const tools = [
    {
      id: 'bg-remove',
      title: 'AI Background Remover',
      badge: 'P0 AI Tool',
      description:
        'Instantly detect and remove backgrounds with hair-level detail preservation. Supports transparent PNG export and custom background swapping.',
      cost: '1 Credit / Photo (1 Free Trial)',
      href: '/photo-editor?tool=bg-remove',
      icon: Scissors,
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-500',
    },
    {
      id: 'bg-change',
      title: 'AI Background Changer',
      badge: 'P0 AI Tool',
      description:
        'Combine AI cutout with client-side canvas compositing. Choose from curated studio gradients, solid colors, or upload your own backdrop.',
      cost: '1 Credit / Photo (1 Free Trial)',
      href: '/photo-editor?tool=bg-change',
      icon: Image,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500',
    },
    {
      id: 'audio-noise',
      title: 'AI Audio Noise Remover',
      badge: 'Hybrid Pipeline',
      description:
        'Hybrid bandwidth-optimized pipeline: Web Audio API extracts lightweight audio locally, AI eliminates background hum/traffic, and remuxes into video.',
      cost: '1 Credit / 30s Audio (1 Free Trial)',
      href: '/video-editor?tool=audio-noise',
      icon: Volume2,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Professional Cloud AI Engines</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          AI-Powered Creative Tools
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg">
          Zero-compromise specialist AI models integrated seamlessly with browser-native editing.
          One successful free trial included per tool for every account.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              className="flex flex-col justify-between p-6 rounded-2xl border border-border bg-card dark:bg-zinc-900/60 shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-6`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 mb-2">
                  {tool.badge}
                </div>
                <h2 className="text-xl font-bold mb-3">{tool.title}</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                  {tool.description}
                </p>
              </div>

              <div>
                <div className="text-xs font-medium text-zinc-400 border-t border-border/60 pt-4 mb-4">
                  {tool.cost}
                </div>
                <Link
                  href={tool.href}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  <span>Launch Tool</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6 p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-border">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base mb-1">Privacy-First Architecture</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Browser-native tools never upload your media. For AI operations, extracted assets are encrypted via signed URLs and auto-pruned after 24 hours.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base mb-1">Fair Freemium Billing</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Failed AI operations never deduct credits. Standard utilities (crop, resize, compress, format convert) remain 100% free forever without an account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

