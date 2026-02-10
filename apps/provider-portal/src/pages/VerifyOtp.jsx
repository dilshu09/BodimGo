import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        } else {
            // Redirect if no email in state (accessed directly)
            navigate('/register');
        }
    }, [location, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/verify-otp', { email, otp });
            // Store token and user data
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data));

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await api.post('/auth/resend-otp', { email });
            alert('OTP code has been resent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-card text-center">
                <h1 className="text-2xl font-bold text-neutral-800 mb-2">Verify Your Email</h1>
                <p className="text-neutral-500 mb-8">
                    We sent a 6-digit code to <span className="font-medium text-neutral-800">{email}</span>
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-left">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            required
                            className="input-field text-center text-2xl tracking-[0.5em] font-medium"
                            maxLength="6"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Numbers only
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full btn-primary"
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <div className="mt-6">
                    <button
                        onClick={handleResend}
                        className="text-sm text-neutral-500 hover:text-primary transition-colors"
                    >
                        Didn't receive the code? Resend
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
