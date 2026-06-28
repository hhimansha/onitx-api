import crypto from "crypto";
import bcrypt from "bcrypt";
import { AppError } from "../middleware/errorHandler";
import { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "../validators/auth.validator";
import { signToken } from "../utils/jwt";
import { sendPasswordResetEmail } from "../utils/email";
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

  await sendPasswordResetEmail(user.email, token);
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
