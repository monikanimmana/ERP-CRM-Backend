import { Router } from "express";
import * as customerController from "../controllers/customer";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /customers — ADMIN and SALES can create
router.post("/", authorize(["ADMIN", "SALES"]), asyncHandler(customerController.create));

// GET /customers — all authenticated users can VIEW (read-only)
router.get("/", asyncHandler(customerController.list));

// GET /customers/:id — all can view (read-only)
router.get("/:id", asyncHandler(customerController.getById));

// PUT /customers/:id — ADMIN and SALES can edit
router.put("/:id", authorize(["ADMIN", "SALES"]), asyncHandler(customerController.update));

// POST /customers/:id/notes — ADMIN and SALES can add notes
router.post("/:id/notes", authorize(["ADMIN", "SALES"]), asyncHandler(customerController.addNote));

export default router;
