import nodemailer from 'nodemailer';

export async function sendContactEmail({
  name,
  email,
  message,
}: {
  name: string;
  email: string;
  message: string;
}) {
  const host = process.env.SMTP_HOST || 'smtp.mail.me.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.EMAIL;
  const pass = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL;

  if (!host || !user || !pass || !from) {
    throw new Error('SMTP credentials are not configured');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter.sendMail({
    from,
    to: process.env.CONTACT_INBOX || from,
    replyTo: email,
    subject: `Portfolio inquiry — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });
}
