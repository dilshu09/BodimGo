import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MessageModal = ({ isOpen, onClose, providerName }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulating API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setLoading(false);
        toast.success(`Message sent to ${providerName}!`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-neutral-900">Contact {providerName}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Your Message</label>
                        <textarea
                            required
                            rows="5"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Hi, I'm interested in this property..."
                            className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E51D54] outline-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <Send size={18} /> Send Message
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MessageModal;
