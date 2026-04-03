import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import healthRoutes from './routes/health.routes.js';
import topicRoutes from './routes/topic.routes.js';
import sessionRoutes from './routes/session.routes.js';
import analyzeRoutes from './routes/analyze.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

export function createApp({ clientOrigin, uploadDir }) {
  const app = express();

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  app.use(cors({ origin: clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/uploads', express.static(path.resolve(uploadDir)));

  app.use('/api/health', healthRoutes);
  app.use('/api/topics', topicRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api', analyzeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
