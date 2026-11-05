'use client';

import React, { ReactNode } from 'react';

export interface WorkspaceShellProps {
  leftSidebar: ReactNode;
  previewArea: ReactNode;
  rightSidebar?: ReactNode;
  timeline?: ReactNode;
  title?: string;
}

export function WorkspaceShell({
  leftSidebar,
  previewArea,
  rightSidebar,
  timeline,
  title,
}: WorkspaceShellProps) {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-zinc-100/50 dark:bg-zinc-950">
      {title && (
        <div className="h-12 border-b border-border bg-background px-6 flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-sm tracking-tight">{title}</h2>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Controls & Options */}
        <aside className="w-80 border-r border-border bg-background flex flex-col shrink-0 overflow-y-auto p-4">
          {leftSidebar}
        </aside>

        {/* Center: Main Preview & Timeline */}
        <section className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            {previewArea}
          </div>

          {timeline && (
            <div className="h-32 border-t border-border bg-background p-3 shrink-0">
              {timeline}
            </div>
          )}
        </section>

        {/* Right Sidebar: Contextual or Export Controls (optional) */}
        {rightSidebar && (
          <aside className="w-72 border-l border-border bg-background flex flex-col shrink-0 overflow-y-auto p-4">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
