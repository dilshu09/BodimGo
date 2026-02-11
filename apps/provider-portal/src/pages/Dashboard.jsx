import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserPlus, FileText, ChevronRight, CheckCircle, AlertTriangle, Home, Users, DollarSign, ArrowUpRight, TrendingUp, Settings } from 'lucide-react';
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
            title: "Active Tenants",
            value: stats?.activeTenants || 0,
            icon: Users,
            bg: "bg-blue-50",
            textColor: "text-blue-600"
        },
        {
            title: "Monthly Revenue",
            value: `Rs. ${(stats?.thisMonthRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            bg: "bg-emerald-50", // Matching Finance 'Green' feel
            textColor: "text-emerald-600"
        },
        {
            title: "Empty Rooms",
            value: stats?.vacantRooms || 0,
            icon: Home,
            bg: "bg-orange-50",
            textColor: "text-orange-600"
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
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-600 mt-1">
                        Here's what's happening with your properties today.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Link to="/listings" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors shadow-sm">
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
                            <div key={i} className={`${stat.bg} rounded-xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-slate-600 font-medium">{stat.title}</p>
                                        <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                                    </div>
                                    <div className={`p-2 rounded-lg bg-white/60 ${stat.textColor}`}>
                                        <stat.icon size={22} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Occupancy Section */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-900">Occupancy Status</h2>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                            {/* SVG Gauge - Bigger & Thinner */}
                            <div className="relative w-64 h-64 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    {/* Background Circle */}
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r={radius}
                                        stroke="#f1f5f9" // slate-100
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                    />
                                    {/* Progress Circle */}
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        className="text-primary transition-all duration-1000 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-bold text-slate-900">{stats?.occupancyRate || 0}%</span>
                                    <span className="text-sm font-medium text-slate-500 mt-1">Occupied</span>
                                </div>
                            </div>

                            <div className="space-y-4 w-full max-w-xs">
                                <div className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <span className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                                        Occupied Rooms
                                    </span>
                                    <span className="font-bold text-slate-900">{stats?.totalRooms - stats?.vacantRooms}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <span className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                        Vacant Rooms
                                    </span>
                                    <span className="font-bold text-slate-900">{stats?.vacantRooms}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex justify-between text-sm text-slate-500">
                                    <span>Total Rooms: {stats?.totalRooms}</span>
                                    <Link to="/listings" className="text-primary hover:underline font-medium">Manage</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Actions (Top) -> Actions (Bottom) */}
                <div className="space-y-8">

                    {/* 1. Quick Links Card (Now on Top) */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 w-full">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link to="/tenants/add" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-primary/5 text-slate-700 hover:text-primary transition-all border border-transparent hover:border-primary/20 group">
                                <div className="p-2 bg-white rounded-md text-primary shadow-sm group-hover:scale-110 transition-transform">
                                    <UserPlus size={18} />
                                </div>
                                <span className="font-medium text-sm">Add New Tenant</span>
                            </Link>
                            <Link to="/finance/reports" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-primary/5 text-slate-700 hover:text-primary transition-all border border-transparent hover:border-primary/20 group">
                                <div className="p-2 bg-white rounded-md text-primary shadow-sm group-hover:scale-110 transition-transform">
                                    <TrendingUp size={18} />
                                </div>
                                <span className="font-medium text-sm">Financial Reports</span>
                            </Link>
                            <Link to="/settings" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-primary/5 text-slate-700 hover:text-primary transition-all border border-transparent hover:border-primary/20 group">
                                <div className="p-2 bg-white rounded-md text-primary shadow-sm group-hover:scale-110 transition-transform">
                                    <Settings size={18} />
                                </div>
                                <span className="font-medium text-sm">Property Settings</span>
                            </Link>
                        </div>
                    </div>

                    {/* 2. Action Center (Now below) */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h2 className="text-lg font-bold text-slate-900">Action Center</h2>
                            {actions.length > 0 && (
                                <span className="bg-red-50 text-primary text-xs font-bold px-2 py-1 rounded-md border border-red-100">{actions.length} New</span>
                            )}
                        </div>

                        <div className="divide-y divide-slate-50 overflow-y-auto custom-scrollbar">
                            {actions.length > 0 ? (
                                actions.map((action, i) => (
                                    <div key={i} className="p-5 hover:bg-slate-50 transition-colors">
                                        <div className="flex gap-4">
                                            <div className={`mt-1 flex-shrink-0 ${action.urgent ? 'text-red-500' : 'text-blue-500'}`}>
                                                <AlertTriangle size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 mb-1">{action.message}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-slate-500">{new Date(action.date).toLocaleDateString()}</span>
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
                                    <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                                        <CheckCircle size={24} />
                                    </div>
                                    <p className="text-slate-900 font-medium">All caught up!</p>
                                    <p className="text-slate-500 text-sm mt-1">No pending actions.</p>
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
