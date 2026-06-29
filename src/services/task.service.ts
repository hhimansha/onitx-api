import { Prisma } from "@prisma/client";
import { AppError } from "../middleware/errorHandler";
import { UserRole } from "../types";
import { CreateTaskInput, TaskQuery, UpdateTaskInput } from "../validators/task.validator";
import prisma from "../utils/prisma";

const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, name: true, email: true, profileImage: true } },
  assignments: {
    select: {
      user: {
        select: { id: true, name: true, email: true, designation: true, profileImage: true },
      },
    },
  },
} as const;

const ACCESS_CHECK = {
  createdById: true,
  assignments: { select: { userId: true } },
} as const;

const ownerFilter = (userId: string) => ({
  OR: [
    { createdById: userId },
    { assignments: { some: { userId } } },
  ],
});

const assertAccess = (
  task: { createdById: string; assignments: { userId: string }[] } | null,
  userId: string,
  role: UserRole
) => {
  if (!task) throw new AppError("Task not found", 404);
  if (
    role !== "ADMIN" &&
    task.createdById !== userId &&
    !task.assignments.some((a) => a.userId === userId)
  ) {
    throw new AppError("Forbidden", 403);
  }
};

const validateAssignees = async (ids: string[]) => {
  if (!ids.length) return;
  const count = await prisma.user.count({ where: { id: { in: ids }, role: "USER" } });
  if (count !== ids.length) throw new AppError("One or more assigned users not found", 404);
};

export const getTasks = async (
  userId: string,
  role: UserRole,
  filters: TaskQuery = {}
) => {
  const { q, status, priority, assignedToId } = filters;
  const AND: Prisma.TaskWhereInput[] = [];

  if (role !== "ADMIN") AND.push(ownerFilter(userId));
  if (status) AND.push({ status });
  if (priority) AND.push({ priority });
  if (assignedToId) AND.push({ assignments: { some: { userId: assignedToId } } });
  if (q) AND.push({ OR: [{ title: { contains: q } }, { description: { contains: q } }] });

  const where: Prisma.TaskWhereInput = AND.length ? { AND } : {};
  return prisma.task.findMany({ where, select: TASK_SELECT, orderBy: { createdAt: "desc" } });
};

export const getTaskById = async (id: string, userId: string, role: UserRole) => {
  const task = await prisma.task.findUnique({ where: { id }, select: TASK_SELECT });
  assertAccess(
    task
      ? { createdById: task.createdById, assignments: task.assignments.map((a) => ({ userId: a.user.id })) }
      : null,
    userId,
    role
  );
  return task;
};

export const createTask = async (data: CreateTaskInput, userId: string) => {
  const { assignedToIds = [], ...taskData } = data;
  await validateAssignees(assignedToIds);

  return prisma.task.create({
    data: {
      ...taskData,
      createdById: userId,
      assignments: { create: assignedToIds.map((uid) => ({ userId: uid })) },
    },
    select: TASK_SELECT,
  });
};

export const updateTask = async (
  id: string,
  data: UpdateTaskInput,
  userId: string,
  role: UserRole
) => {
  const existing = await prisma.task.findUnique({ where: { id }, select: ACCESS_CHECK });
  assertAccess(existing, userId, role);

  const { assignedToIds, ...taskData } = data;

  if (assignedToIds !== undefined) await validateAssignees(assignedToIds);

  return prisma.task.update({
    where: { id },
    data: {
      ...taskData,
      ...(assignedToIds !== undefined
        ? { assignments: { deleteMany: {}, create: assignedToIds.map((uid) => ({ userId: uid })) } }
        : {}),
    },
    select: TASK_SELECT,
  });
};

export const deleteTask = async (id: string, userId: string, role: UserRole) => {
  const existing = await prisma.task.findUnique({ where: { id }, select: ACCESS_CHECK });
  assertAccess(existing, userId, role);
  await prisma.task.delete({ where: { id } });
};
