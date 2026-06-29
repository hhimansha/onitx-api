import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  designation: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable(),
});

export const userListQuerySchema = z.object({
  q: z.string().optional(),
  sortBy: z.enum(["name", "email", "createdAt", "taskCount"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
