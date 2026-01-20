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
            setMessage('Reset link sent.');
        } catch (err) {
            setError('Failed to send link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-card w-full max-w-sm text-center">
                <img src={logo} alt="BodimGo" className="h-12 w-auto mx-auto mb-4" />
                <h1 className="text-xl font-bold mb-4 text-primary">Reset Admin Password</h1>

                {message && <div className="mb-4 text-green-600 text-sm">{message}</div>}
                {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <input
                        type="email"
                        placeholder="Admin Email"
                        className="input-field"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Code'}
                    </button>
                </form>
                <div className="mt-4 text-sm">
                    <Link to="/login" className="text-gray-500 hover:text-gray-800">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
