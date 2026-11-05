'use client';

import React, { useState } from 'react';
import { isJobExpired, formatTimeRemaining } from '@/lib/jobs/expiry';
import { Button } from '@/components/ui/button';
import { Download, Clock, AlertTriangle, FileImage, FileVideo, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface MockJobRecord {
  id: string;
  toolType: string;
  status: 'COMPLETED' | 'FAILED' | 'PROCESSING';
  createdAt: string;
  expiresAt: string | null;
  outputUrl: string | null;
}

const INITIAL_PROJECTS: MockJobRecord[] = [
  {
    id: 'job_recent_01',
    toolType: 'Photo Background Remover',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(), // expires in 22h
    outputUrl: 'https://example.com/download/processed_01.png',
  },
  {
    id: 'job_expired_02',
    toolType: 'Audio Noise Remover',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
    expiresAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // expired 6h ago
    outputUrl: null,
  },
];

export default function MyProjectsPage() {
  const [jobs] = useState<MockJobRecord[]>(INITIAL_PROJECTS);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Persistent job history. AI-generated temporary media is kept for 24 hours per privacy retention policy.
          </p>
        </div>
        <Link href="/">
          <Button variant="primary">New Edit</Button>
        </Link>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-border text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Tool / Project</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Retention / Expiry</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => {
                const expired = isJobExpired(job.expiresAt);
                return (
                  <tr key={job.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                        {job.toolType.toLowerCase().includes('video') || job.toolType.toLowerCase().includes('audio') ? (
                          <FileVideo className="w-4 h-4" />
                        ) : (
                          <FileImage className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{job.toolType}</div>
                        <div className="text-xs font-mono text-zinc-400">{job.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {job.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-xs font-mono" suppressHydrationWarning>
                      {new Date(job.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-6 py-4">
                      {expired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          <Clock className="w-3.5 h-3.5" /> Expired (Pruned)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                          <Clock className="w-3.5 h-3.5" /> {formatTimeRemaining(job.expiresAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {expired ? (
                        <Button size="sm" variant="outline" disabled title="Media file auto-pruned after 24 hours">
                          <Download className="w-3.5 h-3.5 mr-1" /> Expired
                        </Button>
                      ) : job.outputUrl ? (
                        <a href={job.outputUrl} download target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="primary">
                            <Download className="w-3.5 h-3.5 mr-1" /> Download
                          </Button>
                        </a>
                      ) : (
                        <Button size="sm" variant="ghost" disabled>
                          Unavailable
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

