import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  // Default to '/' — the proxy resolves it to the right app per host
  // (budget.* → /budget, tv.* → /tv). Only same-site paths: "//x" or "/\x"
  // would send a fresh session to another site.
  const requested = url.searchParams.get('next') ?? '/';
  const next = /^\/(?![/\\])/.test(requested) ? requested : '/';

  // Google or Supabase refused the sign-in (e.g. an account that isn't allowed).
  if (url.searchParams.has('error')) {
    return NextResponse.redirect(new URL('/login?error=denied', url.origin));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=failed', url.origin));
}
