import { CheckCircle, Clock, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

const TaskPanel = ({ title, items, icon: Icon, color, link }) => (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.replace('bg-', '')}`}>
                    <Icon size={20} />
                </div>
                <h3 className="font-bold text-neutral-800">{title}</h3>
            </div>
            <Link to={link || '#'} className="text-xs font-semibold text-primary hover:underline">View All</Link>
        </div>

        <div className="space-y-4">
            {items.length > 0 ? (
                items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer">
                        <div>
                            <p className="font-semibold text-sm text-neutral-800">{item.title}</p>
                            <p className="text-xs text-neutral-500">{item.subtitle}</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-white border border-neutral-200 rounded-md">
                            {item.action}
                        </span>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-neutral-400 text-sm">No pending items.</div>
            )}
        </div>
    </div>
);

const TaskCenter = ({ pendingApprovals = [], upcomingPayments = [], overdue = [] }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TaskPanel
                title="Pending Approvals"
                items={pendingApprovals}
                icon={CheckCircle}
                color="bg-blue-500 text-blue-600"
                link="/bookings"
            />
            <TaskPanel
                title="Payments Due Soon"
                items={upcomingPayments}
                icon={Clock}
                color="bg-orange-500 text-orange-600"
                link="/finance"
            />
            <TaskPanel
                title="Overdue Payments"
                items={overdue}
                icon={AlertOctagon}
                color="bg-red-500 text-red-600"
                link="/finance/invoices"
            />
        </div>
    );
};

export default TaskCenter;
