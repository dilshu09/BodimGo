import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';

const ForgotPassword = () => {
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
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-card text-center">
                <img src={logo} alt="BodimGo" className="h-12 w-auto mx-auto mb-4" />
                <h1 className="text-xl font-bold text-neutral-800 mb-2">Reset Password</h1>
                <p className="text-neutral-500 mb-6 text-sm">Enter your email to receive a reset code.</p>

                {message && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{message}</div>}
                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="input-field"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="w-full btn-primary">
                        {loading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </form>

                <div className="mt-6 text-sm">
                    <Link to="/reset-password" state={{ email }} className="text-primary font-medium hover:underline">
                        I have a code
                    </Link>
                </div>

                <div className="mt-2 text-sm">
                    <Link to="/login" className="text-neutral-500 hover:text-neutral-800">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
