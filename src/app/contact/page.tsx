'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, MessageSquare, CheckCircle2, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Support & Inquiries</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Get in Touch
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-base">
          Have questions about our browser editing tools, credit billing, or enterprise options?
          We are here to help.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card dark:bg-zinc-900/40">
            <Mail className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold text-base mb-1">Direct Email</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              For billing questions, partnerships, or bug reports:
            </p>
            <a
              href="mailto:support@mediaai.local"
              className="text-sm font-medium text-primary hover:underline"
            >
              support@mediaai.local
            </a>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card dark:bg-zinc-900/40">
            <HelpCircle className="w-6 h-6 text-emerald-500 mb-3" />
            <h3 className="font-semibold text-base mb-1">FAQ & Guides</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              Find immediate answers regarding formats, constraints, and credit usage on our homepage.
            </p>
            <Link
              href="/#faq"
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              Browse FAQ →
            </Link>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="p-8 rounded-2xl border border-border bg-card dark:bg-zinc-900/40">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Message Sent Successfully</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md mx-auto mb-6">
                  Thank you for reaching out. A support engineer will review your inquiry and follow up at {email} within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                    setSubject('');
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Billing question / bug report / feature request"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe how we can help you..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Submit Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

