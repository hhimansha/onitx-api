import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import * as authService from "../services/auth.service";
import {
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator";
import { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/response";

const parseOrFail = <T>(schema: { parse: (v: unknown) => T }, body: unknown, next: NextFunction): T | null => {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) next(new AppError(err.errors[0].message, 422));
    else next(err);
    return null;
  }
};

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

export const googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = googleAuthSchema.parse(req.body);
    const result = await authService.googleAuth(body.idToken);
    sendSuccess(res, "Google login successful", result);
  } catch (err) {
    if (err instanceof ZodError) next(new AppError(err.errors[0].message, 422));
    else next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(body);
    // Always respond with success to prevent email enumeration
    sendSuccess(res, "If that email exists, a reset link has been sent");
  } catch (err) {
    if (err instanceof ZodError) next(new AppError(err.errors[0].message, 422));
    else next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(body);
    sendSuccess(res, "Password reset successful");
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
