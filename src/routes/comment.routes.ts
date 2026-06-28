import { Router } from "express";
import * as commentController from "../controllers/comment.controller";

// mergeParams exposes :taskId from the parent task router
const router = Router({ mergeParams: true });

router.get("/", commentController.getComments);
router.post("/", commentController.createComment);
router.put("/:commentId", commentController.updateComment);
router.delete("/:commentId", commentController.deleteComment);

export default router;
