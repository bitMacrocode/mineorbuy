import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mine or Buy — Bitcoin Treasury Calculator',
  description:
    'Should your business mine Bitcoin or just buy it? Honest math for profitable SMBs deploying pre-tax profit. Accounts for Section 179, marginal tax rate, and host profit-share.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </body>
    </html>
  );
}
