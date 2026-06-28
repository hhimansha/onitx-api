import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import * as taskController from "../controllers/task.controller";
import commentRoutes from "./comment.routes";

const router = Router();

router.use(authenticate);

router.get("/", taskController.getTasks);
router.get("/:id", taskController.getTaskById);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

router.use("/:taskId/comments", commentRoutes);

export default router;
