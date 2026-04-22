import { LoginForm } from '@/components/budget/LoginForm';

export const metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="label-tag mb-2">The Ledger · Private</div>
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
