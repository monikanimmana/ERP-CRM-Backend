import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import authRoutes from "./routes/auth";
import customerRoutes from "./routes/customer";
import productRoutes from "./routes/product";
import challanRoutes from "./routes/challan";

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — allow frontend origin
const allowedOrigins = [
  "http://localhost:3000",      // React dev server
  "http://localhost:5173",      // Vite dev server
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,      // For production
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Request logging (basic)
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────

app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/challans", challanRoutes);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// ─── Error handling ────────────────────────────────────────────────────────

// 404 for undefined routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "not_found", message: "Route not found" });
});

// Centralized error handler — must be last
app.use(errorHandler);

// ─── Server startup ───────────────────────────────────────────────────────

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
