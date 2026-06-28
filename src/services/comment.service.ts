import { AppError } from "../middleware/errorHandler";
import { UserRole } from "../types";
import prisma from "../utils/prisma";

const COMMENT_SELECT = {
  id: true,
  content: true,
  taskId: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true, profileImage: true } },
} as const;

const assertTaskAccess = async (taskId: string, userId: string, role: UserRole) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { createdById: true, assignments: { select: { userId: true } } },
  });
  if (!task) throw new AppError("Task not found", 404);
  if (
    role !== "ADMIN" &&
    task.createdById !== userId &&
    !task.assignments.some((a) => a.userId === userId)
  ) {
    throw new AppError("Forbidden", 403);
  }
};

export const getComments = async (taskId: string, userId: string, role: UserRole) => {
  await assertTaskAccess(taskId, userId, role);
  return prisma.comment.findMany({
    where: { taskId },
    select: COMMENT_SELECT,
    orderBy: { createdAt: "asc" },
  });
};

export const createComment = async (
  taskId: string,
  content: string,
  userId: string,
  role: UserRole
) => {
  await assertTaskAccess(taskId, userId, role);
  return prisma.comment.create({
    data: { content, taskId, userId },
    select: COMMENT_SELECT,
  });
};

export const updateComment = async (
  id: string,
  content: string,
  userId: string,
  role: UserRole
) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new AppError("Comment not found", 404);
  if (role !== "ADMIN" && comment.userId !== userId) throw new AppError("Forbidden", 403);

  return prisma.comment.update({ where: { id }, data: { content }, select: COMMENT_SELECT });
};

export const deleteComment = async (id: string, userId: string, role: UserRole) => {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) throw new AppError("Comment not found", 404);
  if (role !== "ADMIN" && comment.userId !== userId) throw new AppError("Forbidden", 403);

  await prisma.comment.delete({ where: { id } });
};
