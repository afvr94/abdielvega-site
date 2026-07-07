import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const BUDGET_HOST_PATTERN = /^budget\./i;
const TV_HOST_PATTERN = /^tv\./i;
const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/i;

// Paths that must be reachable without a session
const PUBLIC_PATHS = new Set(['/login', '/auth/callback']);

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/api/')) return true;
  if (pathname === '/favicon.ico') return true;
  return false;
}

// A gated subdomain: requests to the host are internally rewritten to `<prefix>/*`
// and require an authenticated Supabase session.
type GatedApp = { host: RegExp; prefix: string };

const GATED_APPS: GatedApp[] = [
  { host: BUDGET_HOST_PATTERN, prefix: '/budget' },
  { host: TV_HOST_PATTERN, prefix: '/tv' },
];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get('host') ?? '';
  const pathname = url.pathname;

  // 1 — SUBDOMAIN REWRITE: e.g. budget.abdielvega.com behaves as if it were /budget/*
  const app = GATED_APPS.find((a) => a.host.test(host));
  if (app) {
    // Block the /<prefix>/* path form on the subdomain to avoid double nesting
    if (pathname === app.prefix || pathname.startsWith(`${app.prefix}/`)) {
      return NextResponse.redirect(new URL(pathname.slice(app.prefix.length) || '/', url));
    }

    // Public paths served as-is — just refresh the Supabase session
    if (isPublic(pathname)) {
      const { response } = await updateSession(req);
      return response;
    }

    // Everything else: authenticate, then internally rewrite to /<prefix>/<path>
    const { response, user } = await updateSession(req);
    if (!user) {
      const loginUrl = url.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
    const rewritten = url.clone();
    rewritten.pathname = pathname === '/' ? app.prefix : `${app.prefix}${pathname}`;
    return NextResponse.rewrite(rewritten, { headers: response.headers });
  }

  // 2 — APEX / any other host: hide the gated apps' path forms so each tracker is
  //     strictly on its subdomain. Exempt localhost so you can test in dev without
  //     editing /etc/hosts.
  if (!LOCAL_HOST_PATTERN.test(host)) {
    for (const { prefix } of GATED_APPS) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        return NextResponse.rewrite(new URL('/404', url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // All routes except static assets and image optimizer
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
