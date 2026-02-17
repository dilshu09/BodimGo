import { X } from 'lucide-react';

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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-transparent dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-800">
                    <h3 className={`text-lg font-bold ${isDanger ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        {title}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 dark:text-slate-400 hover:text-gray-500 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 dark:text-slate-300 leading-relaxed font-medium">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-slate-950 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 dark:focus:ring-slate-700 transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition ${isDanger
                            ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            : "bg-neutral-900 dark:bg-slate-700 dark:hover:bg-slate-600 hover:bg-black focus:ring-neutral-800 dark:focus:ring-slate-600"
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
