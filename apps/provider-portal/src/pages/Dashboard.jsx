import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserPlus, FileText, ChevronDown } from 'lucide-react';
import SummaryCards from '../components/dashboard/SummaryCards';
import TaskCenter from '../components/dashboard/TaskCenter';

const Dashboard = () => {
    // Property Switcher State
    const [selectedProperty, setSelectedProperty] = useState("All Properties");
    const [stats, setStats] = useState(null);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:5000/api";

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/listings/dashboard/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success) {
                    setStats(data.stats);
                    setPendingApprovals(data.pendingApprovals);
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
        return <div className="p-8 max-w-7xl mx-auto">Loading dashboard...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-neutral-500 text-sm">Viewing:</span>
                        <div className="relative group">
                            <button className="flex items-center gap-1 font-semibold text-primary hover:text-primary-dark">
                                {selectedProperty} <ChevronDown size={14} />
                            </button>
                            {/* Mock Dropdown */}
                            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-neutral-100 shadow-xl rounded-xl hidden group-hover:block z-20">
                                <div className="p-1">
                                    <button onClick={() => setSelectedProperty("All Properties")} className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg">All Properties</button>
                                    <button onClick={() => setSelectedProperty("Kaduwela Annex")} className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg">Kaduwela Annex</button>
                                    <button onClick={() => setSelectedProperty("Colombo 3 Villa")} className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 rounded-lg">Colombo 3 Villa</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to="/agreements"
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 font-medium rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
                    >
                        <FileText size={18} />
                        Templates
                    </Link>
                    <Link
                        to="/tenants/add"
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-neutral-200 text-neutral-600 font-medium rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
                    >
                        <UserPlus size={18} />
                        Add Tenant
                    </Link>
                    <Link
                        to="/add-listing"
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25"
                    >
                        <Plus size={18} />
                        Create Listing
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <SummaryCards stats={stats} />

            {/* Task Center */}
            <TaskCenter pendingApprovals={pendingApprovals} />

            {/* Recent Activity / Graph (Placeholder for Phase 2) */}
            <div className="mt-8 bg-white rounded-2xl border border-neutral-100 p-8 text-center">
                <h3 className="text-lg font-bold text-neutral-400 mb-2">Revenue Analytics</h3>
                <p className="text-sm text-neutral-400">Detailed financial charts coming in monthly report.</p>
            </div>
        </div>
    );
};

export default Dashboard;
