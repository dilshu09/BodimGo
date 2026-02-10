"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

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

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/payments/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/payments/history`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStatsData(statsRes.data);

      // Map history to recent transactions (take first 5)
      setRecentTransactions(historyRes.data.slice(0, 5).map(tx => ({
        id: tx.transactionId || tx._id,
        type: "Income", // Assumption for now
        description: `Payment from ${tx.payer?.name || 'Unknown'}`,
        amount: `+${tx.amount.toLocaleString()}`,
        date: new Date(tx.createdAt).toLocaleDateString(),
        status: tx.status === 'completed' ? 'Completed' : 'Pending'
      })));

      setLoading(false);
    } catch (error) {
      console.error("Error fetching finance data:", error);
      toast.error("Failed to load finance dashboard");
      setLoading(false);
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
    },
    {
      label: "Total Expenses",
      value: statsData.totalExpenses.toLocaleString(),
      change: "0%",
      icon: TrendingDown,
      trend: "down",
      bg: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      label: "Net Profit",
      value: statsData.netProfit.toLocaleString(),
      change: "+100%",
      icon: TrendingUp,
      trend: "up",
      bg: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      label: "Outstanding Payments",
      value: "0",
      change: "All Good",
      icon: AlertCircle,
      trend: "none",
      bg: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
  ];

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Finance Dashboard</h2>
        <p className="text-slate-600 mt-1">
          Your financial overview and transactions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`${stat.bg} rounded-lg p-6 border border-slate-200`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  Rs. {stat.value}
                </p>
              </div>
              <stat.icon size={24} className={stat.textColor} />
            </div>
            <div
              className={`text-sm font-semibold ${stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-red-600" : "text-slate-600"}`}
            >
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                Recent Transactions
              </h3>
            </div>
            <div className="divide-y divide-slate-200">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {tx.description}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${tx.type === "Income" ? "text-green-600" : "text-red-600"}`}
                    >
                      {tx.amount}
                    </p>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded mt-1 inline-block ${tx.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="p-8 text-center text-slate-500">No recent transactions.</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm">
              + Create Invoice
            </button>
            <button className="w-full px-4 py-3 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm">
              View Invoices
            </button>
            <button className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium text-sm">
              Download Report
            </button>
            <button className="w-full px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium text-sm">
              Payment Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
