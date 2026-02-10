import React, { useState, useEffect } from "react";
import { Download, ArrowDownLeft, ArrowUpRight, Search, Filter } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5000/api";

export default function PaymentHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/payments/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTransactions(res.data.map(tx => ({
                id: tx.transactionId || tx._id,
                date: new Date(tx.createdAt).toLocaleDateString(),
                tenant: tx.payer?.name || "Unknown",
                room: "N/A", // Need to populate room from booking if possible
                type: "Rent", // Defaulting as rent for now
                amount: tx.amount,
                status: tx.status,
                method: tx.method
            })));
            setLoading(false);
        } catch (error) {
            console.error("Error fetching payment history:", error);
            toast.error("Failed to load payment history");
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading payments...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Payment History</h2>
                    <p className="text-slate-600 mt-2">View and download your transaction records</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-medium">
                        <Filter size={18} /> Filter
                    </button>
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-medium">
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-6 bg-slate-50 p-4 border-b border-slate-200 text-sm font-semibold text-slate-600">
                    <div className="col-span-2">Transaction Details</div>
                    <div>Date</div>
                    <div>Type</div>
                    <div>Amount</div>
                    <div className="text-right">Status</div>
                </div>

                <div className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="grid grid-cols-6 p-4 items-center hover:bg-slate-50 transition-colors">
                            <div className="col-span-2">
                                <p className="font-bold text-slate-900">{tx.tenant}</p>
                                <p className="text-xs text-slate-500">{tx.id}</p>
                            </div>
                            <div className="text-sm text-slate-600">{tx.date}</div>
                            <div>
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                                    {tx.type}
                                </span>
                            </div>
                            <div className="font-bold text-slate-900">Rs. {tx.amount.toLocaleString()}</div>
                            <div className="text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold capitalize ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <div className="p-8 text-center text-slate-500">No transactions found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

