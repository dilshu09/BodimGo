
import { X, AlertTriangle } from "lucide-react";

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {string} props.title
 * @param {string} props.message
 * @param {string} props.confirmText
 * @param {string} props.cancelText
 * @param {boolean} props.isDanger
 * @param {Function} props.onConfirm
 * @param {Function} props.onCancel
 */
const ConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = false,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 catch-click"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div
                            className={`p-3 rounded-full flex-shrink-0 ${isDanger ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                }`}
                        >
                            <AlertTriangle size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition ${isDanger
                            ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
