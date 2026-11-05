'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CREDIT_PACKS,
  CreditPackId,
} from '@/lib/billing/paddleClient';
import {
  Check,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Loader2,
  Layers,
  Crown,
  Briefcase,
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

      if (res.status === 401) {
        window.location.href = '/account/login?redirect=/pricing';
        return;
      }

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Failed to initiate checkout');
      }

      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout initiation failed');
      setLoadingPack(null);
    }
  };

  const TIERS = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Ideal for quick browser-based photo and video improvements with zero setup.',
      badge: null,
      icon: Layers,
      cta: 'Get Started Free',
      ctaHref: '/photo-editor',
      features: [
        'All browser-native photo & video tools',
        'No account required for standard tools',
        '1 free trial per AI feature upon signup',
        '25MB photo & 100MB video input limit',
        'Standard processing priority',
        '24h project retention history',
      ],
      highlight: false,
    },
    {
      name: 'Pay As You Go',
      price: 'From $5',
      period: 'one-time',
      description: 'Flexible credit packs for creators who need AI background and audio processing on demand.',
      badge: 'Flexible',
      icon: Zap,
      cta: 'View Credit Packs',
      ctaHref: '#credit-packs',
      features: [
        'Everything in Free tier',
        'Buy credits as needed (from $0.06/credit)',
        'Credits never expire',
        'AI Background Removal (1 credit/image)',
        'AI Speech Noise Removal (1 credit/30s)',
        'No monthly recurring commitments',
      ],
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$15',
      period: 'per month',
      description: 'Designed for active YouTubers, freelancers, and professional content creators.',
      badge: 'Most Popular',
      icon: Crown,
      cta: 'Subscribe to Pro',
      ctaHref: '#credit-packs',
      features: [
        'Includes 250 monthly AI credits',
        'Priority cloud AI queue processing',
        'Full high-definition 4K export support',
        'Batch media processing pipeline',
        'Extended 30-day project retention',
        'Direct email customer support',
      ],
      highlight: true,
    },
    {
      name: 'Business',
      price: '$49',
      period: 'per month',
      description: 'For agencies, marketing teams, and high-volume media operations.',
      badge: 'Teams & Scale',
      icon: Briefcase,
      cta: 'Contact Sales',
      ctaHref: '/contact',
      features: [
        'Includes 1,000 monthly AI credits',
        'Dedicated webhook API integrations',
        'Team workspace & shared credit pool',
        'Custom retention & compliance SLA',
        'Highest priority compute clusters',
        'Dedicated account manager',
      ],
      highlight: false,
    },
  ];

  const COMPARISON_FEATURES = [
    { name: 'Browser-Native Editing Tools', free: true, payg: true, pro: true, biz: true },
    { name: 'Instant Client-Side Export', free: true, payg: true, pro: true, biz: true },
    { name: 'Free AI Trial Allowance', free: '1 use / tool', payg: '1 use / tool', pro: 'Included', biz: 'Included' },
    { name: 'AI Background Removal', free: 'Trial only', payg: '1 Credit / photo', pro: '250 / mo', biz: '1,000 / mo' },
    { name: 'AI Audio Noise Removal', free: 'Trial only', payg: '1 Credit / 30s', pro: 'Included in pool', biz: 'Included in pool' },
    { name: 'Max Video Input Size', free: '100 MB', payg: '100 MB', pro: '250 MB', biz: '500 MB' },
    { name: 'Max Video Duration', free: '3 minutes', payg: '3 minutes', pro: '10 minutes', biz: '30 minutes' },
    { name: 'Processing Priority', free: 'Standard', payg: 'Standard', pro: 'High Priority', biz: 'Dedicated Cluster' },
    { name: 'Project History Retention', free: '24 Hours', freeExpired: true, payg: '24 Hours', pro: '30 Days', biz: 'Unlimited / Custom' },
    { name: 'Commercial License', free: true, payg: true, pro: true, biz: true },
  ];

  return (
    <div className="py-16 px-4 max-w-6xl mx-auto space-y-20">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-primary border border-blue-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          Transparent, Quality-First Pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
          Choose the Perfect Plan for Your Creative Flow
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Browser-native editing is completely free forever. Use flexible credit packs or monthly plans when you need professional AI cloud processing.
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

      {/* PRD Section 7 Subscription Tiers */}
      <div>
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Platform Tiers</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Scalable plans designed around the PRD freemium model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-6 border flex flex-col justify-between transition-all ${
                  tier.highlight
                    ? 'border-primary ring-2 ring-primary shadow-xl bg-card dark:bg-zinc-900'
                    : 'border-border bg-card dark:bg-zinc-900/60 shadow-sm hover:shadow-md'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider shadow">
                    {tier.badge}
                  </div>
                )}

                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                  <div className="mt-2 mb-3">
                    <span className="text-3xl font-black text-foreground">{tier.price}</span>
                    <span className="text-xs text-zinc-500 ml-1.5">/{tier.period}</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 min-h-[36px] mb-6">
                    {tier.description}
                  </p>

                  <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300 border-t border-border pt-4">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-border">
                  <Link
                    href={tier.ctaHref}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      tier.highlight
                        ? 'bg-primary hover:bg-blue-600 text-white shadow-sm'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground'
                    }`}
                  >
                    {tier.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pay-as-you-go Credit Packages Section */}
      <div id="credit-packs" className="scroll-mt-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 mb-2">
            <Zap className="w-3.5 h-3.5" />
            No Recurring Subscriptions
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Pay-As-You-Go Credit Packs
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xl mx-auto">
            Purchase credits on demand via Paddle Merchant of Record. Credits never expire and failed runs are never charged.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm text-center mb-8">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(Object.keys(CREDIT_PACKS) as CreditPackId[]).map((key) => {
            const pack = CREDIT_PACKS[key];
            const isPro = pack.isPopular;

            return (
              <div
                key={pack.id}
                className={`relative rounded-2xl p-8 border flex flex-col justify-between transition-all ${
                  isPro
                    ? 'border-primary shadow-xl bg-card dark:bg-zinc-900 ring-2 ring-primary'
                    : 'border-border bg-card dark:bg-zinc-900/60 shadow-sm hover:shadow-md'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-bold tracking-wide uppercase shadow">
                    Best Value
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

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-border text-sm">
                    <span className="font-bold text-primary">
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
                        ? 'bg-primary hover:bg-blue-600 text-white shadow-md'
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
      </div>

      {/* Feature Comparison Table */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Detailed Feature Comparison
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Everything you need to know about our browser-native and cloud capabilities.
          </p>
        </div>

        <div className="border border-border rounded-2xl overflow-hidden bg-card dark:bg-zinc-900/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-border text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Capability</th>
                  <th className="px-6 py-4">Free</th>
                  <th className="px-6 py-4">Pay As You Go</th>
                  <th className="px-6 py-4 text-primary">Pro</th>
                  <th className="px-6 py-4">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-zinc-700 dark:text-zinc-300">
                {COMPARISON_FEATURES.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{row.name}</td>
                    <td className="px-6 py-4">
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-400" />
                        )
                      ) : (
                        <span className="text-xs">{row.free}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {typeof row.payg === 'boolean' ? (
                        row.payg ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-400" />
                        )
                      ) : (
                        <span className="text-xs">{row.payg}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-400" />
                        )
                      ) : (
                        <span className="text-xs">{row.pro}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {typeof row.biz === 'boolean' ? (
                        row.biz ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-400" />
                        )
                      ) : (
                        <span className="text-xs">{row.biz}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Credit Economics Breakdown */}
      <div className="rounded-2xl border border-border bg-card dark:bg-zinc-900/60 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
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
          <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Free Forever (0 Credits)
            </div>
            <h4 className="font-bold text-foreground">In-Browser Editing</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Cropping, resizing, compression, format conversion, video trimming, and timeline assembly run 100% client-side in your browser.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              1 Credit / Image
            </div>
            <h4 className="font-bold text-foreground">AI Background Removal</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              High-definition portrait cutout and edge refinement powered by specialized neural vision models.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-purple-500">
              1 Credit / 30 Seconds
            </div>
            <h4 className="font-bold text-foreground">AI Audio Noise Removal</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Studio-grade speech isolation removing hums, air conditioning, and room reverb from audio and video clips.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 justify-center text-foreground font-bold text-2xl">
          <HelpCircle className="w-6 h-6 text-primary" />
          Frequently Asked Questions
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="p-5 rounded-xl border border-border bg-card dark:bg-zinc-900/50 space-y-2">
            <h4 className="font-bold text-foreground">Do my purchased credits expire?</h4>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              No. Purchased credits stay in your account indefinitely until used. Only temporary cloud uploaded files expire after 24 hours.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card dark:bg-zinc-900/50 space-y-2">
            <h4 className="font-bold text-foreground">Are there hidden fees?</h4>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              No. Paddle handles checkout with all taxes and VAT included. You only pay the exact price shown on the card.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card dark:bg-zinc-900/50 space-y-2">
            <h4 className="font-bold text-foreground">How does the 1x free trial work?</h4>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              Every registered user receives 1 free background removal and 1 free audio cleanup run to verify quality before spending any money.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card dark:bg-zinc-900/50 space-y-2">
            <h4 className="font-bold text-foreground">Which payment methods are accepted?</h4>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
              Payments are securely handled by Paddle Merchant of Record, accepting Visa, MasterCard, Amex, Apple Pay, Google Pay, and PayPal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
