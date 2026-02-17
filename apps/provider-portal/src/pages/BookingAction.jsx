
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BookingAction = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const action = searchParams.get('action');

    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!action || !id) {
            setStatus('error');
            setMessage('Invalid Link');
            return;
        }
        processAction();
    }, [id, action]);

    const processAction = async () => {
        try {
            // Using existing booking status endpoint
            await api.put(`/bookings/${id}/status`, { action });

            setStatus('success');
            if (action === 'accept') {
                setMessage('Booking Accepted! The tenant has been notified to pay.');
            } else {
                setMessage('Booking Rejected.');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage(err.response?.data?.message || 'Failed to process request.');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-neutral-100 dark:border-slate-700">
                {status === 'processing' && (
                    <div className="py-8">
                        <Loader className="animate-spin text-primary mx-auto mb-4" size={48} />
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Processing Request...</h2>
                        <p className="text-neutral-500 dark:text-slate-400">Please wait while we update the booking status.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-8">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${action === 'accept' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-300'}`}>
                            {action === 'accept' ? <CheckCircle size={40} /> : <XCircle size={40} />}
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
                            {action === 'accept' ? 'Booking Accepted' : 'Booking Rejected'}
                        </h2>
                        <p className="text-neutral-500 dark:text-slate-400 mb-8">{message}</p>
                        <button
                            onClick={() => navigate('/bookings')}
                            className="btn-primary w-full py-3"
                        >
                            Go to Bookings
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-8">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">Action Failed</h2>
                        <p className="text-neutral-500 dark:text-slate-400 mb-8">{message}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-neutral-500 dark:text-slate-400 font-medium hover:text-neutral-800 dark:hover:text-white underline"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingAction;
