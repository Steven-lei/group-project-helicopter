//test connection
import { pool } from "./db.js";
import chalk from "chalk";

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(chalk.green("✅ Connected to mysql!"));
    const [rows] = await connection.query(
      'SELECT "Connection Active" as status',
    );
    console.log(`[DB] db status: ${rows[0].status}`);
    connection.release();
  } catch (err) {
    console.error(chalk.red("❌ [DB] connect failed!"));
    console.error(chalk.red("errcode:", err.code));
    console.error(chalk.red("errmsg:", err.message));
  }
})();
