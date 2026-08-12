import { Router } from "express";
import * as authController from "../controllers/auth";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

// POST /auth/login — anyone
router.post("/login", asyncHandler(authController.login));

// POST /auth/register — admin only
router.post("/register", authenticate, authorize(["ADMIN"]), asyncHandler(authController.register));

export default router;
