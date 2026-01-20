import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo.png';

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            navigate('/login');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    return (
        <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/dashboard" className="flex items-center gap-2">
                    <img src={logo} alt="BodimGo" className="h-8 w-auto" />
                    <span className="text-primary font-bold text-xl">BodimGo <span className="text-neutral-500 font-normal text-sm">Provider</span></span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                        My Listings
                    </Link>
                    <Link to="/add-listing" className="text-sm font-medium hover:text-primary transition-colors">
                        Create Listing
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
