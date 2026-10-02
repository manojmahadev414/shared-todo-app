import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | undefined;

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) return null;

  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
  return transporter;
}

export async function sendAuthEmail(to: string, subject: string, url: string) {
  const smtp = getTransporter();
  if (!smtp) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[Shared To-Do] ${subject} for ${to}: ${url}`);
      return;
    }
    throw new Error("SMTP email delivery is not configured.");
  }

  const from = process.env.SMTP_FROM;
  if (!from) throw new Error("SMTP_FROM is not configured.");
  await smtp.sendMail({
    from,
    to,
    subject,
    text: `${subject}\n\nOpen this link to continue:\n${url}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>${subject}</p><p><a href="${url}">Continue to Shared To-Do</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}
