import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/logo.png';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const getPasswordStrength = (pass) => {
        if (!pass) return 0;
        let score = 0;
        if (pass.length > 7) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return score;
    };

    const strength = getPasswordStrength(formData.password);
    const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const strengthColors = ['bg-neutral-200', 'bg-red-400', 'bg-yellow-400', 'bg-green-500', 'bg-emerald-600'];

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return false;
        }
        if (!formData.phone) {
            setError('Please enter a valid phone number.');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError('');

        try {
            const { confirmPassword, ...submitData } = formData;
            await api.post('/auth/register', {
                ...submitData,
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
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 py-12 transition-colors duration-200">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-800 transition-all">
                <div className="text-center mb-8">
                    <img src={logo} alt="BodimGo" className="h-12 w-auto mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Create Account</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Sign up to find your perfect place</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center border border-red-100 dark:border-red-800">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Phone Number</label>
                        <input
                            type="tel"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                            placeholder="+94 77 123 4567"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-10 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {/* Strength Meter */}
                        {formData.password && (
                            <div className="mt-2">
                                <div className="flex gap-1 h-1.5 mb-1">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`flex-1 rounded-full transition-all duration-300 ${strength >= level ? strengthColors[strength] : 'bg-gray-100 dark:bg-neutral-800'}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-right">strength: <span className="font-bold">{strengthLabels[Math.max(0, strength - 1)] || 'Weak'}</span></p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-10 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4">
                        By signing up, I agree to BodimGo's <Link to="#" className="underline font-medium text-neutral-800 dark:text-white">Terms of Service</Link> and <Link to="#" className="underline font-medium text-neutral-800 dark:text-white">Privacy Policy</Link>.
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#E51D54] hover:bg-[#d01b4c] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 mt-4 transition-all active:scale-[0.98]"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-center">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-bold hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
