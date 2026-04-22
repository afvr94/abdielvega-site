import type { Metadata } from 'next';
import { fraunces, instrument, jetbrains } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Abdiel Vega — Full-stack engineer',
    template: '%s · Abdiel Vega',
  },
  description:
    'Abdiel Vega is a full-stack engineer building considered, durable software. Portfolio, writing, and selected projects.',
  metadataBase: new URL('https://abdielvega.com'),
  openGraph: {
    title: 'Abdiel Vega — Full-stack engineer',
    description: 'Full-stack engineer. Portfolio and selected projects.',
    url: 'https://abdielvega.com',
    siteName: 'Abdiel Vega',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Abdiel Vega — Full-stack engineer',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
