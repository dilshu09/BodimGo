import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';

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
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/verify-otp', { email, otp });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-[500px] border border-neutral-200 rounded-3xl shadow-xl overflow-hidden p-8">
                <div className="text-center mb-8">
                    <img src={logo} alt="BodimGo" className="h-10 w-auto mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-neutral-800">Verify your email</h2>
                    <p className="text-neutral-500 text-sm mt-2">
                        Enter the 6-digit code we sent to <br />
                        <span className="font-bold text-neutral-800">{email}</span>
                    </p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="text"
                        placeholder="000000"
                        maxLength="6"
                        className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 border-b-2 border-neutral-300 focus:border-black outline-none transition-colors"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full btn-primary py-3 text-lg font-bold"
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button className="text-sm font-bold underline text-neutral-800 hover:text-neutral-600">Resend Code</button>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
