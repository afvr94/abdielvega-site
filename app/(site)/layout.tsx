import { Masthead } from '@/components/site/Masthead';
import { Nav } from '@/components/site/Nav';
import { Footer } from '@/components/site/Footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Masthead />
      <Nav />
      <main className="min-h-[70vh] animate-fadein">{children}</main>
      <Footer />
    </>
  );
}
