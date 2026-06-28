import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import * as authService from "../services/auth.service";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/response";

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = registerSchema.parse(req.body);
    const user = await authService.register(body);
    sendSuccess(res, "Registration successful", user, 201);
  } catch (err) {
    if (err instanceof ZodError) next(new AppError(err.errors[0].message, 422));
    else next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);
    sendSuccess(res, "Login successful", result);
  } catch (err) {
    if (err instanceof ZodError) next(new AppError(err.errors[0].message, 422));
    else next(err);
  }
};

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getById(req.user!.id);
    sendSuccess(res, "Authenticated user", user);
  } catch (err) {
    next(err);
  }
};
