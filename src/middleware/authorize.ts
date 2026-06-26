import { NextFunction, Response } from "express";
import { AppError } from "./errorHandler";
import { AuthenticatedRequest, UserRole } from "../types";

export const authorize =
  (roles: UserRole[]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError("Forbidden", 403));
      return;
    }
    next();
  };
