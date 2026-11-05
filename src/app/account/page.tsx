'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Coins,
  Sparkles,
  ArrowRight,
  LogOut,
  FolderKanban,
  Image,
  Video,
  Clock,
  PlusCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface UserSession {
  id: string;
  email: string;
  creditBalance: number;
  createdAt?: string;
}

export default function AccountDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setSession(data.user);
        } else {
          setSession(null);
        }
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSession(null);
      router.push('/account/login');
      router.refresh();
    } catch {
      // Ignore
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Account Dashboard
          </h1>
          <p className="text-sm text-zinc-500">
            Sign in to check your available credit balance, purchase more credits, and manage jobs.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account/login"
            className="px-6 py-2.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/account/signup"
            className="px-6 py-2.5 rounded-xl font-semibold border border-border hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-10">
      {/* User Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            My Account
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Logged in as <strong className="text-foreground">{session.email}</strong>
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {loggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          Sign Out
        </button>
      </div>

      {/* Credit Balance Hero Card */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-zinc-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium backdrop-blur">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Available AI Credits</span>
            </div>
            <div className="text-5xl sm:text-6xl font-black tracking-tight">
              {session.creditBalance}{' '}
              <span className="text-xl sm:text-2xl font-normal text-blue-200">
                credits
              </span>
            </div>
            <p className="text-xs text-blue-200/80 max-w-md">
              1 credit = 1 Photo Background Removal or 30s Speech Noise Removal. All standard browser tools are 100% free with 0 credits.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/pricing"
              className="px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 text-center"
            >
              <PlusCircle className="w-4 h-4" /> Buy More Credits
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          href="/photo-editor"
          className="p-6 rounded-2xl border border-border bg-white dark:bg-zinc-900/60 hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-4">
            <Image className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-foreground group-hover:text-blue-600 transition-colors">
            Photo Editor
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Background cutout, crop, resize, compress, & convert
          </p>
        </Link>

        <Link
          href="/video-editor"
          className="p-6 rounded-2xl border border-border bg-white dark:bg-zinc-900/60 hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-4">
            <Video className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-foreground group-hover:text-purple-600 transition-colors">
            Video Editor
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Timeline trim, resize, compress, speech isolation, & audio sync
          </p>
        </Link>

        <Link
          href="/my-projects"
          className="p-6 rounded-2xl border border-border bg-white dark:bg-zinc-900/60 hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4">
            <FolderKanban className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-foreground group-hover:text-emerald-600 transition-colors">
            My Projects
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Access recent job metadata, downloads, and output keys
          </p>
        </Link>
      </div>

      {/* Credit Transactions Ledger */}
      <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-500" />
            Credit History
          </h3>
          <Link
            href="/pricing"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            Package Options <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-8 text-center text-zinc-500 text-sm space-y-2">
            <CheckCircle className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="font-medium text-foreground">Account Active</p>
            <p className="text-xs text-zinc-400">
              When you purchase credit packages or process jobs, your transactions will appear here with instant audit verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
