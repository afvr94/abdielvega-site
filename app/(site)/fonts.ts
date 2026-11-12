import {
  Big_Shoulders,
  Big_Shoulders_Stencil,
  Libre_Franklin,
  Ultra,
  Yellowtail,
} from 'next/font/google';

export const ultra = Ultra({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-ultra',
  display: 'swap',
});

export const shoulders = Big_Shoulders({
  subsets: ['latin'],
  variable: '--font-shoulders',
  display: 'swap',
});

export const shouldersStencil = Big_Shoulders_Stencil({
  subsets: ['latin'],
  weight: '800',
  variable: '--font-shoulders-stencil',
  display: 'swap',
});

export const yellowtail = Yellowtail({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-yellowtail',
  display: 'swap',
});

export const franklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-franklin-gothic',
  display: 'swap',
});

export const crateFonts = [ultra, shoulders, shouldersStencil, yellowtail, franklin]
  .map((f) => f.variable)
  .join(' ');
