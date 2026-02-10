import express from 'express';
import { createTicket, getMyTickets, getAllTickets, updateTicket } from '../controllers/ticket.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Provider Routes
router.post('/', protect, createTicket);
router.get('/', protect, getMyTickets);

// Admin Routes (Note: Prefix /admin/tickets via server.js or explicit path here)
// Current plan: server.js uses /api/tickets. 
// We should split or check role. For simplicity, let's keep all here but protect admin routes.

router.get('/admin/all', protect, authorize('admin'), getAllTickets);
router.put('/admin/:id', protect, authorize('admin'), updateTicket);

export default router;
