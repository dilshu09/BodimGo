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
        status: t.status === 'Active' ? 'Active' : t.status,
        paymentHistory: t.paymentHistory || []
      }));

      // Filter: Show if status is Active OR has at least one past payment
      const activeTenantsList = formattedTenants.filter(t =>
        t.status === 'Active' || t.paymentHistory.length > 0
      );

      setTenants(activeTenantsList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to load tenants");
      setLoading(false);
    }
  };

  const toggleExpand = (id, type = 'details') => {
    if (expandedTenantId === id && actionType === type) {
      setExpandedTenantId(null);
      setActionType(null);
    } else {
      setExpandedTenantId(id);
      setActionType(type);

      // Initialize form data when opening specific modes
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
      if (type === 'move-out') {
        setMoveOutDate(new Date().toISOString().split('T')[0]);
      }
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
      toast.error("Failed to move out tenant");
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

  if (loading) {
    return <div className="p-8"><div className="text-center text-slate-500">Loading tenants...</div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Active Tenants</h2>
          <p className="text-slate-600 mt-1">Current tenants in your boarding</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-red-500">{tenants.length}</div>
          <p className="text-slate-600">Total Active Tenants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tenants.map((tenant) => (
          <div key={tenant.id} className={`bg-white rounded-lg shadow-sm border transition-all duration-200 ${expandedTenantId === tenant.id ? 'border-blue-200 ring-4 ring-blue-50' : 'border-slate-200 hover:shadow-md'}`}>

            {/* Top Row: Basic Info and Status */}
            <div className="p-6 pb-0">
              <div className="flex items-start justify-between mb-4 pr-16">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{tenant.name}</h3>
                  <p className="text-slate-600 text-sm">Room: {tenant.room}</p>
                </div>
                <div className="flex gap-2">
                  {!tenant.currentMonth.paid && tenant.status === 'Active' && (
                    <span className="px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700">
                      Pending
                    </span>
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
                  <p className="text-sm font-bold text-slate-900">Rs. {(tenant.monthlyRent || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Check-in Date</p>
                  <p className="text-sm text-slate-900">{new Date(tenant.checkInDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Expanded Content Section */}
            {expandedTenantId === tenant.id && (
              <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                  {/* VIEW MODE */}
                  {actionType === 'details' && (
                    <>
                      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                        <h4 className="font-bold text-slate-800">Full Details</h4>
                        <div className="flex gap-2">
                          <button onClick={() => toggleExpand(tenant.id, 'edit')} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition">
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={() => toggleExpand(tenant.id, 'move-out')} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 rounded-lg hover:bg-red-50 font-medium text-red-600 transition">
                            <LogOut size={12} /> Move Out
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                        <div><label className="text-xs text-slate-500 uppercase">Full Name</label><p className="text-sm font-medium text-slate-900">{tenant.name}</p></div>
                        <div><label className="text-xs text-slate-500 uppercase">NIC / ID</label><p className="text-sm font-medium text-slate-900">{tenant.nic || 'N/A'}</p></div>
                        <div className="col-span-2 md:col-span-1"><label className="text-xs text-slate-500 uppercase">Address</label><p className="text-sm font-medium text-slate-900">{tenant.address || 'N/A'}</p></div>
                        <div><label className="text-xs text-slate-500 uppercase">Email</label><p className="text-sm font-medium text-slate-900 break-all">{tenant.email}</p></div>
                        <div><label className="text-xs text-slate-500 uppercase">Phone</label><p className="text-sm font-medium text-slate-900">{tenant.phone}</p></div>
                      </div>
                    </>
                  )}

                  {/* EDIT MODE */}
                  {actionType === 'edit' && (
                    <div className="max-w-3xl">
                      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><Edit2 size={16} /> Edit Details</h4>
                        <button onClick={() => toggleExpand(tenant.id, 'details')} className="text-xs text-slate-500 hover:text-slate-700 underline">Cancel</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label><input value={editFormData.name || ''} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Phone</label><input value={editFormData.phone || ''} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">NIC</label><input value={editFormData.nic || ''} onChange={(e) => setEditFormData({ ...editFormData, nic: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm" /></div>
                        <div className="col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Email</label><input value={editFormData.email || ''} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm" /></div>
                        <div className="col-span-2"><label className="block text-xs font-medium text-slate-500 mb-1">Address</label><input value={editFormData.address || ''} onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm" /></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Rent Amount</label><input type="number" value={editFormData.rentAmount || ''} onChange={(e) => setEditFormData({ ...editFormData, rentAmount: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm" /></div>
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
            <div className="border-t border-slate-200 p-4 pt-4 rounded-b-lg bg-slate-50/50">
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
                <button
                  onClick={() => toggleExpand(tenant.id, 'details')}
                  className={`px-4 py-2 border rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${expandedTenantId === tenant.id
                      ? 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50 shadow-sm'
                      : 'border-red-500 text-red-500 hover:bg-red-50'
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
    </div>
  )
}
