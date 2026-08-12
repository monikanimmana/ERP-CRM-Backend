import { Router } from "express";
import * as challanController from "../controllers/challan";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /challans — ADMIN and SALES can create (as DRAFT)
router.post("/", authorize(["ADMIN", "SALES"]), asyncHandler(challanController.create));

// GET /challans — all authenticated users can VIEW (read-only)
router.get("/", asyncHandler(challanController.list));

// GET /challans/:id — all can view (read-only)
router.get("/:id", asyncHandler(challanController.getById));

// PUT /challans/:id/confirm — WAREHOUSE and ADMIN only (STOCK DEDUCTION HAPPENS HERE)
router.put("/:id/confirm", authorize(["WAREHOUSE", "ADMIN"]), asyncHandler(challanController.confirm));

// PUT /challans/:id/cancel — ADMIN, SALES, and WAREHOUSE (STOCK REVERSAL if was CONFIRMED)
router.put("/:id/cancel", authorize(["WAREHOUSE", "ADMIN", "SALES"]), asyncHandler(challanController.cancel));

export default router;
