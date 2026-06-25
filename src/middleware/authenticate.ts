import { NextFunction, Response } from "express";
import { AppError } from "./errorHandler";
import { verifyToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../types";

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(new AppError("Unauthorized", 401));
    return;
  }

  try {
    req.user = verifyToken(authHeader.slice(7));
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
};
