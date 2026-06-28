import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types";
import * as dashboardService from "../services/dashboard.service";
import { sendSuccess } from "../utils/response";

export const getStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await dashboardService.getStats(req.user!.id, req.user!.role);
    sendSuccess(res, "Dashboard stats", stats);
  } catch (err) {
    next(err);
  }
};
