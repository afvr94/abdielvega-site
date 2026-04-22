import { NextRequest, NextResponse } from 'next/server';
import isEmail from 'validator/lib/isEmail';
import { sendContactEmail } from '@/lib/mail';

export const runtime = 'nodejs';

type Body = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!isEmail(email))
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  if (message.length > 5000)
    return NextResponse.json({ error: 'Message is too long' }, { status: 400 });

  try {
    await sendContactEmail({ name, email, message });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact mail failed', err);
    return NextResponse.json({ error: 'Could not send message' }, { status: 500 });
  }
}
