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
  const user = process.env.EMAIL;
  const pass = process.env.EMAIL_PASSWORD;
  if (!user || !pass) throw new Error('SMTP credentials are not configured');

  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  return transporter.sendMail({
    from: user,
    to: process.env.CONTACT_INBOX || user,
    replyTo: email,
    subject: `Portfolio inquiry — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });
}
