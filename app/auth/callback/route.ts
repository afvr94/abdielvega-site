import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  // Resolve first and compare origins. A prefix check misses "/\t/x", which URL parsing turns into "//x", a different site.
  const raw = url.searchParams.get('next') ?? '/';
  const requested = URL.canParse(raw, url.origin) ? new URL(raw, url.origin) : null;
  const next = requested?.origin === url.origin ? requested : new URL('/', url.origin);

  if (url.searchParams.has('error')) {
    return NextResponse.redirect(new URL('/login?error=denied', url.origin));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(next);
    }
  }

  return NextResponse.redirect(new URL('/login?error=failed', url.origin));
}
