import { headers } from 'next/headers';
import Image from 'next/image';
import { LoginForm } from '@/components/budget/LoginForm';
import { cliffoTheme } from '@/app/tv/fonts';

export const metadata = {
  title: 'Sign in',
};

export default async function LoginPage() {
  const host = (await headers()).get('host') ?? '';
  const isTv = host.split('.')[0] === 'tv';
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
            Enter your email. A single-use magic link will land in your inbox.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
