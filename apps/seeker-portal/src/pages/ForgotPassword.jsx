import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await api.post('/auth/forgot-password', { email });
            setMessage('Password reset code sent to your email.');
            // Automatically route to reset password page after 1.5 seconds, passing the email in state
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-slate-950 px-4 py-12 transition-colors duration-200">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-neutral-100 dark:border-slate-800 transition-all">
                <div className="text-center mb-8">
                    <img src={logo} alt="BodimGo" className="h-12 w-auto mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Forgot Password</h1>
                    <p className="text-neutral-500 dark:text-slate-400 text-sm mt-1">Enter your email to receive a reset code</p>
                </div>

                {message && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium flex items-center border border-green-100 dark:border-green-800">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center border border-red-100 dark:border-red-800">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wide mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                            placeholder="user@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#E51D54] hover:bg-[#d01b4c] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer"
                    >
                        {loading ? 'Sending Code...' : 'Send Reset Code'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-slate-800 text-center space-y-3">
                    <p className="text-sm">
                        <Link to="/reset-password" state={{ email }} className="text-primary font-bold hover:underline">
                            I already have a code
                        </Link>
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-slate-400">
                        <Link to="/login" className="hover:text-neutral-800 dark:hover:text-white transition-colors">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
