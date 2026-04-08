import { Router } from "express";
import { ok } from "../utils/response.js";

const router = Router();

router.get("/", (req, res) => {
  return ok(res, { status: "ok", service: "moodpal-backend" });
});

export default router;
