import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.data.role === 'seeker') {
                navigate('/');
            } else {
                setError('Please use the Provider portal for provider accounts.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-[500px] border border-neutral-200 rounded-3xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200">
                    <div className="w-4"></div> {/* Spacer */}
                    <h1 className="font-bold text-neutral-800">Log in or sign up</h1>
                    <div className="w-4"></div> {/* Spacer */}
                </div>

                <div className="p-6">
                    <div className="flex justify-center mb-6">
                        <img src={logo} alt="BodimGo" className="h-10 w-auto" />
                    </div>

                    <h2 className="text-2xl font-bold text-neutral-800 mb-6">Welcome to BodimGo</h2>

                    {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="border border-neutral-400 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black focus-within:border-black">
                            <div className="border-b border-neutral-400 px-4 py-2">
                                <label className="block text-xs text-neutral-500 font-bold uppercase">Email</label>
                                <input
                                    type="email"
                                    className="w-full outline-none text-neutral-800 placeholder:text-neutral-400 bg-transparent"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="px-4 py-2">
                                <label className="block text-xs text-neutral-500 font-bold uppercase">Password</label>
                                <input
                                    type="password"
                                    className="w-full outline-none text-neutral-800 placeholder:text-neutral-400 bg-transparent"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <p className="text-xs text-neutral-500">
                            We'll call or text you to confirm your number. Standard message and data rates apply. <a href="#" className="underline font-medium text-neutral-800">Privacy Policy</a>
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 text-lg font-bold"
                        >
                            {loading ? 'Logging in...' : 'Continue'}
                        </button>
                    </form>

                    <div className="relative my-6 text-center">
                        <hr className="border-neutral-200" />
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-neutral-500">or</span>
                    </div>

                    <div className="text-center text-sm text-neutral-600">
                        Don't have an account? <Link to="/register" className="font-bold text-primary hover:underline">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
