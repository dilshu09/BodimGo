import React from "react";
import { CheckCircle, Clock, FileText, ChevronRight, AlertCircle, Check, Trash2 } from "lucide-react";
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function PendingApprovals() {
    const [tasks, setTasks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedTask, setSelectedTask] = React.useState(null);
    const [selectedPendingTenant, setSelectedPendingTenant] = React.useState(null);
    const [loadingPendingTenant, setLoadingPendingTenant] = React.useState(false);
    const [actionLoading, setActionLoading] = React.useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchTasks = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/listings/pending-approvals', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    const order = { verification: 1, booking: 2, listing: 3 };
                    const sortedTasks = data.data.sort((a, b) => {
                        return (order[a.type] || 99) - (order[b.type] || 99);
                    });
                    setTasks(sortedTasks);
                }
            } catch (error) {
                console.error("Error fetching pending approvals:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const fetchPendingTenant = async (tenantId) => {
        setLoadingPendingTenant(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/tenants', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const tenant = data.data.find((tenant) => tenant._id === tenantId || tenant.id === tenantId);
                setSelectedPendingTenant(tenant || null);
            }
        } catch (error) {
            console.error('Error fetching pending tenant:', error);
            setSelectedPendingTenant(null);
        } finally {
            setLoadingPendingTenant(false);
        }
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        if (task.type === 'booking') {
            navigate(`/booking-action/${task.id}`);
        } else if (task.type === 'verification') {
            fetchPendingTenant(task.id);
        } else if (task.type === 'listing') {
            navigate(`/listings/${task.id}`);
        }
    };

    const approvePendingTenant = async () => {
        if (!selectedPendingTenant) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/tenants/${selectedPendingTenant._id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'Active' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`${selectedPendingTenant.name} has been approved!`);
                setSelectedTask(null);
                setSelectedPendingTenant(null);
                // Refresh tasks list
                const taskRes = await fetch('http://localhost:5000/api/listings/pending-approvals', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const taskData = await taskRes.json();
                if (taskData.success) {
                    const order = { verification: 1, booking: 2, listing: 3 };
                    const sortedTasks = taskData.data.sort((a, b) => (order[a.type] || 99) - (order[b.type] || 99));
                    setTasks(sortedTasks);
                }
            } else {
                toast.error('Failed to approve tenant');
            }
        } catch (error) {
            console.error('Error approving tenant:', error);
            toast.error('Error approving tenant');
        } finally {
            setActionLoading(false);
        }
    };

    const rejectPendingTenant = async () => {
        if (!selectedPendingTenant) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/tenants/${selectedPendingTenant._id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'Rejected' })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Pending request for ${selectedPendingTenant.name} has been rejected.`);
                setSelectedTask(null);
                setSelectedPendingTenant(null);
                // Refresh tasks list
                const taskRes = await fetch('http://localhost:5000/api/listings/pending-approvals', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const taskData = await taskRes.json();
                if (taskData.success) {
                    const order = { verification: 1, booking: 2, listing: 3 };
                    const sortedTasks = taskData.data.sort((a, b) => (order[a.type] || 99) - (order[b.type] || 99));
                    setTasks(sortedTasks);
                }
            } else {
                toast.error('Failed to reject tenant');
            }
        } catch (error) {
            console.error('Error rejecting tenant:', error);
            toast.error('Error rejecting tenant');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 max-w-7xl mx-auto">Loading pending items...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Pending Approvals</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Action items requiring your attention</p>
            </div>

            {selectedTask && selectedTask.type === 'verification' && (
                <div className="mb-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pending Tenant Approval</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review the specific tenant verification request for this card.</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-200 text-xs uppercase tracking-[0.18em] font-semibold">Pending</span>
                    </div>
                    {loadingPendingTenant ? (
                        <div className="text-sm text-slate-500 dark:text-slate-400">Loading selected tenant details...</div>
                    ) : selectedPendingTenant ? (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-base font-semibold text-slate-900 dark:text-white">{selectedPendingTenant.name || 'Unnamed Tenant'}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedPendingTenant.email}</p>
                                </div>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-200">Pending</span>
                            </div>
                            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Listing: {selectedPendingTenant.listingTitle || 'Unknown'}</p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Room: {selectedPendingTenant.room || 'Unassigned'}</p>
                            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Status: {selectedPendingTenant.status}</p>
                            
                            <div className="mt-6 flex gap-3">
                                <button 
                                    onClick={approvePendingTenant}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors"
                                >
                                    <Check size={18} />
                                    Approve
                                </button>
                                <button 
                                    onClick={rejectPendingTenant}
                                    disabled={actionLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                    Reject
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 dark:text-slate-400">No tenant details found for this verification request.</div>
                    )}
                </div>
            )}

            <div className="space-y-4">
                {tasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        No pending approvals found. You are all caught up!
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => handleTaskClick(task)}
                            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-colors group cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full ${task.status === "urgent" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                    }`}>
                                    {task.status === "urgent" ? <AlertCircle size={24} /> : <Clock size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {task.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mt-1">{task.description}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                                            {task.type.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-slate-400 dark:text-slate-500">{task.date}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="p-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
