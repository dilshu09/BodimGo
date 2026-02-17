import React, { useState, useEffect } from "react";
import {
    Calendar,
    MapPin,
    User,
    Check,
    X,
    Clock,
    Filter,
    Loader2,
    MessageSquare,
    Send,
    Camera,
    Eye
} from "lucide-react";
import api from "../../services/api";

export default function Viewings() {
    const [viewings, setViewings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedViewingId, setSelectedViewingId] = useState(null);
    const [replyMessage, setReplyMessage] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        fetchViewings();
    }, []);

    const fetchViewings = async () => {
        try {
            const res = await api.get('/viewing-requests');
            setViewings(res.data);
        } catch (err) {
            console.error("Failed to fetch viewings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/viewing-requests/${id}/status`, { status });
            // Optimistic update or refetch
            setViewings(prev => prev.map(v => v._id === id ? { ...v, status } : v));
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update status");
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        setSendingReply(true);
        try {
            await api.post(`/viewing-requests/${selectedViewingId}/reply`, { message: replyMessage });
            setViewings(prev => prev.map(v => v._id === selectedViewingId ? { ...v, providerReply: replyMessage } : v));
            setReplyModalOpen(false);
            setReplyMessage("");
            alert("Reply sent successfully!");
        } catch (err) {
            console.error("Failed to send reply", err);
            alert("Failed to send reply");
        } finally {
            setSendingReply(false);
        }
    };

    const openReplyModal = (id) => {
        setSelectedViewingId(id);
        setReplyMessage("");
        setReplyModalOpen(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed": return "bg-green-100 text-green-700";
            case "cancelled": return "bg-red-100 text-red-700";
            default: return "bg-yellow-100 text-yellow-700";
        }
    };

    const filteredViewings = viewings.filter(v =>
        filter === "all" ? true : v.status === filter
    );

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#E51D54]" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Viewing Requests</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your property viewing appointments</p>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    {["all", "pending", "confirmed", "cancelled"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium capitalize text-sm transition-colors ${filter === f
                                ? "bg-slate-900 text-white dark:bg-primary"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredViewings.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">No viewing requests found.</div>
                ) : filteredViewings.map((viewing) => (
                    <div key={viewing._id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(viewing.status)}`}>
                                    {viewing.status}
                                </span>
                                <div className="text-slate-400">
                                    <Calendar size={20} />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{viewing.listing?.title || 'Unknown Property'}</h3>
                            <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm mb-4">
                                <User size={16} className="mr-2" />
                                {viewing.seeker?.name || 'Unknown User'}
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 py-4 space-y-3">
                                <div className="flex items-center text-slate-700 dark:text-slate-300">
                                    <Clock size={18} className="mr-3 text-slate-400" />
                                    <span className="font-medium">{viewing.date} at {viewing.time}</span>
                                </div>
                                <div className="flex items-center text-slate-700 dark:text-slate-300">
                                    <MapPin size={18} className="mr-3 text-slate-400" />
                                    <span className="text-sm truncate">Request from Web App</span>
                                </div>
                                {viewing.note && (
                                    <div className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-400 italic">
                                        "{viewing.note}"
                                    </div>
                                )}
                            </div>

                            {viewing.status === "pending" && (
                                <div className="flex gap-3 mt-2">
                                    <button
                                        onClick={() => handleStatusUpdate(viewing._id, 'confirmed')}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                                        <Check size={16} /> Accept
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(viewing._id, 'cancelled')}
                                        className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20">
                                        <X size={16} /> Decline
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => openReplyModal(viewing._id)}
                                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm mt-3 w-full dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                                <MessageSquare size={16} /> {viewing.providerReply ? "View/Send Reply" : "Reply to Seeker"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {replyModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-neutral-200 dark:border-slate-800">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Reply to Seeker</h3>
                            <button onClick={() => setReplyModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleReplySubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E51D54] min-h-[120px] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    placeholder="Type your message here..."
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setReplyModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingReply}
                                    className="px-4 py-2 bg-[#E51D54] text-white rounded-lg font-medium hover:bg-[#d01b4c] transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {sendingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Send Reply
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

