import { Prisma } from "@prisma/client";
import { UserRole } from "../types";
import prisma from "../utils/prisma";

export const getStats = async (userId: string, role: UserRole) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const sevenDaysLater = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

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
    recentTasks,
    assignmentGroups,
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
    prisma.task.findMany({
      where: { ...taskFilter, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    role === "ADMIN"
      ? prisma.taskAssignment.groupBy({
          by: ["userId"],
          _count: { taskId: true },
          orderBy: { _count: { taskId: "desc" } },
          take: 5,
        })
      : Promise.resolve(undefined),
  ]);

  const statusMap = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all]));
  const priorityMap = Object.fromEntries(priorityGroups.map((g) => [g.priority, g._count._all]));

  // Build per-day task creation counts for the last 7 days
  const dayMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
    dayMap[d.toISOString().split("T")[0]] = 0;
  }
  recentTasks.forEach((t) => {
    const key = t.createdAt.toISOString().split("T")[0];
    if (dayMap[key] !== undefined) dayMap[key]++;
  });
  const tasksCreatedByDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

  // Resolve top assignees — second query depends on first result, ADMIN only
  let topAssignees:
    | Array<{ id: string; name: string; profileImage: string | null; taskCount: number }>
    | undefined;

  if (role === "ADMIN" && assignmentGroups && assignmentGroups.length > 0) {
    const assigneeIds = assignmentGroups.map((a) => a.userId);
    const assigneeUsers = await prisma.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, name: true, profileImage: true },
    });
    const userMap = Object.fromEntries(assigneeUsers.map((u) => [u.id, u]));
    topAssignees = assignmentGroups.map((a) => ({
      ...userMap[a.userId],
      taskCount: a._count.taskId,
    }));
  }

  return {
    summary: {
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
    },
    charts: {
      statusBreakdown: [
        { status: "OPEN", label: "Open", count: statusMap["OPEN"] ?? 0 },
        { status: "IN_PROGRESS", label: "In Progress", count: statusMap["IN_PROGRESS"] ?? 0 },
        { status: "TESTING", label: "Testing", count: statusMap["TESTING"] ?? 0 },
        { status: "DONE", label: "Done", count: statusMap["DONE"] ?? 0 },
      ],
      priorityBreakdown: [
        { priority: "HIGH", label: "High", count: priorityMap["HIGH"] ?? 0 },
        { priority: "MEDIUM", label: "Medium", count: priorityMap["MEDIUM"] ?? 0 },
        { priority: "LOW", label: "Low", count: priorityMap["LOW"] ?? 0 },
      ],
      tasksCreatedByDay,
      dueTimeline: [
        { label: "Overdue", count: overdueTasks },
        { label: "Due Today", count: tasksDueToday },
        { label: "Due This Week", count: tasksDueThisWeek },
      ],
      ...(role === "ADMIN" && { topAssignees: topAssignees ?? [] }),
    },
  };
};
