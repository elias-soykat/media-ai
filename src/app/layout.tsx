import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Photo & Video Editor',
  description: 'Professional-quality photo and video editing directly in your browser.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

