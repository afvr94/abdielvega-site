import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Image from 'next/image';
import { LoginForm } from '@/components/budget/LoginForm';
import { cliffoTheme } from '@/app/tv/fonts';

async function onTvHost() {
  const host = (await headers()).get('host') ?? '';
  return host.split('.')[0].toLowerCase() === 'tv';
}

export async function generateMetadata(): Promise<Metadata> {
  if (!(await onTvHost())) return { title: 'Sign in' };
  return {
    title: { absolute: 'Sign in · cliffo' },
    icons: { icon: '/tv/icon.svg', apple: '/tv/apple-icon.png' },
  };
}

const ERRORS = {
  denied: "That Google account can't sign in here.",
  failed: "Sign-in didn't finish. Try again.",
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  const message = !error ? null : error === 'denied' ? ERRORS.denied : ERRORS.failed;
  const isTv = await onTvHost();
  return (
    <div
      className={`${isTv ? cliffoTheme : ''} flex min-h-screen items-center justify-center bg-cream px-5 py-10`}
    >
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          {isTv ? (
            <Image
              src="/cliffo/logo.svg"
              alt="cliffo"
              width={114}
              height={40}
              priority
              className="mx-auto mb-6"
            />
          ) : (
            <div className="mb-2 label-tag">The Ledger · Private</div>
          )}
          <h1 className="font-display text-4xl font-semibold tracking-tightest-3">Sign in</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Sign in with your Google account.
          </p>
          {message ? (
            <p role="alert" className="mt-4 text-sm text-expense">
              {message}
            </p>
          ) : null}
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
