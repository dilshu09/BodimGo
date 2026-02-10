import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

const ReportModal = ({ isOpen, onClose, listingId }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [success, setSuccess] = useState(false);
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
            setSuccess(true);
            // Auto close after 3 seconds or let user close
            // setTimeout(onClose, 3000); 
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-md p-8 relative text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-neutral-900">Thank You!</h2>
                    <p className="text-neutral-600 mb-6">
                        We have received your report. Our team will review it shortly to keep our community safe.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-black transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

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
