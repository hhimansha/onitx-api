import { AppError } from "../middleware/errorHandler";
import { UserRole } from "../types";
import { CreateTaskInput, UpdateTaskInput } from "../validators/task.validator";
import prisma from "../utils/prisma";

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  createdById: true,
  assignedToId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} as const;

const ownerFilter = (userId: string) => ({
  OR: [{ createdById: userId }, { assignedToId: userId }],
});

const assertAccess = (
  task: { createdById: string; assignedToId: string | null } | null,
  userId: string,
  role: UserRole
) => {
  if (!task) throw new AppError("Task not found", 404);
  if (
    role !== "ADMIN" &&
    task.createdById !== userId &&
    task.assignedToId !== userId
  ) {
    throw new AppError("Forbidden", 403);
  }
};

export const getTasks = async (userId: string, role: UserRole) => {
  const where = role === "ADMIN" ? {} : ownerFilter(userId);
  return prisma.task.findMany({ where, select: TASK_SELECT, orderBy: { createdAt: "desc" } });
};

export const getTaskById = async (id: string, userId: string, role: UserRole) => {
  const task = await prisma.task.findUnique({ where: { id }, select: TASK_SELECT });
  assertAccess(task, userId, role);
  return task;
};

export const createTask = async (data: CreateTaskInput, userId: string) => {
  if (data.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: data.assignedToId } });
    if (!assignee) throw new AppError("Assigned user not found", 404);
  }

  return prisma.task.create({
    data: { ...data, createdById: userId },
    select: TASK_SELECT,
  });
};

export const updateTask = async (
  id: string,
  data: UpdateTaskInput,
  userId: string,
  role: UserRole
) => {
  const existing = await prisma.task.findUnique({
    where: { id },
    select: { createdById: true, assignedToId: true },
  });
  assertAccess(existing, userId, role);

  if (data.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: data.assignedToId } });
    if (!assignee) throw new AppError("Assigned user not found", 404);
  }

  return prisma.task.update({ where: { id }, data, select: TASK_SELECT });
};

export const deleteTask = async (id: string, userId: string, role: UserRole) => {
  const existing = await prisma.task.findUnique({
    where: { id },
    select: { createdById: true, assignedToId: true },
  });
  assertAccess(existing, userId, role);
  await prisma.task.delete({ where: { id } });
};
