import crypto from "crypto";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { AppError } from "../middleware/errorHandler";
import { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "../validators/auth.validator";
import { signToken } from "../utils/jwt";
import { sendPasswordReset } from "../utils/mailer";
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

  if (!user || !user.password) throw new AppError("Invalid credentials", 401);
  if (!(await bcrypt.compare(data.password, user.password))) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const { password: _pw, resetPasswordToken: _rt, resetPasswordExpiry: _re, ...safeUser } = user;
  return { token, user: safeUser };
};

export const googleAuth = async (idToken: string) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new AppError("Google auth is not configured", 503);

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({ idToken, audience: clientId }).catch(() => {
    throw new AppError("Invalid Google token", 401);
  });

  const payload = ticket.getPayload();
  if (!payload?.email) throw new AppError("Invalid Google token", 401);

  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: payload.name ?? payload.email,
        email: payload.email,
        googleId: payload.sub,
        profileImage: payload.picture ?? null,
        role: "USER",
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: payload.sub },
    });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const { password: _pw, resetPasswordToken: _rt, resetPasswordExpiry: _re, ...safeUser } = user;
  return { token, user: safeUser };
};

export const forgotPassword = async ({ email }: ForgotPasswordInput) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // silently ignore — don't reveal whether email exists

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: token,
      resetPasswordExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await sendPasswordReset(email, token);
};

export const resetPassword = async ({ token, password }: ResetPasswordInput) => {
  const user = await prisma.user.findFirst({
    where: { resetPasswordToken: token, resetPasswordExpiry: { gt: new Date() } },
  });
  if (!user) throw new AppError("Invalid or expired reset token", 400);

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetPasswordToken: null, resetPasswordExpiry: null },
  });
};

export const getById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) throw new AppError("User not found", 404);
  return user;
};
