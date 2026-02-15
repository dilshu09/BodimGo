import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Plus,
  X,
  PieChart
} from "lucide-react";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link } from 'react-router-dom';

const API_URL = "http://localhost:5000/api";

export default function FinanceDashboard() {
  const [statsData, setStatsData] = useState({
    currentMonthRevenue: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    category: 'Utility',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [otherCategory, setOtherCategory] = useState('');

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, historyRes, expensesRes] = await Promise.all([
        axios.get(`${API_URL}/payments/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/payments/history`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/expenses`, { headers: { Authorization: `Bearer ${token}` } }) // Fetch expenses for recent transactions mix
      ]);

      setStatsData(statsRes.data);

      // Mix Payments and Expenses for Recent Transactions
      const payments = historyRes.data.map(tx => ({
        id: tx._id,
        type: "Income",
        description: `Payment from ${tx.payer?.name || 'Tenant'}`,
        amount: tx.amount,
        date: new Date(tx.createdAt),
        status: 'Completed'
      }));

      const expenses = expensesRes.data.map(ex => ({
        id: ex._id,
        type: "Expense",
        description: ex.description,
        amount: ex.amount,
        date: new Date(ex.date),
        status: 'Completed'
      }));

      // Merge and sort by date descending
      const allTx = [...payments, ...expenses].sort((a, b) => b.date - a.date).slice(0, 5);

      setRecentTransactions(allTx.map(tx => ({
        ...tx,
        date: tx.date.toLocaleDateString(),
        amount: tx.type === 'Income' ? `+Rs. ${tx.amount.toLocaleString()}` : `-Rs. ${tx.amount.toLocaleString()}`
      })));

      setLoading(false);
    } catch (error) {
      console.error("Error fetching finance data:", error);
      toast.error("Failed to load finance dashboard");
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description) return toast.error("Fill required fields");

    let finalDescription = expenseForm.description;
    if (expenseForm.category === 'Other') {
      if (!otherCategory) return toast.error("Please specify the 'Other' category");
      finalDescription = `[${otherCategory}] ${expenseForm.description}`;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/expenses`, {
        ...expenseForm,
        description: finalDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Expense added successfully");
      setShowExpenseModal(false);
      setExpenseForm({ category: 'Utility', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      setOtherCategory('');
      fetchFinanceData(); // Refresh stats
    } catch (error) {
      console.error(error);
      toast.error("Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    {
      label: "Total Revenue (This Month)",
      value: statsData.currentMonthRevenue.toLocaleString(),
      change: "Current",
      icon: DollarSign,
      trend: "up",
      bg: "bg-blue-50",
      textColor: "text-blue-600",
      hoverBorder: "hover:border-blue-500",
      hoverText: "group-hover:text-blue-600",
    },
    {
      label: "Total Expenses",
      value: statsData.totalExpenses.toLocaleString(),
      change: "All Time",
      icon: TrendingDown,
      trend: "down",
      bg: "bg-red-50",
      textColor: "text-primary",
      hoverBorder: "hover:border-primary",
      hoverText: "group-hover:text-primary",
    },
    {
      label: "Net Profit",
      value: statsData.netProfit.toLocaleString(),
      change: "Revenue - Expenses",
      icon: TrendingUp,
      trend: statsData.netProfit >= 0 ? "up" : "down",
      bg: statsData.netProfit >= 0 ? "bg-green-50" : "bg-red-50",
      textColor: statsData.netProfit >= 0 ? "text-green-600" : "text-primary",
      hoverBorder: statsData.netProfit >= 0 ? "hover:border-green-500" : "hover:border-primary",
      hoverText: statsData.netProfit >= 0 ? "group-hover:text-green-600" : "group-hover:text-primary",
    },
    {
      label: "Visual Breakdown",
      value: "Expenses",
      change: "View Chart",
      icon: PieChart,
      trend: "none",
      bg: "bg-purple-50",
      textColor: "text-purple-600",
      hoverBorder: "hover:border-purple-500",
      hoverText: "group-hover:text-purple-600",
    },
  ];

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Finance Dashboard</h2>
          <p className="text-slate-600 mt-1">
            Your financial overview and transactions
          </p>
        </div>
        <button
          onClick={() => setShowExpenseModal(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <TrendingDown size={18} /> Record Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`${stat.bg} rounded-xl p-6 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl ${stat.hoverBorder} hover:-translate-y-1 group`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
                  {stat.label}
                </p>
                <p className={`text-2xl font-black text-slate-900 mt-2 tracking-tight ${stat.hoverText} transition-colors`}>
                  {typeof stat.value === 'string' && stat.value.includes('Expenses') ? stat.value : `Rs. ${stat.value}`}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg bg-white/60 ${stat.textColor} group-hover:scale-110 transition-transform shadow-sm`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div
              className={`text-xs font-bold uppercase tracking-wider ${stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-primary" : "text-slate-500"}`}
            >
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-900">
                Recent Transactions
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'Income' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-primary'}`}>
                      {tx.type === 'Income' ? <DollarSign size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                        {tx.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{tx.date} • {tx.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${tx.type === "Income" ? "text-green-600" : "text-primary"}`}
                    >
                      {tx.amount}
                    </p>
                    <span className="text-xs font-medium text-slate-400">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3"><AlertCircle size={20} /></div>
                  <p>No transactions found recently.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit sticky top-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link to="/finance/invoices" className="block w-full text-center px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm hover:shadow">
              View Invoices
            </Link>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-sm flex justify-center items-center gap-2 shadow-sm"
            >
              <TrendingDown size={16} /> Record Expense
            </button>
            <Link to="/finance/reports" className="block w-full text-center px-4 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm">
              View & Export Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Record New Expense</h3>
              <button onClick={() => setShowExpenseModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expense Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option>Utility</option>
                  <option>Maintenance</option>
                  <option>Repair</option>
                  <option>Cleaning</option>
                  <option>Internet</option>
                  <option>Other</option>
                </select>
              </div>

              {expenseForm.category === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specify Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Gardener, Security"
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Broken Tap Repair"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (LKR)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Recording...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
