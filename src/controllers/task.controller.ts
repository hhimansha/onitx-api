import { NextFunction, Response } from "express";
import { ZodError } from "zod";
import { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";
import { createTaskSchema, updateTaskSchema } from "../validators/task.validator";
import * as taskService from "../services/task.service";
import { sendSuccess } from "../utils/response";

const user = (req: AuthenticatedRequest) => {
  if (!req.user) throw new AppError("Unauthorized", 401);
  return req.user;
};

const taskId = (req: AuthenticatedRequest): string => String(req.params.id);

export const getTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, role } = user(req);
    const tasks = await taskService.getTasks(id, role);
    sendSuccess(res, "Tasks retrieved", tasks);
  } catch (err) {
    next(err);
  }
};

export const getTaskById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, role } = user(req);
    const task = await taskService.getTaskById(taskId(req), id, role);
    sendSuccess(res, "Task retrieved", task);
  } catch (err) {
    next(err);
  }
};

export const createTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = user(req);
    const body = createTaskSchema.parse(req.body);
    const task = await taskService.createTask(body, id);
    sendSuccess(res, "Task created", task, 201);
  } catch (err) {
    if (err instanceof ZodError) {
      next(new AppError(err.errors[0].message, 422));
    } else {
      next(err);
    }
  }
};

export const updateTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, role } = user(req);
    const body = updateTaskSchema.parse(req.body);
    const task = await taskService.updateTask(taskId(req), body, id, role);
    sendSuccess(res, "Task updated", task);
  } catch (err) {
    if (err instanceof ZodError) {
      next(new AppError(err.errors[0].message, 422));
    } else {
      next(err);
    }
  }
};

export const deleteTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, role } = user(req);
    await taskService.deleteTask(taskId(req), id, role);
    sendSuccess(res, "Task deleted");
  } catch (err) {
    next(err);
  }
};
