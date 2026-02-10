import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Bell, X, UserCircle } from 'lucide-react';
import api from '../services/api';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser && storedUser !== 'undefined') {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error('Failed to parse user data:', error);
                    localStorage.removeItem('user');
                }
            }
        };

        loadUser();
        window.addEventListener('user-updated', loadUser);
        return () => window.removeEventListener('user-updated', loadUser);
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            // console.error(err);
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
        <header className="h-16 bg-white border-b border-neutral-200 sticky top-0 z-40 px-8 flex items-center justify-between">
            {/* Left: Dynamic Title */}
            <div>
                <h2 className="text-xl font-bold text-neutral-800">Provider Portal</h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">
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
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-neutral-100 overflow-hidden z-50">
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
                                            onClick={() => markAsRead(notif._id, notif.data?.bookingId ? `/bookings/${notif.data.bookingId}` : notif.data?.viewingRequestId ? '/viewings' : null)}
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

                {/* User Profile Indicator */}
                <div className="flex items-center gap-3 pl-6 border-l border-neutral-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-neutral-900 leading-none">
                            {user?.name || 'Provider'}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                            {user?.email || ''}
                        </p>
                    </div>
                    <div className="h-10 w-10 bg-neutral-100 rounded-full flex items-center justify-center overflow-hidden border border-neutral-200">
                        {user?.profileImage ? (
                            <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <UserCircle size={24} className="text-neutral-400" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
