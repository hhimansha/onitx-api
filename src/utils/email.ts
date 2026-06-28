import nodemailer from "nodemailer";
import { AppError } from "../middleware/errorHandler";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

export const sendEmail = async ({ to, subject, html }: SendEmailOptions): Promise<void> => {
  try {
    await createTransporter().sendMail({
      from: `OnitX <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    throw new AppError("Failed to send email. Please try again later.", 503);
  }
};
