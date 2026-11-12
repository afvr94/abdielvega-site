'use client';

import { FormEvent, useState, type CSSProperties } from 'react';
import { Send, CircleCheck, CircleAlert } from 'lucide-react';
import isEmail from 'validator/lib/isEmail';

type Status = 'idle' | 'sending' | 'success' | 'error';

const tag = { '--rule': 'var(--color-lake)', '--ground': 'var(--color-paper)' } as CSSProperties;

const fieldClass =
  'w-full border-0 border-b-2 border-lake/30 bg-transparent px-0 py-2.5 text-lg text-lake transition-colors placeholder:text-lake/45 focus:border-tangelo aria-invalid:border-[#a8360c]';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  // Honeypot: real users never see or fill this; bots do.
  const [company, setCompany] = useState('');
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
        body: JSON.stringify({ name, email, message, company }),
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
      <div
        role="status"
        style={tag}
        className="label-rule bg-paper p-10 text-center text-lake sm:p-14"
      >
        <CircleCheck size={40} className="mx-auto text-grove" strokeWidth={2} aria-hidden />
        <p className="mt-5 font-wordmark text-[clamp(2rem,4vw,3rem)] leading-none">
          Letter received.
        </p>
        <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed">
          Thank you. I reply to every message — typically within a day or two.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="press mt-8 inline-flex min-h-12 items-center border-2 border-lake px-6 font-gothic text-lg font-extrabold tracking-[0.12em] uppercase hover:border-tangelo hover:bg-tangelo hover:text-paper"
        >
          Write another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={tag}
      className="label-rule relative bg-paper p-7 text-lake sm:p-12"
    >
      {/* Honeypot — hidden from real users, catches bots that fill every field. */}
      <div
        aria-hidden="true"
        className="absolute -top-[9999px] -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="company">Company (leave this empty)</label>
        <input
          type="text"
          id="company"
          name="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Field id="name" label="Name" error={errors.has('name') ? 'Name is required' : null}>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          aria-invalid={errors.has('name') || undefined}
          aria-describedby={errors.has('name') ? 'name-error' : undefined}
          className={fieldClass}
        />
      </Field>

      <Field
        id="email"
        label="Email"
        error={errors.has('email') ? 'A valid email is required' : null}
      >
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={errors.has('email') || undefined}
          aria-describedby={errors.has('email') ? 'email-error' : undefined}
          className={fieldClass}
        />
      </Field>

      <Field
        id="message"
        label="Message"
        error={errors.has('message') ? 'Tell me what brings you here' : null}
      >
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write freely. Markdown won’t render but that’s fine."
          rows={6}
          aria-invalid={errors.has('message') || undefined}
          aria-describedby={errors.has('message') ? 'message-error' : undefined}
          className={`${fieldClass} resize-none leading-relaxed`}
        />
      </Field>

      <div className="mt-10 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="font-script text-2xl text-grove">
          {status === 'sending' ? 'Delivering…' : 'Ready to ship'}
        </p>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="press group inline-flex min-h-12 items-center justify-center gap-2 bg-lake px-7 font-gothic text-lg font-extrabold tracking-[0.12em] text-paper uppercase hover:bg-tangelo disabled:pointer-events-none disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending…' : 'Send letter'}
          <Send
            size={16}
            aria-hidden
            strokeWidth={2.5}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </div>

      {serverError ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2 border-t-2 border-lake/20 pt-4 text-base text-[#a8360c]"
        >
          <CircleAlert size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>Couldn’t send: {serverError}</span>
        </p>
      ) : null}
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <label
          htmlFor={id}
          className="font-gothic text-base font-extrabold tracking-[0.16em] uppercase"
        >
          {label}
        </label>
        {error ? (
          <span id={`${id}-error`} className="text-sm font-semibold text-[#a8360c]">
            {error}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
