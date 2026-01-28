"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
} from "lucide-react";

const stats = [
  {
    label: "Total Revenue (This Month)",
    value: "675,000",
    change: "+12.5%",
    icon: DollarSign,
    trend: "up",
    bg: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    label: "Total Expenses",
    value: "125,000",
    change: "-5.2%",
    icon: TrendingDown,
    trend: "down",
    bg: "bg-red-50",
    textColor: "text-red-600",
  },
  {
    label: "Net Profit",
    value: "550,000",
    change: "+18.3%",
    icon: TrendingUp,
    trend: "up",
    bg: "bg-green-50",
    textColor: "text-green-600",
  },
  {
    label: "Outstanding Payments",
    value: "65,000",
    change: "From 2 tenants",
    icon: AlertCircle,
    trend: "none",
    bg: "bg-yellow-50",
    textColor: "text-yellow-600",
  },
];

const recentTransactions = [
  {
    id: 1,
    type: "Income",
    description: "Rent - Room 102 (Ahmed Khan)",
    amount: "+35,000",
    date: "2024-01-10",
    status: "Completed",
  },
  {
    id: 2,
    type: "Income",
    description: "Rent - Room 105 (Fatima Ahmed)",
    amount: "+45,000",
    date: "2024-01-08",
    status: "Completed",
  },
  {
    id: 3,
    type: "Expense",
    description: "Water & Electricity Bill",
    amount: "-25,000",
    date: "2024-01-07",
    status: "Completed",
  },
  {
    id: 4,
    type: "Income",
    description: "Rent - Room 301 (Sara Khan)",
    amount: "+35,000",
    date: "2024-01-12",
    status: "Completed",
  },
  {
    id: 5,
    type: "Expense",
    description: "Maintenance - Room 104",
    amount: "-8,000",
    date: "2024-01-06",
    status: "Pending",
  },
];

export default function FinanceDashboard() {
  return (
    <div className="max-w-7xl mx-auto">
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
                      className={`text-xs font-semibold px-2 py-1 rounded mt-1 inline-block ${
                        tx.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
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
