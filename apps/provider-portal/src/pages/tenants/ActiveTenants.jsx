'use client'
import { Mail, Phone, CreditCard, Eye } from 'lucide-react'

const activeTenants = [
  {
    id: 1,
    name: 'Ahmed Khan',
    email: 'ahmed@example.com',
    phone: '+92 300 123 4567',
    room: 'Room 102',
    checkInDate: '2024-01-15',
    monthlyRent: 35000,
    currentMonth: { paid: true, date: '2024-01-10' },
    status: 'Active'
  },
  {
    id: 2,
    name: 'Fatima Ahmed',
    email: 'fatima@example.com',
    phone: '+92 321 456 7890',
    room: 'Room 105',
    checkInDate: '2023-11-20',
    monthlyRent: 45000,
    currentMonth: { paid: true, date: '2024-01-08' },
    status: 'Active'
  },
  {
    id: 3,
    name: 'Hassan Ali',
    email: 'hassan@example.com',
    phone: '+92 333 789 0123',
    room: 'Room 203',
    checkInDate: '2024-02-01',
    monthlyRent: 30000,
    currentMonth: { paid: false, date: null },
    status: 'Pending Payment'
  },
  {
    id: 4,
    name: 'Sara Khan',
    email: 'sara@example.com',
    phone: '+92 345 234 5678',
    room: 'Room 301',
    checkInDate: '2023-12-10',
    monthlyRent: 35000,
    currentMonth: { paid: true, date: '2024-01-12' },
    status: 'Active'
  },
]

export default function ActiveTenantsPage() {
  return (

    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Active Tenants</h2>
          <p className="text-slate-600 mt-1">Current tenants in your boarding</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-red-500">{activeTenants.length}</div>
          <p className="text-slate-600">Total Active Tenants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTenants.map((tenant) => (
          <div key={tenant.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{tenant.name}</h3>
                <p className="text-slate-600 text-sm">Room: {tenant.room}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${tenant.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                {tenant.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-red-500" />
                  <p className="text-sm text-slate-900 truncate">{tenant.email}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-red-500" />
                  <p className="text-sm text-slate-900">{tenant.phone}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Monthly Rent</p>
                <p className="text-sm font-bold text-slate-900">Rs. {tenant.monthlyRent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Check-in Date</p>
                <p className="text-sm text-slate-900">{new Date(tenant.checkInDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-red-500" />
                  <div>
                    <p className="text-xs text-slate-500">Current Month Payment</p>
                    <p className={`text-sm font-bold ${tenant.currentMonth.paid ? 'text-green-600' : 'text-red-600'}`}>
                      {tenant.currentMonth.paid && tenant.currentMonth.date ? `✓ Paid on ${new Date(tenant.currentMonth.date).toLocaleDateString()}` : 'Not Paid'}
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center gap-2">
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

  )
}
