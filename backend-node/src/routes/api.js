import { Router } from "express";
import healthRoutes from "./api-health.js";
import topicRoutes from "./api-topic.js";
import sessionRoutes from "./api-session.js";
import analyzeRoutes from "./api-analyze.js";
import userRoutes from "./api-user.js";
const router = Router();

router.use("/health", healthRoutes);
router.use("/topics", topicRoutes);
router.use("/sessions", sessionRoutes);
router.use("/users", userRoutes);
router.use("/", analyzeRoutes);

export default router;
