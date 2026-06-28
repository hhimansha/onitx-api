import { AppError } from "../middleware/errorHandler";
import { UpdateProfileInput } from "../validators/user.validator";
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

export const getUsers = async () =>
  prisma.user.findMany({
    where: { role: "USER" },
    select: USER_SELECT,
    orderBy: { name: "asc" },
  });

export const getMe = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const updateMe = async (id: string, data: UpdateProfileInput) => {
  if (data.email) {
    const existing = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
    if (existing) throw new AppError("Email already in use", 409);
  }
  return prisma.user.update({ where: { id }, data, select: USER_SELECT });
};
