import { crateFonts } from './fonts';
import './crate.css';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`crate ${crateFonts} flex min-h-svh flex-col`}>
      <a
        href="#main"
        className="sr-only z-50 bg-lemon px-4 py-3 font-gothic text-base font-bold tracking-wide text-lake uppercase focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
