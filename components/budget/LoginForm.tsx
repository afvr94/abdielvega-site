'use client';

import { FormEvent, useState } from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    setError(null);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (err) throw err;
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not send magic link');
    }
  }

  if (status === 'sent') {
    return (
      <div className="card border border-hairline p-10 text-center">
        <Check size={28} className="mx-auto mb-4 text-income" strokeWidth={1.5} />
        <div className="font-display text-2xl font-semibold">Check your inbox.</div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We sent a sign-in link to <span className="font-mono-tab text-ink">{email}</span>. Open it
          on this device to continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card border border-hairline p-6 sm:p-8">
      <label className="label-tag mb-2 block">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoFocus
        className="font-mono-tab w-full border-0 border-b border-ink/20 bg-transparent px-0 py-2 text-[15px] focus:border-ink focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'sending' || !email.trim()}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-wider text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send magic link'}
        <Mail size={14} strokeWidth={2} />
      </button>
      {error ? (
        <div className="mt-5 flex items-start gap-2 border-t border-hairline pt-4 text-xs text-expense">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </form>
  );
}
