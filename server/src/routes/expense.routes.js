import express from 'express';
import { addExpense, getExpenses } from '../controllers/expense.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('provider'));

router.post('/', addExpense);
router.get('/', getExpenses);

export default router;
