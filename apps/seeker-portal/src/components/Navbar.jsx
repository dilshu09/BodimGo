import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserCircle, Globe, Bell, X } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../services/api';

const Navbar = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            // Need to handle 401 silently if user not logged in
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            // Quiet fail if not logged in
        }
    };

    const markAsRead = async (id, link) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
            if (link) navigate(link);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <nav className="border-b border-neutral-200 bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <img src={logo} alt="BodimGo" className="h-8 w-auto" />
                    <span className="text-primary font-bold text-2xl">BodimGo</span>
                </Link>

                {/* Search Bar Placeholder (Short version for Navbar) */}
                <div className="hidden md:flex items-center border border-neutral-300 rounded-full py-2.5 px-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="px-4 font-medium text-sm text-neutral-800 border-r border-neutral-300">Anywhere</div>
                    <div className="px-4 font-medium text-sm text-neutral-800 border-r border-neutral-300">Any week</div>
                    <div className="px-4 text-sm text-neutral-500">Add guests</div>
                    <div className="bg-primary p-2 rounded-full text-white ml-2">
                        <Search size={14} strokeWidth={3} />
                    </div>
                </div>

                {/* Right Menu */}
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            className="relative p-2 hover:bg-neutral-100 rounded-full transition-colors"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <Bell size={20} className="text-neutral-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white" />
                            )}
                        </button>

                        {/* Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-neutral-100 overflow-hidden z-50">
                                <div className="p-3 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                                    <h3 className="font-bold text-sm text-neutral-900">Notifications</h3>
                                    <button onClick={() => setShowNotifications(false)} className="text-neutral-400 hover:text-black">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map(notif => (
                                            <div
                                                key={notif._id}
                                                className={`p-4 border-b border-neutral-50 hover:bg-neutral-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                                                onClick={() => markAsRead(notif._id, notif.data?.bookingId ? `/bookings/${notif.data.bookingId}` : null)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                                                    <div>
                                                        <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{notif.message}</p>
                                                        <div className="text-[10px] text-neutral-400 mt-2">
                                                            {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-neutral-400 text-sm">
                                            No notifications
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <a href="http://localhost:5175" className="text-sm font-medium hover:bg-neutral-100 px-4 py-2 rounded-full transition-colors hidden md:block">
                        Switch to Hosting
                    </a>
                    <button className="hover:bg-neutral-100 p-2 rounded-full hidden md:block">
                        <Globe size={18} />
                    </button>

                    <div className="group relative">
                        <div className="flex items-center gap-2 border border-neutral-300 rounded-full p-1 pl-3 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="h-4 w-4 flex flex-col justify-between py-1">
                                <span className="block w-full h-[2px] bg-neutral-600"></span>
                                <span className="block w-full h-[2px] bg-neutral-600"></span>
                                <span className="block w-full h-[2px] bg-neutral-600"></span>
                            </div>
                            <UserCircle size={30} className="text-neutral-500" />
                        </div>

                        {/* Dropdown */}
                        <div className="absolute right-0 top-12 w-60 bg-white rounded-xl shadow-xl border border-neutral-100 overflow-hidden hidden group-hover:block transition-all z-50">
                            <div className="py-2 border-b border-neutral-100">
                                <Link to="/register" className="block px-4 py-3 font-bold text-neutral-800 hover:bg-neutral-50">Sign up</Link>
                                <Link to="/login" className="block px-4 py-3 text-neutral-600 hover:bg-neutral-50">Log in</Link>
                            </div>
                            <div className="py-2 border-b border-neutral-100">
                                <Link to="/wishlist" className="block px-4 py-3 text-neutral-800 hover:bg-neutral-50 font-semibold">
                                    Wishlist <span className="text-primary">❤️</span>
                                </Link>
                            </div>
                            <div className="py-2">
                                <a href="http://localhost:5175" className="block px-4 py-3 text-neutral-600 hover:bg-neutral-50">Host your home</a>
                                <Link to="#" className="block px-4 py-3 text-neutral-600 hover:bg-neutral-50">Help Center</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
