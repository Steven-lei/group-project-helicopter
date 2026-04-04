import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import apiRoutes from "./routes/api.js";

import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

export function createApp({ clientOrigin, uploadDir }) {
  const app = express();

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.use(cors({ origin: clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/uploads", express.static(path.resolve(uploadDir)));

  // Import and use our application routes.
  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
