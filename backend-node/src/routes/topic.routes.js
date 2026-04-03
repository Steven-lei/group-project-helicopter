import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { getNextTopic } from '../controllers/topic.controller.js';

const router = Router();

router.get('/next', asyncHandler(getNextTopic));

export default router;
