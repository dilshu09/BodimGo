import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserCircle, Globe, Bell, X, Trash2, Sun, Moon } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../services/api';
import ConfirmationModal from './ConfirmationModal';
import { useTheme } from '../hooks/useTheme';

const Navbar = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [user, setUser] = useState(null);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isClearNotificationsModalOpen, setIsClearNotificationsModalOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    // Notification Logic
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        checkAuth();
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkAuth = async () => {
        try {
            const res = await api.get('/auth/profile');
            // Enforce Role Check: If user is not a seeker, treat them as a guest (null)
            // Do NOT log them out, as they might be an Admin/Provider working in another tab
            if (res.data.role !== 'seeker') {
                setUser(null);
                return;
            }
            setUser(res.data);
        } catch (err) {
            setUser(null);
        }
    };

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = async () => {
        try {
            await api.post('/auth/logout');
            setUser(null);
            setIsLogoutModalOpen(false);
            navigate('/login');
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

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



    const clearAllNotifications = async () => {
        try {
            await api.delete('/notifications');
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error("Failed to clear notifications", err);
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            // Recalculate unread count if needed, or just fetch again
            fetchNotifications();
        } catch (err) {
            console.error("Failed to delete notification", err);
        }
    };

    const markAsRead = async (id, link) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
            setShowNotifications(false);
            if (link) navigate(link);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <nav className="fixed top-0 left-0 w-full border-b border-neutral-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-50 transition-colors duration-200 h-20">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <img src={logo} alt="BodimGo" className="h-8 w-auto" />
                    <span className="text-primary font-bold text-2xl">BodimGo</span>
                </Link>

                {/* Search Bar Placeholder (Short version for Navbar) */}
                {/* Search Bar Removed as per user request */}

                {/* Right Menu */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors mr-1"
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                    </button>
                    {/* Notification Bell */}
                    <div className="relative" ref={notificationRef}>
                        <button
                            className={`relative p-2.5 rounded-full transition-all duration-200 ${showNotifications ? 'bg-neutral-100 dark:bg-slate-800 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-white'}`}
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <Bell size={22} strokeWidth={2} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-[#E51D54] rounded-full border-[2px] border-white dark:border-slate-900 shadow-sm" />
                            )}
                        </button>

                        {/* Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 top-14 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-neutral-100 dark:border-slate-800 overflow-hidden z-50 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-3 border-b border-neutral-100 dark:border-slate-800 flex justify-between items-center bg-neutral-50 dark:bg-slate-950 gap-2">
                                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Notifications</h3>
                                    <div className="flex items-center gap-6">
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={() => setIsClearNotificationsModalOpen(true)}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                                            >
                                                <Trash2 size={14} /> Clear All
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowNotifications(false)}
                                            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-slate-200 transition-colors p-1 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map(notif => (
                                            <div
                                                key={notif._id}
                                                onClick={() => markAsRead(notif._id, notif.type === 'booking_accepted' ? `/checkout/${notif.data?.bookingId}` : notif.data?.viewingRequestId ? '/viewings' : null)}
                                            >
                                                <div className="flex gap-3 relative">
                                                    <button
                                                        onClick={(e) => deleteNotification(e, notif._id)}
                                                        className="absolute top-0 right-0 p-1 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                                        title="Delete"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                                                    <div>
                                                        <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-neutral-900 dark:text-white' : 'font-medium text-neutral-700 dark:text-slate-400'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        <p className="text-xs text-neutral-500 dark:text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                                                        <div className="text-[10px] text-neutral-400 mt-2">
                                                            {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-neutral-400 dark:text-slate-500 text-sm">
                                            No notifications
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <a href="http://localhost:5175" className="text-sm font-medium hover:bg-neutral-100 dark:hover:bg-slate-800 px-4 py-2 rounded-full transition-colors hidden md:block dark:text-slate-200">
                        Switch to Hosting
                    </a>
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-2 border border-neutral-300 dark:border-slate-700 rounded-full p-1 pl-3 hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="h-4 w-4 flex flex-col justify-between py-1">
                                <span className="block w-full h-[2px] bg-neutral-600 dark:bg-slate-400"></span>
                                <span className="block w-full h-[2px] bg-neutral-600 dark:bg-slate-400"></span>
                                <span className="block w-full h-[2px] bg-neutral-600 dark:bg-slate-400"></span>
                            </div>
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt="Profile" className="h-[30px] w-[30px] rounded-full object-cover" />
                            ) : (
                                <UserCircle size={30} className="text-neutral-500" />
                            )}
                        </button>

                        {/* Dropdown */}
                        {showProfileMenu && (
                            <div className="absolute right-0 top-12 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-neutral-100 dark:border-slate-800 overflow-hidden z-50">
                                {!user ? (
                                    <>
                                        <div className="py-2 border-b border-neutral-100">
                                            <Link to="/register" onClick={() => setShowProfileMenu(false)} className="block px-4 py-3 font-bold text-neutral-800 hover:bg-neutral-50">Sign up</Link>
                                            <Link to="/login" onClick={() => setShowProfileMenu(false)} className="block px-4 py-3 text-neutral-600 hover:bg-neutral-50">Log in</Link>
                                        </div>
                                        <div className="py-2">
                                            <a href="http://localhost:5175" className="block px-4 py-3 text-neutral-600 hover:bg-neutral-50">Host your home</a>
                                            <Link to="#" onClick={() => setShowProfileMenu(false)} className="block px-4 py-3 text-neutral-600 hover:bg-neutral-50">Help Center</Link>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50 dark:bg-slate-950">
                                            <div className="font-bold text-neutral-900 dark:text-white truncate">{user.name}</div>
                                            <div className="text-xs text-neutral-500 dark:text-slate-400 truncate">{user.email}</div>
                                            {user.role === 'provider' && <div className="text-xs text-primary font-bold mt-1">Provider Account</div>}
                                        </div>

                                        {/* Show specific items only if NOT a provider (so for Seekers) */}
                                        {user.role !== 'provider' && (
                                            <div className="py-2 border-b border-neutral-100 dark:border-slate-800">
                                                <Link to="/bookings" onClick={() => setShowProfileMenu(false)} className="block px-4 py-3 text-neutral-800 dark:text-slate-200 hover:bg-neutral-50 dark:hover:bg-slate-800 font-medium">
                                                    My Bookings
                                                </Link>
                                                <Link to="/my-boarding" onClick={() => setShowProfileMenu(false)} className="block px-4 py-3 text-neutral-800 dark:text-slate-200 hover:bg-neutral-50 dark:hover:bg-slate-800 font-medium">
                                                    My Boarding Place
                                                </Link>
                                                <Link to="/viewings" onClick={() => setShowProfileMenu(false)} className="block px-4 py-3 text-neutral-800 dark:text-slate-200 hover:bg-neutral-50 dark:hover:bg-slate-800 font-medium">
                                                    My Viewings
                                                </Link>
                                                <Link to="/wishlist" onClick={() => setShowProfileMenu(false)} className="block px-4 py-3 text-neutral-800 dark:text-slate-200 hover:bg-neutral-50 dark:hover:bg-slate-800 font-semibold">
                                                    Wishlist <span className="text-primary">❤️</span>
                                                </Link>
                                            </div>
                                        )}

                                        <div className="py-2">
                                            <a href="http://localhost:5175" className="block px-4 py-3 text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800">Host your home</a>
                                            <button
                                                onClick={() => {
                                                    setShowProfileMenu(false);
                                                    handleLogoutClick();
                                                }}
                                                className="block w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-slate-800 text-red-500 font-medium"
                                            >
                                                Log out
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                title="Log Out"
                message="Are you sure you want to log out of BodimGo?"
                confirmText="Log Out"
                cancelText="Cancel"
                isDanger={true}
                onConfirm={confirmLogout}
                onCancel={() => setIsLogoutModalOpen(false)}
            />
            <ConfirmationModal
                isOpen={isClearNotificationsModalOpen}
                title="Clear Notifications"
                message="Are you sure you want to clear all notifications?"
                confirmText="Clear All"
                cancelText="Cancel"
                isDanger={true}
                onConfirm={() => {
                    clearAllNotifications();
                    setIsClearNotificationsModalOpen(false);
                }}
                onCancel={() => setIsClearNotificationsModalOpen(false)}
            />
        </nav>
    );
};

export default Navbar;
