import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Download, Printer, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = "http://localhost:5000/api";
const COLORS = ['#FF385C', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [loading, setLoading] = useState(false);

  // Monthly State
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState(null);

  // Annual State
  const [annualYear, setAnnualYear] = useState(new Date().getFullYear());
  const [annualData, setAnnualData] = useState(null);

  useEffect(() => {
    if (activeTab === 'monthly') fetchMonthlyReport();
    else fetchAnnualReport();
  }, [activeTab, month, year, annualYear]);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/finance/monthly?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMonthlyData(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load monthly report");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnualReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/finance/annual?year=${annualYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnualData(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load annual report");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const title = activeTab === 'monthly'
      ? `Monthly Financial Report - ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`
      : `Annual Financial Report - ${annualYear}`;

    doc.setFontSize(18);
    doc.text(title, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    if (activeTab === 'monthly' && monthlyData) {
      // Summary Table
      autoTable(doc, {
        startY: 40,
        head: [['Metric', 'Amount (Rs.)']],
        body: [
          ['Total Income', monthlyData.summary.totalIncome.toLocaleString()],
          ['Total Expenses', monthlyData.summary.totalExpenses.toLocaleString()],
          ['Net Profit', monthlyData.summary.netProfit.toLocaleString()]
        ],
        theme: 'striped',
        headStyles: { fillColor: [255, 56, 92] } // Primary Color
      });

      // Expense Breakdown
      if (monthlyData.expenseBreakdown.length > 0) {
        doc.text("Expense Breakdown", 14, doc.lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Category', 'Count', 'Amount (Rs.)', '%']],
          body: monthlyData.expenseBreakdown.map(item => [
            item.category,
            item.count,
            item.amount.toLocaleString(),
            item.percentage + '%'
          ]),
          theme: 'grid'
        });
      }
    } else if (activeTab === 'annual' && annualData) {
      // Annual Summary
      autoTable(doc, {
        startY: 40,
        head: [['Month', 'Income', 'Expense', 'Profit']],
        body: annualData.monthlyData.map(m => [
          m.month,
          m.income.toLocaleString(),
          m.expense.toLocaleString(),
          m.profit.toLocaleString()
        ]),
        theme: 'striped',
        headStyles: { fillColor: [255, 56, 92] }
      });

      // Year Totals
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text(`Total Income: Rs. ${annualData.summary.totalIncome.toLocaleString()}`, 14, finalY);
      doc.text(`Total Expenses: Rs. ${annualData.summary.totalExpenses.toLocaleString()}`, 14, finalY + 7);
      doc.text(`Net Profit: Rs. ${annualData.summary.netProfit.toLocaleString()}`, 14, finalY + 14);
    }

    doc.save(`BodimGo_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Report downloaded");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Reports</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Analyze your earnings and expenses</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'monthly' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setActiveTab('annual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'annual' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Annual Report
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {activeTab === 'monthly' ? (
            <>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" />
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-primary text-slate-800 dark:text-white">
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-primary text-slate-800 dark:text-white">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <select value={annualYear} onChange={(e) => setAnnualYear(Number(e.target.value))} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-primary text-slate-800 dark:text-white">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-sm shadow-sm cursor-pointer">
          <Download size={18} /> Export PDF
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading report data...</div>
      ) : (
        <>
          {/* Monthly View */}
          {activeTab === 'monthly' && monthlyData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Income</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">Rs. {monthlyData.summary.totalIncome.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold text-primary mt-2">Rs. {monthlyData.summary.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Net Profit</p>
                  <p className={`text-2xl font-bold mt-2 ${monthlyData.summary.netProfit >= 0 ? 'text-slate-900 dark:text-white' : 'text-primary'}`}>
                    Rs. {monthlyData.summary.netProfit.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Chart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Expense Distribution</h3>
                  {monthlyData.summary.totalExpenses > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={monthlyData.expenseBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="amount"
                          >
                            {monthlyData.expenseBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">No expenses recorded</div>
                  )}
                </div>

                {/* Breakdown List */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Expenses</h3>
                  <div className="space-y-4">
                    {monthlyData.expenseBreakdown.map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{item.category}</span>
                          <span className="text-slate-900 dark:text-white font-bold">Rs. {item.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.count} transaction(s) • {item.percentage}% of total</p>
                      </div>
                    ))}
                    {monthlyData.expenseBreakdown.length === 0 && (
                      <p className="text-slate-400 text-center py-8">No expenses to display</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Annual View */}
          {activeTab === 'annual' && annualData && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Annual Performance ({annualData.year})</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={annualData.monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Rs.${value / 1000}k`} />
                    <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#FF385C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Annual Income</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">Rs. {annualData.summary.totalIncome.toLocaleString()}</p>
                </div>
                <div className="text-center border-l border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Annual Expenses</p>
                  <p className="text-xl font-bold text-primary mt-1">Rs. {annualData.summary.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="text-center border-l border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Net Profit</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">Rs. {annualData.summary.netProfit.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
