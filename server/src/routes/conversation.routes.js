import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    getConversations,
    getMessages,
    sendMessage,
    createConversation
} from '../controllers/conversation.controller.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getConversations)
    .post(createConversation);

router.route('/:id/messages')
    .get(getMessages)
    .post(sendMessage);

export default router;
