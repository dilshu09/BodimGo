import React from 'react';
import {
    Users,
    Home,
    DollarSign,
    ShieldCheck,
    TrendingUp,
    AlertCircle
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

const mockData = [
    { name: 'Jan', active: 400, new: 240 },
    { name: 'Feb', active: 300, new: 139 },
    { name: 'Mar', active: 200, new: 980 },
    { name: 'Apr', active: 278, new: 390 },
    { name: 'May', active: 189, new: 480 },
    { name: 'Jun', active: 239, new: 380 },
    { name: 'Jul', active: 349, new: 430 },
];

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

export default function Dashboard() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value="12,450" change={12} icon={Users} color="blue" />
                <StatCard title="Active Listings" value="3,210" change={-2} icon={Home} color="primary" />
                <StatCard title="Revenue (Net)" value="Rs. 4.2M" change={24} icon={DollarSign} color="green" />
                <StatCard title="Pending Checks" value="45" change={5} icon={ShieldCheck} color="orange" />
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
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockData}>
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
                        <h3 className="text-lg font-bold text-neutral-900">Risk Alerts</h3>
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">4 New</span>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group border border-transparent hover:border-neutral-100">
                                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                                    <AlertCircle size={20} className="text-red-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-neutral-800 group-hover:text-primary transition-colors">Suspicious Activity</p>
                                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">Multiple duplicate listings detected from IP 192.168.1.1</p>
                                    <p className="text-[10px] uppercase font-bold text-neutral-400 mt-2 tracking-wide">2 mins ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all">
                        View Moderation Queue
                    </button>
                </div>
            </div>
        </div>
    );
}
