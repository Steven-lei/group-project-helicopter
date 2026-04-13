import dotenv from "dotenv";
import { connectDb } from "../config/db.js";
import { createApp } from "./app.js";

dotenv.config();

const port = Number(process.env.PORT || 5001);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const uploadDir = process.env.UPLOAD_DIR || "./uploads";

async function start() {
  await connectDb(process.env.MONGODB_URI);

  const app = createApp({ clientOrigin, uploadDir });

  app.listen(port, () => {
    console.log(`MoodPal backend listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
