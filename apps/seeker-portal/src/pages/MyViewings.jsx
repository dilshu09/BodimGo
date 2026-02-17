import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, MessageSquare, Loader2, Home } from "lucide-react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../components/ConfirmationModal";
import { SkeletonList } from "../components/Skeleton";

export default function MyViewings() {
    const [viewings, setViewings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [viewingToCancel, setViewingToCancel] = useState(null);

    useEffect(() => {
        fetchViewings();
    }, []);

    const fetchViewings = async () => {
        try {
            const res = await api.get('/viewing-requests');
            setViewings(res.data);
        } catch (err) {
            console.error("Failed to fetch viewings", err);
            toast.error("Failed to load viewings");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (id) => {
        setViewingToCancel(id);
        setIsCancelModalOpen(true);
    };

    const confirmCancel = async () => {
        if (!viewingToCancel) return;
        try {
            await api.put(`/viewing-requests/${viewingToCancel}/cancel`);
            toast.success("Viewing request cancelled");
            fetchViewings(); // Refresh list
            setIsCancelModalOpen(false);
            setViewingToCancel(null);
        } catch (err) {
            console.error("Failed to cancel viewing", err);
            toast.error(err.response?.data?.message || "Failed to cancel request");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "confirmed": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
            case "accepted": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
            case "rejected": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
            case "cancelled": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
            default: return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
        }
    };

    if (loading) return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <SkeletonList />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Viewings</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-2">Track the status of your property viewing requests.</p>
                </div>

                {viewings.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-12 text-center transition-colors">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-gray-400 dark:text-slate-500" size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No viewings scheduled</h3>
                        <p className="text-gray-500 dark:text-slate-400 mb-6">You haven't requested any viewings yet.</p>
                        <Link to="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors">
                            Browse Listings
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {viewings.map((viewing) => (
                            <div key={viewing._id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-md dark:hover:shadow-slate-800/50 transition-all">
                                <div className="p-6">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(viewing.status)}`}>
                                                    {viewing.status}
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-slate-500">
                                                    Requested on {new Date(viewing.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                                <Link to={`/listings/${viewing.listing?._id}`} className="hover:text-primary transition-colors">
                                                    {viewing.listing?.title || 'Unknown Property'}
                                                </Link>
                                            </h3>

                                            <div className="flex flex-col sm:flex-row gap-4 mt-3 text-gray-600 dark:text-slate-300 text-sm">
                                                <div className="flex items-center">
                                                    <Clock size={16} className="mr-2 text-primary" />
                                                    <span className="font-medium">{viewing.date} at {viewing.time}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin size={16} className="mr-2 text-primary" />
                                                    <span>{viewing.listing?.location?.city || viewing.listing?.location?.address || 'Location not available'}</span>
                                                </div>
                                            </div>

                                            {viewing.note && (
                                                <div className="mt-4 bg-gray-50 dark:bg-slate-800 p-3 rounded-lg text-sm text-gray-600 dark:text-slate-300">
                                                    <span className="font-semibold block mb-1 text-xs uppercase tracking-wider text-gray-500 dark:text-slate-500">Your Note:</span>
                                                    "{viewing.note}"
                                                </div>
                                            )}

                                            {/* Cancel Button for Pending Requests */}
                                            {viewing.status === 'pending' && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                                                    <button
                                                        onClick={() => handleCancelClick(viewing._id)}
                                                        className="text-red-500 text-sm font-medium hover:text-red-700 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                                                    >
                                                        Cancel Request
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Provider Reply Section */}
                                        {viewing.providerReply && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400 font-semibold">
                                                    <MessageSquare size={16} />
                                                    <span>Reply from Host</span>
                                                </div>
                                                <p className="text-sm text-blue-900 dark:text-blue-200 italic">
                                                    "{viewing.providerReply}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isCancelModalOpen}
                title="Cancel Viewing Request"
                message="Are you sure you want to cancel this viewing request?"
                confirmText="Yes, Cancel"
                cancelText="No, Keep It"
                isDanger={true}
                onConfirm={confirmCancel}
                onCancel={() => setIsCancelModalOpen(false)}
            />
        </div>
    );
}
