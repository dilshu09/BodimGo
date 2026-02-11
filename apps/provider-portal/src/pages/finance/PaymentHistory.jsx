import React, { useState, useEffect } from "react";
import { Download, ArrowDownLeft, ArrowUpRight, Search, Filter } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5000/api";

export default function PaymentHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'Income', 'Expense'
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const [paymentsRes, expensesRes] = await Promise.all([
                axios.get(`${API_URL}/payments/history`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/expenses`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const payments = paymentsRes.data.map(tx => ({
                id: tx.transactionId || tx._id,
                date: new Date(tx.createdAt),
                description: `Rent from ${tx.payer?.name || 'Unknown'}`,
                subtext: tx.booking?.room?.name ? `Room ${tx.booking.room.name}` : 'Rent Payment',
                type: "Income",
                amount: tx.amount,
                status: tx.status,
                method: tx.method
            }));

            const expenses = expensesRes.data.map(ex => ({
                id: ex._id,
                date: new Date(ex.date),
                description: ex.description,
                subtext: ex.category,
                type: "Expense",
                amount: ex.amount,
                status: 'completed', // Expenses are usually immediate
                method: 'Manual'
            }));

            // Merge and Sort
            const allTransactions = [...payments, ...expenses].sort((a, b) => b.date - a.date);

            setTransactions(allTransactions.map(tx => ({
                ...tx,
                formattedDate: tx.date.toLocaleDateString(),
            })));
            setLoading(false);
        } catch (error) {
            console.error("Error fetching payment history:", error);
            toast.error("Failed to load payment history");
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        return tx.type === filter;
    });

    if (loading) return <div className="p-8 text-center text-slate-500">Loading records...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto" onClick={() => setShowFilterMenu(false)}>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Transaction History</h2>
                    <p className="text-slate-600 mt-2">View your income and expenses in one place</p>
                </div>
                <div className="flex gap-2 relative">
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); }}
                            className={`px-4 py-2 border rounded-lg flex items-center gap-2 font-medium transition-colors ${filter !== 'all' ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                        >
                            <Filter size={18} /> {filter === 'all' ? 'Filter' : filter}
                        </button>

                        {showFilterMenu && (
                            <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-card border border-slate-100 z-10 overflow-hidden">
                                <button onClick={() => setFilter('all')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-slate-700">All Transactions</button>
                                <button onClick={() => setFilter('Income')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-green-600">Income Only</button>
                                <button onClick={() => setFilter('Expense')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium text-primary">Expenses Only</button>
                            </div>
                        )}
                    </div>

                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-medium">
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-6 bg-slate-50 p-4 border-b border-slate-200 text-sm font-semibold text-slate-600">
                    <div className="col-span-2">Description</div>
                    <div>Date</div>
                    <div>Type</div>
                    <div className="text-right">Amount</div>
                    <div className="text-right">Status</div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => (
                        <div key={tx.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-50 transition-colors">
                            <div className="col-span-2">
                                <p className="font-bold text-slate-900">{tx.description}</p>
                                <p className="text-xs text-slate-500">{tx.subtext}</p>
                            </div>
                            <div className="text-sm text-slate-600">{tx.formattedDate}</div>
                            <div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${tx.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-primary'
                                    }`}>
                                    {tx.type}
                                </span>
                            </div>
                            <div className={`font-bold text-right ${tx.type === 'Income' ? 'text-green-600' : 'text-primary'
                                }`}>
                                {tx.type === 'Income' ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold capitalize ${tx.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                                    }`}>
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <div className="p-8 text-center text-slate-500">No transactions found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

