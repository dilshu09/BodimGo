'use client'
import React, { useState, useEffect } from "react";
import { Mail, Phone, CreditCard, Eye, ChevronDown, ChevronUp, Edit2, LogOut, Check, X } from 'lucide-react'
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5000/api"; // Adjust if needed

export default function ActiveTenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for inline actions
  const [expandedTenantId, setExpandedTenantId] = useState(null);
  const [actionType, setActionType] = useState('details'); // 'details', 'edit', 'move-out'

  // Form states
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [editFormData, setEditFormData] = useState({});

  // Manual Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], method: 'cash' });
  const [selectedTenantForPayment, setSelectedTenantForPayment] = useState(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/tenants`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Flatten data slightly for easier display
      const formattedTenants = res.data.data.map(t => ({
        id: t._id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        room: t.roomId, // Or handle if roomId is an ID vs string
        address: t.address,
        nic: t.nic,
        checkInDate: t.createdAt, // Fallback if no specific checkInDate
        monthlyRent: t.rentAmount,
        currentMonth: t.currentMonth || { paid: false, date: null },
        status: (t.status.toLowerCase() === 'active' || t.status === 'Pending') ? 'Active' : t.status,
        paymentHistory: t.paymentHistory || []
      }));

      // Filter: Show anyone NOT Moved Out or Evicted (case-insensitive check)
      const activeTenantsList = formattedTenants.filter(t => {
        const s = t.status.toLowerCase();
        return s !== 'moved out' && s !== 'evicted';
      });

      setTenants(activeTenantsList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to load tenants");
      setLoading(false);
    }
  };

  const toggleExpand = (id, type = 'details') => {
    // If clicking the same thing, close it
    if (expandedTenantId === id && actionType === type) {
      setExpandedTenantId(null);
      setActionType(null);
      return;
    }

    // Otherwise open/switch
    setExpandedTenantId(id);
    setActionType(type);

    // Initialize form data
    const tenant = tenants.find(t => t.id === id);
    if (tenant && type === 'edit') {
      setEditFormData({
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        nic: tenant.nic,
        address: tenant.address,
        rentAmount: tenant.monthlyRent
      });
    }
  };

  const confirmMoveOut = async (tenantId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/tenants/${tenantId}/status`, {
        status: 'Moved Out',
        movedOutDate: moveOutDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Tenant moved out successfully");
      setExpandedTenantId(null);
      fetchTenants();
    } catch (error) {
      console.error("Error moving out tenant:", error);
      const msg = error.response?.data?.message || "Failed to move out tenant";
      toast.error(msg);
    }
  };

  const handleEditSubmit = async (tenantId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/tenants/${tenantId}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Tenant details updated");
      setExpandedTenantId(null);
      fetchTenants();
    } catch (error) {
      console.error("Error updating tenant:", error);
      toast.error("Failed to update tenant");
    }
  };

  const openPaymentModal = (tenant) => {
    setSelectedTenantForPayment(tenant);
    setPaymentData({
      amount: tenant.monthlyRent || '',
      date: new Date().toISOString().split('T')[0],
      method: 'cash'
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/payments/manual`, {
        tenantId: selectedTenantForPayment.id,
        amount: paymentData.amount,
        method: paymentData.method,
        date: paymentData.date
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Payment recorded successfully");
      setShowPaymentModal(false);
      fetchTenants(); // Refresh to update status
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  if (loading) {
    return <div className="p-8"><div className="text-center text-slate-500">Loading tenants...</div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Active Tenants</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Current tenants in your boarding</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-red-500">{tenants.length}</div>
          <p className="text-slate-600 dark:text-slate-400">Total Active Tenants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tenants.map((tenant) => (
          <div key={tenant.id} className={`group bg-white dark:bg-slate-900 rounded-xl shadow-sm border transition-all duration-300 ${expandedTenantId === tenant.id ? 'border-blue-200 dark:border-blue-800 ring-4 ring-blue-50 dark:ring-blue-900/20 transition-none' : 'border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-[#FF385C] dark:hover:border-[#FF385C] hover:-translate-y-1'}`}>

            {/* Top Row: Basic Info and Status */}
            <div className="p-6 pb-0">
              <div className="flex items-start justify-between mb-4 pr-16">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tenant.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Room: {tenant.room}</p>
                </div>
                <div className="flex gap-2">
                  {!tenant.currentMonth.paid && tenant.status !== 'Moved Out' && tenant.status !== 'Evicted' && (
                    <button
                      onClick={() => openPaymentModal(tenant)}
                      className="px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-1"
                    >
                      Pending <span className="text-xs underline ml-1">(Pay)</span>
                    </button>
                  )}
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${tenant.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {tenant.status}
                  </span>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-red-500" />
                    <p className="text-sm text-slate-900 dark:text-slate-300 truncate">{tenant.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-red-500" />
                    <p className="text-sm text-slate-900 dark:text-slate-300">{tenant.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Monthly Rent</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Rs. {(tenant.monthlyRent || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Check-in Date</p>
                  <p className="text-sm text-slate-900 dark:text-slate-300">{new Date(tenant.checkInDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Expanded Content Section */}
            {expandedTenantId === tenant.id && (
              <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {/* VIEW MODE */}
                  {actionType === 'details' && (
                    <>
                      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                        <h4 className="font-bold text-slate-800 dark:text-white">Full Details</h4>
                        <div className="flex gap-2">
                          <button onClick={() => toggleExpand(tenant.id, 'edit')} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 font-medium text-slate-700 dark:text-slate-200 transition">
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("Clicking Move Out for:", tenant.id);
                              toggleExpand(tenant.id, 'move-out');
                            }}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 rounded-lg hover:bg-red-50 font-medium text-red-600 transition"
                          >
                            <LogOut size={12} /> Move Out
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                        <div><label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Full Name</label><p className="text-sm font-medium text-slate-900 dark:text-white">{tenant.name}</p></div>
                        <div><label className="text-xs text-slate-500 dark:text-slate-400 uppercase">NIC / ID</label><p className="text-sm font-medium text-slate-900 dark:text-white">{tenant.nic || 'N/A'}</p></div>
                        <div className="col-span-2 md:col-span-1"><label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Address</label><p className="text-sm font-medium text-slate-900 dark:text-white">{tenant.address || 'N/A'}</p></div>
                        <div><label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Email</label><p className="text-sm font-medium text-slate-900 dark:text-white break-all">{tenant.email}</p></div>
                        <div><label className="text-xs text-slate-500 dark:text-slate-400 uppercase">Phone</label><p className="text-sm font-medium text-slate-900 dark:text-white">{tenant.phone}</p></div>
                      </div>
                    </>
                  )}

                  {/* EDIT MODE */}
                  {actionType === 'edit' && (
                    <div className="max-w-3xl">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Edit2 size={16} /> Edit Details</h4>
                        <button onClick={() => toggleExpand(tenant.id, 'details')} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">Cancel</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Full Name</label><input value={editFormData.name || ''} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label><input value={editFormData.phone || ''} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">NIC</label><input value={editFormData.nic || ''} onChange={(e) => setEditFormData({ ...editFormData, nic: e.target.value })} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg text-sm" /></div>
                        <div className="col-span-2"><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label><input value={editFormData.email || ''} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg text-sm" /></div>
                        <div className="col-span-2"><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Address</label><input value={editFormData.address || ''} onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Rent Amount</label><input type="number" value={editFormData.rentAmount || ''} onChange={(e) => setEditFormData({ ...editFormData, rentAmount: e.target.value })} className="w-full p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg text-sm" /></div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <button onClick={() => toggleExpand(tenant.id, 'details')} className="px-3 py-1.5 text-sm border rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                        <button onClick={() => handleEditSubmit(tenant.id)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"><Check size={14} /> Save Changes</button>
                      </div>
                    </div>
                  )}

                  {/* MOVE OUT MODE */}
                  {actionType === 'move-out' && (
                    <div className="max-w-xl">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                        <h4 className="font-bold text-red-700 flex items-center gap-2"><LogOut size={16} /> Move Out Tenant</h4>
                        <button onClick={() => toggleExpand(tenant.id, 'details')} className="text-xs text-slate-500 hover:text-slate-700 underline">Cancel</button>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">Are you sure you want to move <strong>{tenant.name}</strong> out? This will move them to history and free up the room.</p>
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Move Out Date</label>
                        <input type="date" value={moveOutDate} onChange={(e) => setMoveOutDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggleExpand(tenant.id, 'details')} className="px-3 py-1.5 text-sm border rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                        <button onClick={() => confirmMoveOut(tenant.id)} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Confirm Move Out</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Bar: Payment Status and View Button */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 pt-4 rounded-b-lg bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-red-500" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Current Month Payment</p>
                    <p className={`text-sm font-bold ${tenant.currentMonth.paid ? 'text-green-600' : 'text-red-600'}`}>
                      {tenant.currentMonth.paid && tenant.currentMonth.date ? `✓ Paid on ${new Date(tenant.currentMonth.date).toLocaleDateString()}` : 'Not Paid'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleExpand(tenant.id, 'details')}
                  className={`px-4 py-2 border rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${expandedTenantId === tenant.id
                    ? 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm'
                    : 'border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                    }`}
                >
                  {expandedTenantId === tenant.id ? (
                    <>
                      <ChevronUp size={16} /> Hide
                    </>
                  ) : (
                    <>
                      <Eye size={16} /> View Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
        {tenants.length === 0 && (
          <div className="text-center text-slate-500 py-10">No active tenants found.</div>
        )}
      </div>

      {/* Manual Payment Modal */}
      {showPaymentModal && selectedTenantForPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Record Manual Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Marking payment for <strong className="text-slate-900 dark:text-white">{selectedTenantForPayment.name}</strong>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (Rs.)</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentData.method}
                    onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Direct Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={paymentData.date}
                    onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <Check size={18} /> Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
