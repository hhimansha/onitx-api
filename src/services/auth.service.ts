import crypto from "crypto";
import bcrypt from "bcrypt";
import { AppError } from "../middleware/errorHandler";
import { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "../validators/auth.validator";
import { signToken } from "../utils/jwt";
import { sendEmail } from "../utils/email";
import prisma from "../utils/prisma";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  designation: true,
  profileImage: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const register = async (data: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError("Email already in use", 409);

  const hashed = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: { name: data.name, email: data.email, password: hashed },
    select: USER_SELECT,
  });
};

export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const { password: _pw, resetToken: _rt, resetTokenExpiry: _re, ...safeUser } = user;
  return { token, user: safeUser };
};

export const forgotPassword = async ({ email }: ForgotPasswordInput): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Return silently whether or not the email exists — prevents enumeration
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your OnitX password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
        <h2 style="margin-bottom:8px">Reset your password</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to continue:</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px">This link expires in <strong>30 minutes</strong>.</p>
        <p style="color:#6b7280;font-size:14px">If you did not request this, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">— OnitX Team</p>
      </div>
    `,
  });
};

export const resetPassword = async ({ token, password }: ResetPasswordInput): Promise<void> => {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new AppError("Invalid or expired reset token", 400);

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExpiry: null },
  });
};

export const getById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) throw new AppError("User not found", 404);
  return user;
};
