import { Resend } from "resend";
import { AppError } from "../middleware/errorHandler";

export const sendPasswordResetEmail = async (
  to: string,
  token: string
): Promise<void> => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  // RESEND_FROM_EMAIL must be a verified domain address in production.
  // Falls back to Resend's shared test address for development (sends only
  // to the email registered on your Resend account).
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: `OnitX <${from}>`,
    to,
    subject: "Reset your OnitX password",
    html: `
      <p>Hi,</p>
      <p>You requested a password reset for your OnitX account.</p>
      <p>
        <a href="${resetUrl}" style="padding:10px 20px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
      </p>
      <p>This link expires in <strong>30 minutes</strong>.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    console.error("[Email] Resend error:", error);
    throw new AppError("Failed to send reset email. Please try again later.", 503);
  }
};
