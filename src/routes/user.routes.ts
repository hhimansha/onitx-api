import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import * as userController from "../controllers/user.controller";

const router = Router();

router.use(authenticate);

router.get("/", userController.getUsers);

export default router;
