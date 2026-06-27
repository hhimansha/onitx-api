import prisma from "../utils/prisma";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export const getUsers = async () =>
  prisma.user.findMany({ select: USER_SELECT, orderBy: { name: "asc" } });
