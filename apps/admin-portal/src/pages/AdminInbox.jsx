import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
    const location = useLocation();

    const getPriorityColor = (p) => {
        switch (p) {
            case 'urgent': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-blue-600 bg-blue-100';
            case 'medium': return 'text-blue-600 bg-blue-100';
            case 'in_progress': return 'text-purple-600 bg-purple-100';
            default: return 'text-slate-600 bg-slate-100';
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        if (location.state?.ticketId && tickets.length > 0) {
            const t = tickets.find(t => t._id === location.state.ticketId);
            if (t) {
                setSelectedTicket(t);
                // Auto-mark as in_progress if open
                if (t.status === 'open') {
                    markAsInProgress(t._id);
                }
            }
        }
    }, [tickets, location.state]);

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

    const markAsInProgress = async (id) => {
        try {
            await api.put(`/tickets/admin/${id}`, { status: 'in_progress' });
            // Update local state to reflect change immediately
            setTickets(prev => prev.map(t => t._id === id ? { ...t, status: 'in_progress' } : t));
        } catch (error) {
            console.error("Failed to mark as in_progress", error);
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
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Support Inbox</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage provider inquiries and support tickets</p>
                </div>
                {/* Compose removed: Admin usually replies, but could add create ticket feature if needed */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
                {/* Ticket List */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex gap-2 overflow-x-auto scrollbar-thin">
                        {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${filter === f ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2 scrollbar-thin">
                        {loading && (
                            <div className="text-center p-8 text-slate-400 text-sm">Loading tickets...</div>
                        )}
                        {!loading && filteredTickets.length === 0 && (
                            <div className="text-center p-8 text-slate-400 text-sm">No tickets found</div>
                        )}
                        {!loading && filteredTickets.map(ticket => (
                            <div
                                key={ticket._id}
                                onClick={() => {
                                    setSelectedTicket(ticket);
                                    if (ticket.status === 'open') markAsInProgress(ticket._id);
                                }}
                                className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedTicket?._id === ticket._id ? 'bg-[#FF385C]/5 border-[#FF385C]/20 shadow-sm dark:bg-[#FF385C]/10' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className={`font-bold text-sm mb-1 ${selectedTicket?._id === ticket._id ? 'text-[#FF385C]' : 'text-slate-800 dark:text-white'}`}>{ticket.subject}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ticket.message}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">{ticket.provider?.name || 'Unknown'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ticket Detail / Reply Area */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                    {selectedTicket ? (
                        <>
                            <div className="flex-1 overflow-y-auto p-6 border-b border-slate-200 dark:border-slate-800 scrollbar-thin min-h-0">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h2>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            <span>From: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedTicket.provider?.name}</span></span>
                                            <span className="text-xs">({selectedTicket.provider?.email})</span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${selectedTicket.status === 'open' ? 'bg-green-100 text-green-700' :
                                        selectedTicket.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {selectedTicket.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedTicket.message}
                                </div>
                                {selectedTicket.adminResponse && (
                                    <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm">
                                        <p className="font-bold mb-1 flex items-center gap-2"><CheckCircle size={14} /> Admin Response:</p>
                                        {selectedTicket.adminResponse}
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0 bg-slate-50 dark:bg-slate-800/50 p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                                <form onSubmit={handleReply} className="flex flex-col">
                                    <label className="text-sm font-bold text-slate-700 mb-2">Reply to Provider</label>
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:ring-2 focus:ring-[#FF385C] outline-none dark:bg-slate-900 dark:text-white h-32"
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
                                            className="px-6 py-2 bg-[#FF385C] text-white font-bold rounded-lg hover:bg-[#e02e4d] flex items-center gap-2 transform active:scale-95 transition-all"
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
