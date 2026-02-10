import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/logo.png';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.data.role === 'admin') {
                localStorage.setItem('token', res.data.token);
                navigate('/');
            } else {
                setError('Access denied: Admins only');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-card w-full max-w-sm text-center">
                <img src={logo} alt="BodimGo" className="h-16 w-auto mx-auto mb-4" />
                <h1 className="text-xl font-bold mb-6 text-primary">Admin Login</h1>
                {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <input
                        type="email"
                        placeholder="Email"
                        className="input-field w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="input-field w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <button type="submit" className="btn-primary w-full py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover transition-colors">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
