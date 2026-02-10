import { BedDouble, Users, DollarSign, AlertCircle } from 'lucide-react';

const Card = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-neutral-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-neutral-800">{value}</h3>
            {subtext && <p className={`text-xs mt-1 ${subtext.includes('+') ? 'text-green-600' : 'text-neutral-400'}`}>{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
    </div>
);

const SummaryCards = ({ stats }) => {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card
                title="Occupancy Rate"
                value={`${stats.occupancyRate}%`}
                subtext={`${stats.vacantBeds} beds available`}
                icon={Users}
                color="bg-blue-500"
            />
            <Card
                title="Vacant Beds"
                value={stats.vacantBeds}
                subtext="Ready to move in"
                icon={BedDouble}
                color="bg-orange-400"
            />
            <Card
                title="Expected Income"
                value={`LKR ${(stats.expectedIncome || 0).toLocaleString()}`}
                subtext="From active tenants"
                icon={DollarSign}
                color="bg-green-500"
            />
            <Card
                title="Pending Actions"
                value={stats.pendingCount}
                subtext={`${stats.pendingCount} Booking Requests`}
                icon={AlertCircle}
                color="bg-red-500"
            />
        </div>
    );
};

export default SummaryCards;
