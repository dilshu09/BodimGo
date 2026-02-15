import express from 'express';
import { createViewingRequest, getViewingRequests, updateViewingRequestStatus, replyToViewingRequest } from '../controllers/viewing.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createViewingRequest);
router.get('/', getViewingRequests);
router.put('/:id/status', updateViewingRequestStatus);
router.put('/:id/cancel', (await import('../controllers/viewing.controller.js')).cancelViewingRequest);
router.post('/:id/reply', replyToViewingRequest);

export default router;
