import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'HIIT Timer',
  description: 'Interval training timer with voice cues and screen wake.',
};

export default function HIITLayout({ children }: { children: ReactNode }) {
  return children;
}
