import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, EyeOff, Trash2 } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | MediaAI',
  description: 'Our privacy commitments, browser-native processing policy, and temporary data retention policy.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security & Privacy First</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Privacy Policy
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Last updated: November 2026 • Effective immediately
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        <div className="p-5 rounded-xl border border-border bg-card dark:bg-zinc-900/40">
          <Lock className="w-6 h-6 text-primary mb-3" />
          <h3 className="font-semibold text-sm mb-1">Local Browser Processing</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Standard photo and video utilities execute 100% locally on your device via Canvas and Web Audio APIs.
          </p>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card dark:bg-zinc-900/40">
          <EyeOff className="w-6 h-6 text-emerald-500 mb-3" />
          <h3 className="font-semibold text-sm mb-1">No AI Training On Your Media</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            We never use, license, or sell your uploaded photos or videos to train public or proprietary machine learning models.
          </p>
        </div>
        <div className="p-5 rounded-xl border border-border bg-card dark:bg-zinc-900/40">
          <Trash2 className="w-6 h-6 text-amber-500 mb-3" />
          <h3 className="font-semibold text-sm mb-1">Automated 24h Pruning</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Cloudflare R2 temporary media buckets permanently delete AI processing files after exactly 24 hours.
          </p>
        </div>
      </div>

      <div className="space-y-8 text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">1. Browser-Native Architecture & Zero-Upload Tools</h2>
          <p>
            MediaAI is designed from the ground up to minimize server exposure. All standard editing features—including image cropping, resizing, compression, format conversion, brightness/contrast enhancements, video trimming, video compression, and aspect-ratio adjustments—are processed entirely in your web browser using HTML5 Canvas, WebAssembly, and Web Audio APIs.
          </p>
          <p className="mt-2">
            Your media files for standard utilities are never sent to our servers, never stored in databases, and never leave your machine.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">2. Cloud AI Features & Data Transmission</h2>
          <p>
            When you explicitly choose to use an AI-powered feature (such as AI Background Removal, AI Background Changer, or AI Audio Noise Removal):
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>We request your confirmation and require authentication before invoking third-party AI APIs.</li>
            <li>For audio noise removal, our client-side extraction only uploads the isolated compact audio track (2–5 MB) rather than your full raw video file.</li>
            <li>Uploaded assets are encrypted in transit via HTTPS and stored in private S3-compatible Cloudflare R2 buckets using short-lived signed URLs.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">3. 24-Hour Retention Policy (`retentionHours = 24`)</h2>
          <p>
            In accordance with PRD specifications, all generated AI media assets are temporary. They are automatically deleted from Cloudflare R2 after 24 hours. Once pruned, only persistent metadata (such as timestamps, tool type, and expiration status) remains visible in your "My Projects" dashboard for accounting and audit purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">4. Authentication & Account Data</h2>
          <p>
            When you create an account, we store your email address and a cryptographically salted password hash. We use secure session cookies for authentication. Payment processing and billing are managed directly by Paddle (Merchant of Record); we never store your credit card or sensitive payment details.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">5. Contact and Data Deletion</h2>
          <p>
            You have the right to request full account deletion and metadata erasure at any time. For privacy inquiries or deletion requests, visit our{' '}
            <Link href="/contact" className="text-primary underline hover:text-blue-600">
              Support & Contact page
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}

