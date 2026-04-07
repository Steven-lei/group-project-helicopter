import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  return ok(res, { status: "ok", service: "moodpal-backend" });
});

export default router;
