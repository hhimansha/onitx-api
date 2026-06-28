import { Prisma } from "@prisma/client";
import { UserRole } from "../types";
import prisma from "../utils/prisma";

export const getStats = async (userId: string, role: UserRole) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const sevenDaysLater = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  const taskFilter: Prisma.TaskWhereInput =
    role === "ADMIN"
      ? {}
      : { OR: [{ createdById: userId }, { assignments: { some: { userId } } }] };

  const [
    totalUsers,
    totalTasks,
    statusGroups,
    priorityGroups,
    overdueTasks,
    tasksDueToday,
    tasksDueThisWeek,
  ] = await Promise.all([
    role === "ADMIN" ? prisma.user.count() : Promise.resolve(undefined),
    prisma.task.count({ where: taskFilter }),
    prisma.task.groupBy({ by: ["status"], where: taskFilter, _count: { _all: true } }),
    prisma.task.groupBy({ by: ["priority"], where: taskFilter, _count: { _all: true } }),
    prisma.task.count({
      where: { ...taskFilter, dueDate: { lt: now }, status: { not: "DONE" } },
    }),
    prisma.task.count({
      where: { ...taskFilter, dueDate: { gte: startOfToday, lte: endOfToday } },
    }),
    prisma.task.count({
      where: { ...taskFilter, dueDate: { gte: startOfToday, lt: sevenDaysLater } },
    }),
  ]);

  const statusMap = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));
  const priorityMap = Object.fromEntries(priorityGroups.map((g) => [g.priority, g._count._all]));

  return {
    ...(role === "ADMIN" && { totalUsers }),
    totalTasks,
    openTasks: statusMap["OPEN"] ?? 0,
    inProgressTasks: statusMap["IN_PROGRESS"] ?? 0,
    testingTasks: statusMap["TESTING"] ?? 0,
    doneTasks: statusMap["DONE"] ?? 0,
    overdueTasks,
    tasksDueToday,
    tasksDueThisWeek,
    highPriorityTasks: priorityMap["HIGH"] ?? 0,
    mediumPriorityTasks: priorityMap["MEDIUM"] ?? 0,
    lowPriorityTasks: priorityMap["LOW"] ?? 0,
  };
};
