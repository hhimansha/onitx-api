import nodemailer from "nodemailer";

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export const sendPasswordReset = async (
  email: string,
  token: string
): Promise<void> => {
  if (!process.env.SMTP_HOST) {
    // No SMTP configured — log token to console for development
    console.info(`[Mailer] Password reset token for ${email}: ${token}`);
    return;
  }

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "OnitX — Password Reset",
    html: `
      <p>You requested a password reset for your OnitX account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in <strong>1 hour</strong>. If you did not request this, ignore this email.</p>
    `,
  });
};
