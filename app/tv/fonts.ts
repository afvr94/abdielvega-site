import { DM_Sans, Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });

// Put on the root element of every cliffo page; globals.css swaps the palette and type under it.
export const cliffoTheme = `cliffo ${outfit.variable} ${dmSans.variable}`;
