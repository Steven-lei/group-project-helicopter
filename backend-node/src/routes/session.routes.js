import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
  createSession,
  endSession,
  getSessionResults,
} from "../controllers/session.controller.js";
import { Session } from "../models/Session.js";
import { ok, fail } from "../utils/response.js";

const router = Router();
router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find({}).sort({
      createdAt: -1,
    });
    return ok(res, sessions || []);
  } catch (error) {
    return fail(res, error.message || "Failed to get sessions", 500);
  }
});
router.post("/", asyncHandler(createSession));
router.patch("/:sessionId/end", asyncHandler(endSession));
router.get("/:sessionId/results", asyncHandler(getSessionResults));

export default router;
