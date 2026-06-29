import { z } from "zod";

const priority = z.enum(["LOW", "MEDIUM", "HIGH"]);
const status = z.enum(["OPEN", "IN_PROGRESS", "TESTING", "DONE"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: priority.optional(),
  status: status.optional(),
  dueDate: z.coerce.date().optional().nullable(),
  assignedToIds: z.array(z.string().uuid("Invalid user ID")).optional().default([]),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskQuerySchema = z.object({
  q: z.string().optional(),
  status: status.optional(),
  priority: priority.optional(),
  assignedToId: z.string().uuid("Invalid user ID").optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
