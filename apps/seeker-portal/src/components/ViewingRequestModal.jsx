import React, { useState } from 'react';
import { X, Calendar, Clock, Loader2 } from 'lucide-react';
import api from '../services/api';
import { toast } from "react-hot-toast";

const ViewingRequestModal = ({ isOpen, onClose, listingId, providerName }) => {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/viewing-requests', {
                listingId,
                date,
                time,
                note
            });
            toast.success(`Viewing request sent to ${providerName} for ${date} at ${time}!`);
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to send viewing request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-neutral-900">Schedule a Viewing</h3>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Select Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Preferred Time</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                            <input
                                type="time"
                                required
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Note (Optional)</label>
                        <textarea
                            rows="3"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Any specific questions or alternative times?"
                            className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none resize-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#E51D54] hover:bg-[#d41b4e] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ViewingRequestModal;
