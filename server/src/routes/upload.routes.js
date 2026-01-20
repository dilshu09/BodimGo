import express from 'express';
import { upload, uploadFile } from '../controllers/upload.controller.js';

const router = express.Router();

// Single file upload
router.post('/', upload.single('image'), uploadFile);

export default router;
