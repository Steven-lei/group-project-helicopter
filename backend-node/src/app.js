import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import apiRoutes from "./routes/api.js";
import { whitelist } from "../config/whiltelist.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

export function createApp({ clientOrigin, uploadDir }) {
  const app = express();

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  console.log("cors allowing from", whitelist);
  const corsOption = {
    origin: function (origin, callback) {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  };
  app.use(cors(corsOption));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/uploads", express.static(path.resolve(uploadDir)));

  // Import and use our application routes.
  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
