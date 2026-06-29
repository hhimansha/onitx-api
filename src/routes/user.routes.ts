import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import * as userController from "../controllers/user.controller";

const router = Router();

router.use(authenticate);

router.get("/", authorize(["ADMIN"]), userController.getUsers);
router.get("/options", userController.getUserOptions);
router.get("/me", userController.getMe);
router.put("/me", userController.updateMe);

export default router;
