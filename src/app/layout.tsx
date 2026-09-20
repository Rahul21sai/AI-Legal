import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ProofClock',
    template: '%s | ProofClock',
  },
  description:
    'Transparent statutory clock worksheets with user-controlled triggers and deterministic date arithmetic.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6f1' },
    { media: '(prefers-color-scheme: dark)', color: '#192226' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to calculator
        </a>
        <header className="site-header">
          <Link className="wordmark" href="/" aria-label="ProofClock home">
            ProofClock
          </Link>
          <span className="header-note">Legal information, worked visibly</span>
        </header>
        {children}
      </body>
    </html>
  );
}
