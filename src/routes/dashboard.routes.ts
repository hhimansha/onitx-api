import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import * as dashboardController from "../controllers/dashboard.controller";

const router = Router();

router.use(authenticate);

router.get("/stats", dashboardController.getStats);

export default router;
