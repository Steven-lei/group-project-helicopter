import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createSession,
  endSession,
  getSessionResults
} from '../controllers/session.controller.js';

const router = Router();

router.post('/', asyncHandler(createSession));
router.patch('/:sessionId/end', asyncHandler(endSession));
router.get('/:sessionId/results', asyncHandler(getSessionResults));

export default router;
