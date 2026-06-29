import { NextFunction, Response } from "express";
import { ZodError } from "zod";
import { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";
import * as userService from "../services/user.service";
import { updateProfileSchema, userListQuerySchema } from "../validators/user.validator";
import { sendSuccess } from "../utils/response";

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = userListQuerySchema.parse(req.query);
    const users = await userService.getUserList(query);
    sendSuccess(res, "Users retrieved", users);
  } catch (err) {
    if (err instanceof ZodError) next(new AppError(err.errors[0].message, 422));
    else next(err);
  }
};

export const getUserOptions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const options = await userService.getUserOptions(req.user!.role);
    sendSuccess(res, "User options retrieved", options);
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await userService.getMe(req.user!.id);
    sendSuccess(res, "Profile retrieved", user);
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = updateProfileSchema.parse(req.body);
    const user = await userService.updateMe(req.user!.id, body);
    sendSuccess(res, "Profile updated", user);
  } catch (err) {
    if (err instanceof ZodError) next(new AppError(err.errors[0].message, 422));
    else next(err);
  }
};
