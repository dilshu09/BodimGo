import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Send, CheckCircle, Clock, AlertCircle, Search, Filter, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

// Mock Data


const AdminInbox = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState("");

    const getPriorityColor = (p) => {
        switch (p) {
            case 'urgent': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-blue-600 bg-blue-100';
            default: return 'text-slate-600 bg-slate-100';
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tickets/admin/all');
            setTickets(res.data);
        } catch (error) {
            console.error("Failed to fetch tickets", error);
            // toast.error("Could not load tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/tickets/admin/${selectedTicket._id}`, {
                adminResponse: replyMessage,
                status: 'resolved' // Auto resolve on reply
            });
            toast.success(`Reply sent!`);
            setReplyMessage("");
            setSelectedTicket(null);
            fetchTickets();
        } catch (error) {
            console.error(error);
            toast.error("Failed to send reply");
        }
    };

    // Filter Logic
    const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Support Inbox</h1>
                    <p className="text-slate-500">Manage provider inquiries and support tickets</p>
                </div>
                {/* Compose removed: Admin usually replies, but could add create ticket feature if needed */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
                {/* Ticket List */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-2">
                        {['all', 'open', 'resolved', 'closed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${filter === f ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:bg-white/50'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {loading && (
                            <div className="text-center p-8 text-slate-400 text-sm">Loading tickets...</div>
                        )}
                        {!loading && filteredTickets.length === 0 && (
                            <div className="text-center p-8 text-slate-400 text-sm">No tickets found</div>
                        )}
                        {!loading && filteredTickets.map(ticket => (
                            <div
                                key={ticket._id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedTicket?._id === ticket._id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm mb-1">{ticket.subject}</h3>
                                <p className="text-xs text-slate-500 truncate">{ticket.message}</p>
                                <p className="text-xs text-slate-400 mt-2 font-medium">{ticket.provider?.name || 'Unknown'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ticket Detail / Reply Area */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {selectedTicket ? (
                        <>
                            <div className="p-6 border-b border-slate-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{selectedTicket.subject}</h2>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                            <span>From: <span className="font-semibold text-slate-700">{selectedTicket.provider?.name}</span></span>
                                            <span className="text-xs">({selectedTicket.provider?.email})</span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${selectedTicket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {selectedTicket.status}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedTicket.message}
                                </div>
                                {selectedTicket.adminResponse && (
                                    <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
                                        <p className="font-bold mb-1 flex items-center gap-2"><CheckCircle size={14} /> Admin Response:</p>
                                        {selectedTicket.adminResponse}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 bg-slate-50 p-6">
                                <form onSubmit={handleReply} className="h-full flex flex-col">
                                    <label className="text-sm font-bold text-slate-700 mb-2">Reply to Provider</label>
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        className="flex-1 w-full p-4 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-slate-900 outline-none"
                                        placeholder="Type your response here..."
                                    ></textarea>
                                    <div className="flex justify-end mt-4 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTicket(null)}
                                            className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 flex items-center gap-2"
                                        >
                                            <Send size={16} /> Send Reply
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <MessageSquare size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Select a ticket to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminInbox;
