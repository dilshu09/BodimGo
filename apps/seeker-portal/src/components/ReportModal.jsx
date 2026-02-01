import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

const ReportModal = ({ isOpen, onClose, listingId }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const reasons = [
        "Inaccurate Information",
        "Scam or Fraud",
        "Offensive Content",
        "Other"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) return alert("Please select a reason");

        setLoading(true);
        try {
            await api.post('/reports', {
                listingId,
                reason,
                description
            });
            alert('Report submitted. We will investigate.');
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-black">
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold mb-4">Report Listing</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <select
                            className="w-full border border-neutral-300 rounded-lg p-2"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        >
                            <option value="">Select a reason</option>
                            {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            className="w-full border border-neutral-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
                            rows="4"
                            placeholder="Provide more details..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
