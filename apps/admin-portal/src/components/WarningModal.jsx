
import { X, AlertTriangle } from "lucide-react";
import { useState } from "react";

const WarningModal = ({ isOpen, onClose, onSendWarning }) => {
    const [reason, setReason] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        onSendWarning(reason);
        setReason("");
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 catch-click"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" size={24} />
                            Send Official Warning
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        This will record a strike against the user account and send them an official warning email.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for warning
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g., Inappropriate language in listing..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 h-32 resize-none"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-sm"
                            >
                                Send Warning
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default WarningModal;
