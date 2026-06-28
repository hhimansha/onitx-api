import { NextFunction, Response } from "express";
import { ZodError } from "zod";
import { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";
import { createCommentSchema, updateCommentSchema } from "../validators/comment.validator";
import * as commentService from "../services/comment.service";
import { sendSuccess } from "../utils/response";

const ctx = (req: AuthenticatedRequest) => ({
  userId: req.user!.id,
  role: req.user!.role,
  taskId: String(req.params.taskId),
  commentId: String(req.params.commentId),
});

export const getComments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role, taskId } = ctx(req);
    const comments = await commentService.getComments(taskId, userId, role);
    sendSuccess(res, "Comments retrieved", comments);
  } catch (err) {
    next(err);
  }
};

export const createComment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role, taskId } = ctx(req);
    const { content } = createCommentSchema.parse(req.body);
    const comment = await commentService.createComment(taskId, content, userId, role);
    sendSuccess(res, "Comment added", comment, 201);
  } catch (err) {
    if (err instanceof ZodError) next(new AppError(err.errors[0].message, 422));
    else next(err);
  }
};

export const updateComment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role, commentId } = ctx(req);
    const { content } = updateCommentSchema.parse(req.body);
    const comment = await commentService.updateComment(commentId, content, userId, role);
    sendSuccess(res, "Comment updated", comment);
  } catch (err) {
    if (err instanceof ZodError) next(new AppError(err.errors[0].message, 422));
    else next(err);
  }
};

export const deleteComment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, role, commentId } = ctx(req);
    await commentService.deleteComment(commentId, userId, role);
    sendSuccess(res, "Comment deleted");
  } catch (err) {
    next(err);
  }
};
