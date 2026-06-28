import bcrypt from "bcrypt";
import { AppError } from "../middleware/errorHandler";
import { LoginInput, RegisterInput } from "../validators/auth.validator";
import { signToken } from "../utils/jwt";
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
  const { password: _pw, ...safeUser } = user;
  return { token, user: safeUser };
};

export const getById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) throw new AppError("User not found", 404);
  return user;
};
