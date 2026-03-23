import express from "express";
import chalk from "chalk";
import { authMiddleware } from "../../midware/auth.js";
import { pool } from "../../db/db.js";
const router = express.Router();

//for debugging, should be protected by authentication middleware
router.get("/", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    console.log(chalk.green("✅ Connected to mysql!"));
    const [rows] = await connection.query("show tables");
    connection.release();
    const tableNames = rows.map((row) => Object.values(row)[0]);
    res.status(200).json({
      success: true,
      count: tableNames.length,
      tables: tableNames,
    });
  } catch (err) {
    console.error(chalk.red("❌ [DB] connect failed!"));
    console.error(chalk.red("errcode:", err.code));
    console.error(chalk.red("errmsg:", err.message));
    res.status(500).json({
      success: false,
      error: "Database connection failed",
      details: err.message,
    });
  }
});

export default router;
