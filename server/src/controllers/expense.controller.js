import Expense from '../models/Expense.js';

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private (Provider)
export const addExpense = async (req, res) => {
    try {
        const { category, description, amount, date, receiptUrl } = req.body;

        const expense = new Expense({
            provider: req.user._id,
            category,
            description,
            amount,
            date: date || new Date(),
            receiptUrl
        });

        await expense.save();

        res.status(201).json(expense);
    } catch (error) {
        console.error("Add Expense Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all expenses for provider
// @route   GET /api/expenses
// @access  Private (Provider)
export const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ provider: req.user._id })
            .sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        console.error("Get Expenses Error:", error);
        res.status(500).json({ message: error.message });
    }
};
