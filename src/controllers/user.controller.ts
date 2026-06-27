import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types";
import * as userService from "../services/user.service";
import { sendSuccess } from "../utils/response";

export const getUsers = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userService.getUsers();
    sendSuccess(res, "Users retrieved", users);
  } catch (err) {
    next(err);
  }
};
