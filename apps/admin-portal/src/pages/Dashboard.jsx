import React from 'react';
import {
    Users,
    Home,
    DollarSign,
    ShieldCheck,
    TrendingUp,
    AlertCircle,
    MessageSquare
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';



// ... (imports remain same)
// Keeping components in same file for brevity, but improving styling

const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-neutral-500 text-sm font-semibold mb-2">{title}</p>
                <h3 className="text-3xl font-extrabold text-neutral-900 tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-orange-50`}> {/* Using fixed color for now or map color prop properly */}
                <Icon size={24} className="text-primary" />
            </div>
        </div>
        <div className={`flex items-center gap-1.5 mt-4 text-sm font-semibold ${change >= 0 ? 'text-emerald-600 bg-emerald-50 self-start inline-block px-2 py-1 rounded-lg' : 'text-red-600 bg-red-50 inline-block px-2 py-1 rounded-lg'}`}>
            <TrendingUp size={14} className={change < 0 ? 'rotate-180' : ''} />
            <span>{Math.abs(change)}% from last month</span>
        </div>
    </div>
);

import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeListings: 0,
        revenue: 0,
        pendingReviews: 0,
        chartData: []
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                console.log("Dashboard Stats Fetched:", res.data);
                console.log("Chart Data:", res.data.chartData);
                setStats(res.data);

                // Fetch Recent Tickets from API
                try {
                    const ticketRes = await api.get('/tickets/admin/all');
                    setRecentTickets(ticketRes.data.slice(0, 5)); // Take first 5
                } catch (err) {
                    console.error("Failed to fetch recent tickets", err);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
                if (error.response) {
                    console.error("Error Response:", error.response.status, error.response.data);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-neutral-500">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    change={stats.usersGrowth || 0}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Active Listings"
                    value={stats.activeListings.toLocaleString()}
                    change={stats.listingsGrowth || 0}
                    icon={Home}
                    color="primary"
                />
                <StatCard
                    title="Revenue (Net)"
                    value={`Rs. ${stats.revenue.toLocaleString()}`}
                    change={stats.revenueGrowth || 0}
                    icon={DollarSign}
                    color="green"
                />
                <StatCard
                    title="Pending Reviews"
                    value={stats.pendingReviews}
                    change={stats.pendingGrowth || 0}
                    icon={ShieldCheck}
                    color="orange"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-neutral-900">User Growth</h3>
                            <p className="text-sm text-neutral-500">New user registrations over time</p>
                        </div>
                        <select className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-neutral-100 transition-colors cursor-pointer">
                            <option>Last 6 Months</option>
                            <option>Last Year</option>
                        </select>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF385C" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#FF385C" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#717171', fontSize: 12, fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#717171', fontSize: 12, fontWeight: 500 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ color: '#222', fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="active" stroke="#FF385C" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-neutral-900">Recent Messages</h3>
                        {recentTickets.length > 0 && (
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{recentTickets.length} New</span>
                        )}
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {recentTickets.length === 0 && (
                            <p className="text-sm text-neutral-500 text-center py-8">No new messages</p>
                        )}
                        {recentTickets.map((ticket) => (
                            <div key={ticket._id} className="flex gap-4 p-4 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group border border-transparent hover:border-neutral-100">
                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                    <MessageSquare size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-neutral-800 group-hover:text-primary transition-colors">{ticket.subject}</p>
                                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed line-clamp-2">{ticket.message}</p>
                                    <p className="text-[10px] uppercase font-bold text-neutral-400 mt-2 tracking-wide flex items-center gap-2">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-500'}`}>
                                            {ticket.priority}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all">
                        View All Messages
                    </button>
                </div>
            </div>
        </div>
    );
}
