import React from "react";
import { CheckCircle, Clock, FileText, ChevronRight, AlertCircle } from "lucide-react";

import { useNavigate } from 'react-router-dom';

export default function PendingApprovals() {
    const [tasks, setTasks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
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
                    setTasks(data.data);
                }
            } catch (error) {
                console.error("Error fetching pending approvals:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    const handleTaskClick = (task) => {
        if (task.type === 'booking') {
            navigate(`/booking-action/${task.id}`);
        } else if (task.type === 'verification') {
            navigate(`/tenants`); // Or specific tenant page if available
        } else if (task.type === 'listing') {
            navigate(`/listings`); // Or edit listing page
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
