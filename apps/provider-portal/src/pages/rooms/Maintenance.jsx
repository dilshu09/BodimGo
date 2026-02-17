"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Wrench, MoreHorizontal, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import { toast } from "react-hot-toast";

export default function MaintenancePage() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await api.get("/listings/provider/rooms");
            if (response.data.success) {
                setRooms(response.data.data);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load rooms");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsDone = (room) => {
        setSelectedRoom(room);
        setShowConfirm(true);
    };

    const confirmStatusUpdate = async () => {
        try {
            const response = await api.put(`/listings/provider/rooms/${selectedRoom._id}/status`, {
                status: 'Available'
            });

            if (response.data.success) {
                toast.success("Room marked as Available");
                fetchRooms(); // Refresh list
                setShowConfirm(false);
                setSelectedRoom(null);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to update status");
        }
    };

    // Placeholder functions for styling, as they were not provided in the instruction snippet
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'In Progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance' || r.status === 'Under Maintenance');

    if (loading) return <div className="p-12 text-center text-slate-500">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Maintenance</h1>
                    <p className="text-neutral-500 dark:text-slate-400">Track and manage maintenance requests.</p>
                </div>
            </div>

            {/* Empty State */}
            {maintenanceRooms.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-neutral-300 dark:border-slate-700 p-12 text-center">
                    <div className="w-16 h-16 bg-neutral-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400 dark:text-slate-500">
                        <Wrench size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-1">No Requests</h3>
                    <p className="text-neutral-500 dark:text-slate-400">You don't have any maintenance requests yet.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 dark:bg-slate-800 border-b border-neutral-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Issue</th>
                                    <th className="p-4 text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Room</th>
                                    <th className="p-4 text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                                    <th className="p-4 text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="p-4 text-end text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                                {maintenanceRooms.map((room) => (
                                    <tr key={room._id} className="hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-neutral-800 dark:text-white">Routine Maintenance</div>
                                            <div className="text-sm text-neutral-500 dark:text-slate-400 line-clamp-1">{room.name}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-neutral-700 dark:text-slate-300">{room.name}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor('Medium')}`}>
                                                Medium
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor('In Progress')}`}>
                                                In Progress
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-neutral-500 dark:text-slate-400">
                                            - {/* Date not available in original room object */}
                                        </td>
                                        <td className="p-4 text-end">
                                            <div className="flex items-center justify-end gap-2">
                                                {room.status !== 'Available' && ( // Changed from 'Completed' to 'Available'
                                                    <button
                                                        onClick={() => handleMarkAsDone(room)} // Changed from markAsComplete(req.id)
                                                        className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"
                                                        title="Mark as Complete"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                )}
                                                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-400 dark:text-slate-500 rounded-lg transition-colors">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-neutral-200 dark:border-slate-800">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Move to Available?</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">This will make the room visible to tenants.</p>
                            </div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            Are you sure <strong>{selectedRoom?.name}</strong> is ready for tenants?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusUpdate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                            >
                                Confirm & Move
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
