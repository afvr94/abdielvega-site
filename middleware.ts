import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const BUDGET_HOST_PATTERN = /^budget\./i;

// Paths that must be reachable without a session
const PUBLIC_PATHS = new Set(['/login', '/auth/callback']);

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (pathname === '/favicon.ico') return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') ?? '';
  const isBudgetHost = BUDGET_HOST_PATTERN.test(host);
  const pathname = url.pathname;

  // 1 — SUBDOMAIN REWRITE: budget.abdielvega.com behaves as if it were /budget/*
  if (isBudgetHost) {
    // Block /budget/* path form on the subdomain to avoid double nesting
    if (pathname.startsWith('/budget')) {
      return NextResponse.redirect(new URL(pathname.replace(/^\/budget/, '') || '/', url));
    }

    // Public paths served as-is — just refresh the Supabase session
    if (isPublic(pathname)) {
      const { response } = await updateSession(req);
      return response;
    }

    // Everything else: authenticate, then internally rewrite to /budget/<path>
    const { response, user } = await updateSession(req);
    if (!user) {
      const loginUrl = url.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
    const rewritten = url.clone();
    rewritten.pathname = pathname === '/' ? '/budget' : `/budget${pathname}`;
    return NextResponse.rewrite(rewritten, { headers: response.headers });
  }

  // 2 — APEX / any other host: hide /budget/* so the budget tracker is
  //     strictly on its subdomain.
  if (pathname.startsWith('/budget')) {
    return NextResponse.rewrite(new URL('/404', url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // All routes except static assets and image optimizer
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
