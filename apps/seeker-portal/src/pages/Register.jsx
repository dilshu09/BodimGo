import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/register', {
                ...formData,
                role: 'seeker'
            });
            navigate('/verify', { state: { email: formData.email } });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-[500px] border border-neutral-200 rounded-3xl shadow-xl overflow-hidden">
                <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200">
                    <Link to="/login" className="text-sm font-bold text-neutral-800 hover:bg-neutral-100 px-3 py-2 rounded-full">Back</Link>
                    <h1 className="font-bold text-neutral-800">Sign up</h1>
                    <div className="w-10"></div>
                </div>

                <div className="p-6">
                    <div className="flex justify-center mb-6">
                        <img src={logo} alt="BodimGo" className="h-10 w-auto" />
                    </div>

                    <h2 className="text-2xl font-bold text-neutral-800 mb-6">Create your profile</h2>

                    {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="border border-neutral-400 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black focus-within:border-black divide-y divide-neutral-400">
                            <div className="px-4 py-2">
                                <label className="block text-xs text-neutral-500 font-bold uppercase">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full outline-none text-neutral-800 bg-transparent"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="px-4 py-2">
                                <label className="block text-xs text-neutral-500 font-bold uppercase">Email</label>
                                <input
                                    type="email"
                                    className="w-full outline-none text-neutral-800 bg-transparent"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="px-4 py-2">
                                <label className="block text-xs text-neutral-500 font-bold uppercase">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full outline-none text-neutral-800 bg-transparent"
                                    placeholder="+94 77 123 4567"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="px-4 py-2">
                                <label className="block text-xs text-neutral-500 font-bold uppercase">Password</label>
                                <input
                                    type="password"
                                    className="w-full outline-none text-neutral-800 bg-transparent"
                                    placeholder="At least 8 characters"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <p className="text-xs text-neutral-500">
                            By selecting <strong>Agree and continue</strong>, I agree to BodimGo's <a href="#" className="underline font-medium text-neutral-800">Terms of Service</a> and <a href="#" className="underline font-medium text-neutral-800">Privacy Policy</a>.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 text-lg font-bold"
                        >
                            {loading ? 'Creating...' : 'Agree and continue'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
