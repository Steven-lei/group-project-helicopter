import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { analyzeVideo, completeTask } from '../controllers/analyze.controller.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

router.post('/analyze', upload.single('video'), asyncHandler(analyzeVideo));
router.patch('/analyze/:analysisId/tasks/:taskId/complete', asyncHandler(completeTask));

export default router;
