'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CREDIT_PACKS,
  CreditPackId,
} from '@/lib/billing/paddleClient';
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function PricingPage() {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (packId: CreditPackId) => {
    try {
      setLoadingPack(packId);
      setError(null);

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Failed to initiate checkout');
      }

      // Redirect to Paddle Checkout
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout initiation failed');
      setLoadingPack(null);
    }
  };

  return (
    <div className="py-16 px-4 max-w-6xl mx-auto space-y-16">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Sparkles className="w-3.5 h-3.5" />
          Pay Only For What You Use
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
          Simple, Transparent Credit Packs
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Standard browser editing is 100% free with no login required. Premium AI
          features consume credits — buy once, use whenever you need without recurring subscriptions.
        </p>
      </div>

      {/* Free Trial Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-block px-2.5 py-0.5 rounded bg-white/20 text-xs font-bold uppercase tracking-wider">
            Free Trial Included
          </div>
          <h2 className="text-2xl font-bold">1 Free AI Run Per Feature For Every User</h2>
          <p className="text-blue-100 text-sm max-w-xl">
            Test photo background removal and speech noise removal with full quality before buying credits. No credit card required.
          </p>
        </div>
        <Link
          href="/photo-editor"
          className="whitespace-nowrap px-6 py-3 rounded-xl bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2"
        >
          Try Free Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Credit Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(Object.keys(CREDIT_PACKS) as CreditPackId[]).map((key) => {
          const pack = CREDIT_PACKS[key];
          const isPro = pack.isPopular;

          return (
            <div
              key={pack.id}
              className={`relative rounded-2xl p-8 border flex flex-col justify-between transition-all ${
                isPro
                  ? 'border-blue-500 shadow-xl bg-white dark:bg-zinc-900 ring-2 ring-blue-500'
                  : 'border-border bg-white dark:bg-zinc-900/60 shadow-sm hover:shadow-md'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-wide uppercase shadow">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{pack.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 min-h-[40px]">
                    {pack.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground">
                    ${pack.priceUsd}
                  </span>
                  <span className="text-sm text-zinc-500">one-time payment</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-sm">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {pack.credits} Credits
                  </span>
                  <span className="text-zinc-500 text-xs ml-2">
                    (${pack.pricePerCredit.toFixed(3)} / credit)
                  </span>
                </div>

                <ul className="space-y-3 pt-4 text-sm text-zinc-600 dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{pack.credits} Photo Background Removals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Up to {Math.floor(pack.credits * 0.5)} min of Speech Cleanup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Credits never expire</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unlimited free browser tools</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Paddle Merchant of Record (All cards & PayPal)</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleCheckout(pack.id)}
                  disabled={loadingPack !== null}
                  className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    isPro
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground'
                  } disabled:opacity-50`}
                >
                  {loadingPack === pack.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting to Checkout...
                    </>
                  ) : (
                    <>
                      Buy {pack.name} ({pack.credits} Credits)
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit Economics Breakdown */}
      <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900/60 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">How Credits Are Used</h3>
            <p className="text-sm text-zinc-500">
              Only heavy cloud AI tasks consume credits. Everything else is 100% free.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Free Forever (0 Credits)
            </div>
            <h4 className="font-bold text-foreground">In-Browser Editing</h4>
            <p className="text-xs text-zinc-500">
              Cropping, resizing, compression, format conversion, video trimming, and timeline assembly run 100% client-side in your browser.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              1 Credit / Image
            </div>
            <h4 className="font-bold text-foreground">AI Background Removal</h4>
            <p className="text-xs text-zinc-500">
              High-definition portrait cutout and edge refinement powered by specialized neural vision models.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              1 Credit / 30 Seconds
            </div>
            <h4 className="font-bold text-foreground">AI Audio Noise Removal</h4>
            <p className="text-xs text-zinc-500">
              Studio-grade speech isolation removing hums, air conditioning, and room reverb from audio and video clips.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 justify-center text-foreground font-bold text-2xl">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          Frequently Asked Questions
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="p-5 rounded-xl border border-border bg-white dark:bg-zinc-900/50 space-y-2">
            <h4 className="font-bold text-foreground">Do my purchased credits expire?</h4>
            <p className="text-zinc-600 dark:text-zinc-400">
              No. Purchased credits stay in your account indefinitely until used. Only temporary cloud uploaded files expire after 24 hours.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-white dark:bg-zinc-900/50 space-y-2">
            <h4 className="font-bold text-foreground">Are there recurring monthly charges?</h4>
            <p className="text-zinc-600 dark:text-zinc-400">
              No. We do not use recurring subscriptions. You only pay for credit packs when you need them.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-white dark:bg-zinc-900/50 space-y-2">
            <h4 className="font-bold text-foreground">How does the 1x free trial work?</h4>
            <p className="text-zinc-600 dark:text-zinc-400">
              Every registered user receives 1 free background removal and 1 free audio cleanup run to verify quality before spending any money.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-white dark:bg-zinc-900/50 space-y-2">
            <h4 className="font-bold text-foreground">Which payment methods are accepted?</h4>
            <p className="text-zinc-600 dark:text-zinc-400">
              Payments are securely handled by Paddle Merchant of Record, accepting Visa, MasterCard, Amex, Apple Pay, Google Pay, and PayPal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

