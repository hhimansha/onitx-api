import { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler";

export const notFound = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};
