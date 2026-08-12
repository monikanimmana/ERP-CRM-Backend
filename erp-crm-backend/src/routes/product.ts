import { Router } from "express";
import * as productController from "../controllers/product";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /products — ADMIN only (product master data creation)
router.post("/", authorize(["ADMIN"]), asyncHandler(productController.create));

// GET /products — all authenticated users can VIEW (read-only)
router.get("/", asyncHandler(productController.list));

// GET /products/:id — all can view (read-only)
router.get("/:id", asyncHandler(productController.getById));

// PUT /products/:id — ADMIN only (product master data editing)
router.put("/:id", authorize(["ADMIN"]), asyncHandler(productController.update));

// GET /products/:id/stock-log — all can view stock history (read-only)
router.get("/:id/stock-log", asyncHandler(productController.getStockLog));

// POST /products/:id/stock-adjust — WAREHOUSE and ADMIN only (stock movement recording)
router.post("/:id/stock-adjust", authorize(["WAREHOUSE", "ADMIN"]), asyncHandler(productController.stockAdjust));

export default router;
