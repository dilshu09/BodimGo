import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserPlus, FileText, ChevronRight, CheckCircle, AlertTriangle, Home, Users, DollarSign, ArrowUpRight, TrendingUp, Settings, Clock, PieChart } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:5000/api";

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/dashboard/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.data.success) {
                    setStats(res.data.stats);
                    setActions(res.data.actions);
                }
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-slate-500 font-medium">Loading your dashboard...</div>
            </div>
        );
    }

    // Stats Configuration matching FinanceDashboard style
    const statCards = [
        {
            title: "Pending Requests",
            value: stats?.pendingRequests || 0,
            icon: Clock,
            bg: "bg-amber-50 dark:bg-slate-800/50",
            textColor: "text-amber-600 dark:text-amber-400",
            borderColor: "border-slate-200 dark:border-slate-700",
            hoverBorder: "hover:border-amber-500 dark:hover:border-amber-400",
            hoverText: "group-hover:text-amber-600 dark:group-hover:text-amber-400"
        },
        {
            title: "Occupancy Rate",
            value: `${stats?.occupancyRate || 0}%`,
            icon: PieChart,
            bg: "bg-emerald-50 dark:bg-slate-800/50",
            textColor: "text-emerald-600 dark:text-emerald-400",
            borderColor: "border-slate-200 dark:border-slate-700",
            hoverBorder: "hover:border-emerald-500 dark:hover:border-emerald-400",
            hoverText: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
        },
        {
            title: "Empty Rooms",
            value: stats?.vacantRooms || 0,
            icon: Home,
            bg: "bg-orange-50 dark:bg-slate-800/50",
            textColor: "text-orange-600 dark:text-orange-400",
            borderColor: "border-slate-200 dark:border-slate-700",
            hoverBorder: "hover:border-orange-500 dark:hover:border-orange-400",
            hoverText: "group-hover:text-orange-600 dark:group-hover:text-orange-400"
        }
    ];

    // Refined Gauge Calculation
    // "Bit big" -> radius 90 (was 70/80)
    // "Thin" -> strokeWidth 10 (was 20)
    const radius = 90;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const occupancyPercent = stats?.occupancyRate || 0;
    const strokeDashoffset = circumference - (occupancyPercent / 100) * circumference;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Here's what's happening with your properties today.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Link to="/listings" className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors shadow-sm">
                        View Listings
                    </Link>
                    <Link to="/add-listing" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium flex items-center gap-2 transition-colors shadow-sm">
                        <Plus size={18} /> New Listing
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Stats & Occupancy */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {statCards.map((stat, i) => (
                            <div key={i} className={`${stat.bg} rounded-xl p-3 border ${stat.borderColor || 'border-slate-200'} shadow-sm transition-all duration-300 hover:shadow-xl ${stat.hoverBorder} hover:-translate-y-1 group`}>
                                <div className="flex items-start justify-between mb-1">
                                    <div>
                                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">{stat.title}</p>
                                        <p className={`text-xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight ${stat.hoverText} transition-colors`}>{stat.value}</p>
                                    </div>
                                    <div className={`p-2 rounded-lg bg-white/60 dark:bg-black/20 ${stat.textColor} group-hover:scale-110 transition-transform shadow-sm`}>
                                        <stat.icon size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Occupancy Section - Enhanced UI */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Occupancy Overview</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time room availability</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">
                                <span className={`w-2 h-2 rounded-full ${stats?.occupancyRate >= 80 ? 'bg-emerald-500' : stats?.occupancyRate >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {stats?.occupancyRate >= 80 ? 'High Demand' : stats?.occupancyRate >= 50 ? 'Moderate' : 'Low Occupancy'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-around gap-8 relative z-10">
                            {/* SVG Gauge - Enhanced with Gradient */}
                            <div className="relative w-56 h-56 flex-shrink-0 group">
                                <div className="absolute inset-0 bg-blue-100/20 rounded-full blur-xl scale-90 group-hover:scale-100 transition-transform duration-700"></div>
                                <svg className="w-full h-full transform -rotate-90">
                                    <defs>
                                        <linearGradient id="occupancyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#3b82f6" /> {/* Blue-500 */}
                                            <stop offset="100%" stopColor="#8b5cf6" /> {/* Violet-500 */}
                                        </linearGradient>
                                    </defs>
                                    {/* Background Circle */}
                                    <circle
                                        cx="112"
                                        cy="112"
                                        r="90"
                                        stroke="#f1f5f9"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="transition-all duration-300"
                                    />
                                    {/* Progress Circle */}
                                    <circle
                                        cx="112"
                                        cy="112"
                                        r="90"
                                        stroke="url(#occupancyGradient)"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={2 * Math.PI * 90}
                                        strokeDashoffset={2 * Math.PI * 90 - ((stats?.occupancyRate || 0) / 100) * (2 * Math.PI * 90)}
                                        className="transition-all duration-1000 ease-out drop-shadow-sm"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                                        {stats?.occupancyRate || 0}%
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Occupied</span>
                                </div>
                            </div>

                            {/* Legend / Stats */}
                            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all duration-300 group/card">
                                    <div className="mb-2 p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg group-hover/card:scale-110 transition-transform">
                                        <Users size={20} />
                                    </div>
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.totalRooms - stats?.vacantRooms || 0}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Occupied Rooms</span>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all duration-300 group/card">
                                    <div className="mb-2 p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover/card:scale-110 transition-transform">
                                        <Home size={20} />
                                    </div>
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.vacantRooms || 0}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vacant Rooms</span>
                                </div>

                                <div className="col-span-2 pt-2">
                                    <div className="flex justify-between items-center px-4 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-200 dark:shadow-none cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                                        <span className="font-medium text-sm">Total Capacity</span>
                                        <span className="font-bold">{stats?.totalRooms || 0} Rooms</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Actions (Top) -> Actions (Bottom) */}
                <div className="space-y-8">

                    {/* 1. Quick Links Card (Now on Top) */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 w-full">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link to="/tenants/add" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-all border border-transparent hover:border-primary/20 group">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-md text-primary shadow-sm group-hover:scale-110 transition-transform">
                                    <UserPlus size={18} />
                                </div>
                                <span className="font-medium text-sm">Add New Tenant</span>
                            </Link>
                            <Link to="/finance/reports" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-all border border-transparent hover:border-primary/20 group">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-md text-primary shadow-sm group-hover:scale-110 transition-transform">
                                    <TrendingUp size={18} />
                                </div>
                                <span className="font-medium text-sm">Financial Reports</span>
                            </Link>
                            <Link to="/settings" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-all border border-transparent hover:border-primary/20 group">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-md text-primary shadow-sm group-hover:scale-110 transition-transform">
                                    <Settings size={18} />
                                </div>
                                <span className="font-medium text-sm">Property Settings</span>
                            </Link>
                        </div>
                    </div>

                    {/* 2. Action Center (Now below) */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Action Center</h2>
                            {actions.length > 0 && (
                                <span className="bg-red-50 dark:bg-red-900/20 text-primary dark:text-red-400 text-xs font-bold px-2 py-1 rounded-md border border-red-100 dark:border-red-900/30">{actions.length} New</span>
                            )}
                        </div>

                        <div className="divide-y divide-slate-50 dark:divide-slate-800 overflow-y-auto custom-scrollbar">
                            {actions.length > 0 ? (
                                actions.map((action, i) => (
                                    <div key={i} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="flex gap-4">
                                            <div className={`mt-1 flex-shrink-0 ${action.urgent ? 'text-red-500' : 'text-blue-500'}`}>
                                                <AlertTriangle size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{action.message}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(action.date).toLocaleDateString()}</span>
                                                    <Link to={action.link} className="text-xs font-bold text-primary hover:underline">
                                                        Review &rarr;
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-100 dark:border-slate-700">
                                        <CheckCircle size={24} />
                                    </div>
                                    <p className="text-slate-900 dark:text-white font-medium">All caught up!</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">No pending actions.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
