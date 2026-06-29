import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { UpdateProfileInput, UserListQuery } from "../validators/user.validator";
import prisma from "../utils/prisma";

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  designation: true,
  profileImage: true,
  createdAt: true,
  updatedAt: true,
} as const;

const EMPTY_STATS = { totalAssignedTasks: 0, openTasks: 0, inProgressTasks: 0, doneTasks: 0 };

export const getUserList = async ({ q, sortBy = "createdAt", sortOrder = "desc" }: UserListQuery) => {
  const where: Prisma.UserWhereInput = q
    ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] }
    : {};

  const orderBy: Prisma.UserOrderByWithRelationInput =
    sortBy === "name"       ? { name: sortOrder }
    : sortBy === "email"    ? { email: sortOrder }
    : sortBy === "taskCount" ? { createdAt: "desc" }
    :                          { createdAt: sortOrder };

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy,
  });

  if (!users.length) return [];

  const assignments = await prisma.taskAssignment.findMany({
    where: { userId: { in: users.map((u) => u.id) } },
    select: { userId: true, task: { select: { status: true } } },
  });

  const statsMap: Record<string, typeof EMPTY_STATS> = {};
  for (const a of assignments) {
    const s = statsMap[a.userId] ?? { ...EMPTY_STATS };
    s.totalAssignedTasks++;
    if (a.task.status === "OPEN") s.openTasks++;
    else if (a.task.status === "IN_PROGRESS") s.inProgressTasks++;
    else if (a.task.status === "DONE") s.doneTasks++;
    statsMap[a.userId] = s;
  }

  const result = users.map((u) => ({ ...u, ...(statsMap[u.id] ?? EMPTY_STATS) }));

  if (sortBy === "taskCount") {
    result.sort((a, b) =>
      sortOrder === "asc"
        ? a.totalAssignedTasks - b.totalAssignedTasks
        : b.totalAssignedTasks - a.totalAssignedTasks
    );
  }

  return result;
};

export const getUserOptions = async (callerRole: string) =>
  prisma.user.findMany({
    where: callerRole === "ADMIN" ? {} : { role: "USER" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

export const getMe = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: PROFILE_SELECT });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const updateMe = async (id: string, data: UpdateProfileInput) => {
  if (data.email) {
    const existing = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
    if (existing) throw new AppError("Email already in use", 409);
  }
  return prisma.user.update({ where: { id }, data, select: PROFILE_SELECT });
};
