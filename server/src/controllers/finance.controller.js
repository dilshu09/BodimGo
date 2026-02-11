import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';

// @desc    Get Monthly Finance Report
// @route   GET /api/finance/monthly?year=2024&month=2
// @access  Private (Provider)
export const getMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ message: 'Year and Month are required' });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // 1. Aggregated Income
        const incomeStats = await Payment.aggregate([
            {
                $match: {
                    payee: req.user._id,
                    status: 'completed',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalIncome: { $sum: '$amount' }
                }
            }
        ]);

        // 2. Aggregated Expenses
        const expenseStats = await Expense.aggregate([
            {
                $match: {
                    provider: req.user._id,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalExpenses: { $sum: '$amount' }
                }
            }
        ]);

        // 3. Expense Breakdown by Category
        const expenseBreakdown = await Expense.aggregate([
            {
                $match: {
                    provider: req.user._id,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        const totalIncome = incomeStats[0]?.totalIncome || 0;
        const totalExpenses = expenseStats[0]?.totalExpenses || 0;
        const netProfit = totalIncome - totalExpenses;

        res.json({
            period: { year, month },
            summary: {
                totalIncome,
                totalExpenses,
                netProfit
            },
            expenseBreakdown: expenseBreakdown.map(item => ({
                category: item._id,
                amount: item.total,
                count: item.count,
                percentage: totalExpenses > 0 ? Math.round((item.total / totalExpenses) * 100) : 0
            }))
        });

    } catch (error) {
        console.error('Monthly Report Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Annual Finance Report
// @route   GET /api/finance/annual?year=2024
// @access  Private (Provider)
export const getAnnualReport = async (req, res) => {
    try {
        const { year } = req.query;
        if (!year) return res.status(400).json({ message: 'Year is required' });

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        // Group Income by Month
        const incomeByMonth = await Payment.aggregate([
            {
                $match: {
                    payee: req.user._id,
                    status: 'completed',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Group Expense by Month
        const expenseByMonth = await Expense.aggregate([
            {
                $match: {
                    provider: req.user._id,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $month: '$date' },
                    total: { $sum: '$amount' }
                }
            }
        ]);

        // Merge Data
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const monthNum = i + 1;
            const income = incomeByMonth.find(item => item._id === monthNum)?.total || 0;
            const expense = expenseByMonth.find(item => item._id === monthNum)?.total || 0;
            return {
                month: new Date(year, i).toLocaleString('default', { month: 'short' }),
                income,
                expense,
                profit: income - expense
            };
        });

        // Calculate Totals
        const totalIncome = monthlyData.reduce((acc, curr) => acc + curr.income, 0);
        const totalExpenses = monthlyData.reduce((acc, curr) => acc + curr.expense, 0);

        res.json({
            year,
            summary: {
                totalIncome,
                totalExpenses,
                netProfit: totalIncome - totalExpenses
            },
            monthlyData
        });

    } catch (error) {
        console.error('Annual Report Error:', error);
        res.status(500).json({ message: error.message });
    }
};
