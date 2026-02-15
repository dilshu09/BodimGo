import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ShieldAlert, LogOut, Bell, X, MessageSquare, Trash2, Sun, Moon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import api from "../services/api";
import logo from "../assets/logo.png";
import { useTheme } from '../hooks/useTheme';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Notification Logic
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
    } catch (err) { }
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
      fetchNotifications();
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const markAsRead = async (id, link) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
      // Admin might just view the list, or we could link to reports if implemented

    } catch (err) { }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    }
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "User Management", path: "/users", icon: Users },
    { name: "Moderation Queue", path: "/listings", icon: ShieldAlert },
    { name: "Messages", path: "/messages", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 flex font-sans text-neutral-900 dark:text-slate-200 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-neutral-200 dark:border-slate-800 flex flex-col fixed inset-y-0 z-50 transition-colors duration-200">
        <div className="h-20 flex items-center px-8 border-b border-neutral-100 dark:border-slate-800 gap-3">
          <img src={logo} alt="Bg" className="h-8 w-auto" />
          <span className="text-primary font-bold text-xl tracking-tight">
            BodimGo Admin
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary" // Softer active state
                    : "text-neutral-500 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800 hover:text-neutral-900 dark:hover:text-slate-200",
                )}
              >
                <Icon
                  size={20}
                  className={
                    isActive
                      ? "text-primary"
                      : "text-neutral-400 dark:text-slate-500 group-hover:text-neutral-600 dark:group-hover:text-slate-300"
                  }
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-neutral-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 w-full transition-colors duration-200"
          >
            <LogOut size={20} />
            Sign Out
          </button>
          <div className="mt-4 px-4 text-xs text-neutral-400 font-medium">
            v1.0.2 • © BodimGo Inc.
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-slate-800 sticky top-0 z-40 px-8 flex items-center justify-between transition-colors duration-200">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
            {navItems.find((i) => i.path === location.pathname)?.name ||
              "Dashboard"}
          </h2>

          <div className="flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-full border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm w-64 outline-none placeholder:text-neutral-400 dark:placeholder:text-slate-500 dark:text-slate-200 hover:border-[#FF385C] duration-300"
              />
              <svg
                className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* NOTIFICATION BELL */}
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
                          onClick={clearAllNotifications}
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
                          className={`p-4 border-b border-neutral-50 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                          onClick={() => markAsRead(notif._id, null)} // TODO: Admin actions
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
                      <div className="p-8 text-center text-neutral-400 text-sm">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-neutral-200 dark:border-slate-800">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Admin User</p>
                <p className="text-xs text-neutral-500 dark:text-slate-400 font-medium">
                  Super Admin
                </p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center text-white font-bold shadow-md">
                A
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
