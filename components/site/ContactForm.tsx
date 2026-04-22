'use client';

import { FormEvent, useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import isEmail from 'validator/lib/isEmail';

type Status = 'idle' | 'sending' | 'success' | 'error';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  function validate() {
    const next = new Set<string>();
    if (!name.trim()) next.add('name');
    if (!isEmail(email)) next.add('email');
    if (!message.trim()) next.add('message');
    setErrors(next);
    return next.size === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    setServerError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Request failed');
      }
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="card border border-hairline p-10 text-center">
        <CheckCircle2 size={32} className="mx-auto mb-4 text-income" strokeWidth={1.5} />
        <div className="font-display text-3xl font-semibold">Letter received.</div>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
          Thank you. I reply to every message — typically within a day or two.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider hover:bg-ink/5"
        >
          Write another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card border border-hairline p-6 sm:p-8">
      <Field label="Name" folio="01" error={errors.has('name') ? 'Name is required' : null}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border-0 border-b border-ink/20 bg-transparent px-0 py-2 text-[17px] font-medium focus:border-ink focus:outline-none"
        />
      </Field>

      <Field
        label="Email"
        folio="02"
        error={errors.has('email') ? 'A valid email is required' : null}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="font-mono-tab w-full border-0 border-b border-ink/20 bg-transparent px-0 py-2 text-[15px] focus:border-ink focus:outline-none"
        />
      </Field>

      <Field
        label="Message"
        folio="03"
        error={errors.has('message') ? 'Tell me what brings you here' : null}
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write freely. Markdown won’t render but that’s fine."
          rows={6}
          className="w-full resize-none border-0 border-b border-ink/20 bg-transparent px-0 py-2 text-[15px] leading-relaxed focus:border-ink focus:outline-none"
        />
      </Field>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="label-tag">{status === 'sending' ? 'Delivering…' : 'Typeset & ready'}</div>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="group inline-flex items-center gap-2 rounded-full bg-expense px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream transition-all hover:bg-ink disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending…' : 'Send letter'}
          <Send
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </button>
      </div>

      {serverError ? (
        <div className="mt-6 flex items-start gap-2 border-t border-hairline pt-4 text-sm text-expense">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>Couldn’t send: {serverError}</span>
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  folio,
  error,
  children,
}: {
  label: string;
  folio: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="mb-1 flex items-baseline justify-between">
        <label className="label-tag">
          § {folio} — {label}
        </label>
        {error ? (
          <span className="font-mono-tab text-[10px] uppercase tracking-wider text-expense">
            {error}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
