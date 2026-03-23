import express from "express";
// Adds routes.
import dishes from "./dishes.js";
import dbtest from "./dbtest.js";

const router = express.Router();

router.use("/dishes", dishes);
router.use("/dbtest", dbtest);

export default router;
