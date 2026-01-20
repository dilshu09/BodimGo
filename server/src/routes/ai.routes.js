import express from 'express';
import { validateText, verifyLocation, validateImages, generateAgreement } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/validate-text', protect, validateText);
router.post('/verify-location', protect, verifyLocation);
router.post('/validate-images', protect, validateImages);
router.post('/generate-agreement', protect, generateAgreement);

export default router;
