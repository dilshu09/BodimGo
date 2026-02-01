"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
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

    const maintenanceRooms = rooms.filter(r => r.status === 'Maintenance' || r.status === 'Under Maintenance');

    if (loading) return <div className="p-12 text-center text-slate-500">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto relative">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Maintenance</h2>
                <p className="text-slate-600 mt-1">
                    Manage rooms currently under maintenance
                </p>
            </div>

            {maintenanceRooms.length === 0 ? (
                <div className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                    <p className="text-slate-600 text-lg">
                        No rooms are currently under maintenance.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Room</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Issue</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Since</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {maintenanceRooms.map((room) => (
                                <tr key={room._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{room.name}</div>
                                        <div className="text-xs text-slate-500">{room.listingTitle}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        Routine Maintenance
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        -
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                            In Progress
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleMarkAsDone(room)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                        >
                                            <CheckCircle size={16} />
                                            Mark as Done
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Move to Available?</h3>
                                <p className="text-sm text-slate-500">This will make the room visible to tenants.</p>
                            </div>
                        </div>

                        <p className="text-slate-600 mb-6">
                            Are you sure <strong>{selectedRoom?.name}</strong> is ready for tenants?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmStatusUpdate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
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
