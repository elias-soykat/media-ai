import React from 'react';
import Link from 'next/link';
import { FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | MediaAI',
  description: 'Terms and conditions governing the use of MediaAI photo and video editing services.',
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <FileText className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Terms of Service
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Last updated: November 2026 • Effective immediately
        </p>
      </div>

      <div className="space-y-8 text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the MediaAI platform, including browser-native tools, cloud AI services, and user accounts, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">2. Description of Services & Freemium Usage</h2>
          <p>
            MediaAI offers deterministic browser-native tools and cloud AI processing for photo and video editing:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li><strong>Browser-Native Tools:</strong> Free of charge, local client processing, no account required.</li>
            <li><strong>Free AI Allowance:</strong> Exactly one successful free trial per AI tool per account.</li>
            <li><strong>Pay-As-You-Go Credits:</strong> Additional AI processing requires credit packages purchased via our Merchant of Record.</li>
            <li><strong>Failed Processing Guarantee:</strong> Failed AI processing runs do not deduct user credits or burn free trial allocations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">3. Acceptable Use Policy</h2>
          <p>You agree not to use MediaAI to process:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>Content that infringes on third-party intellectual property or copyright.</li>
            <li>Defamatory, obscene, harassing, or unlawful media.</li>
            <li>Non-consensual deepfakes or impersonation materials.</li>
            <li>Malicious payloads or files intended to compromise service infrastructure.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">4. Media Ownership & Copyright</h2>
          <p>
            You retain 100% full ownership, copyright, and intellectual property rights to all media you upload, process, or download using MediaAI. We claim no ownership over your inputs or final exported media.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">5. Payments, Credits & Refunds</h2>
          <p>
            All credit pack purchases and billing are processed by Paddle as the Merchant of Record. Unused credits remain valid in accordance with applicable laws. If you experience technical defects preventing credit usage, please contact our support team.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">6. Questions and Contact</h2>
          <p>
            For questions regarding these terms, please visit our{' '}
            <Link href="/contact" className="text-primary underline hover:text-blue-600">
              Support & Contact page
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}

