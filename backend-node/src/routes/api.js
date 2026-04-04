import { Router } from "express";
import healthRoutes from "./health.routes.js";
import topicRoutes from "./api-topic.js";
import sessionRoutes from "./session.routes.js";
import analyzeRoutes from "./analyze.routes.js";
import userRoutes from "./api-user.js";
const router = Router();

router.use("/health", healthRoutes);
router.use("/topics", topicRoutes);
router.use("/sessions", sessionRoutes);
router.use("/users", userRoutes);
router.use("/", analyzeRoutes);

export default router;
