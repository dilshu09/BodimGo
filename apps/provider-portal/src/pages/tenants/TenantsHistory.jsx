"use client";

import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5000/api"; // Adjust if needed

export default function TenantHistoryPage() {
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/tenants`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Map backend data to frontend structure
      const formattedTenants = res.data.data.map(t => ({
        id: t._id,
        tenantName: t.name,
        email: t.email,
        phone: t.phone,
        room: t.roomId,
        status: t.status === 'Active' ? 'Current' : t.status, // Map 'Active' to 'Current' for UI consistency if needed
        moveInDate: t.joinedDate || t.createdAt,
        moveOutDate: null, // Not currently tracked in backend
        paymentHistory: t.paymentHistory || [],
      }));

      setTenants(formattedTenants);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to load tenant history");
      setLoading(false);
    }
  };

  const filteredTenants =
    filterStatus === "All"
      ? tenants
      : tenants.filter((t) => {
        if (filterStatus === 'Current') return t.status === 'Current' || t.status === 'Active';
        if (filterStatus === 'Moved Out') return t.status === 'Moved Out';
        return t.status === filterStatus;
      });

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  if (loading) {
    return <div className="p-8"><div className="text-center text-slate-500">Loading history...</div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Tenant History</h2>
        <p className="text-slate-600 mt-1">
          Current and past tenants with payment history
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        {["All", "Current", "Moved Out"].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilterStatus(status);
              setSelectedTenantId(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === status
              ? "bg-red-500 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">
              Tenants ({filteredTenants.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {filteredTenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => setSelectedTenantId(tenant.id)}
                className={`w-full text-left p-4 transition-colors hover:bg-slate-50 ${selectedTenantId === tenant.id
                  ? "bg-red-50 border-l-4 border-red-500"
                  : ""
                  }`}
              >
                <p className="font-medium text-slate-900">
                  {tenant.tenantName}
                </p>
                <p className="text-sm text-slate-600">{tenant.room}</p>
                <p
                  className={`text-xs mt-1 font-medium ${tenant.status === "Current" || tenant.status === "Active"
                    ? "text-green-600"
                    : "text-slate-600"
                    }`}
                >
                  {tenant.status}
                </p>
              </button>
            ))}
            {filteredTenants.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-sm">No tenants found.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTenant ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <>
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {selectedTenant.tenantName}
                      </h3>
                      <p className="text-slate-600">{selectedTenant.room}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${selectedTenant.status === "Current" || selectedTenant.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-700"
                        }`}
                    >
                      {selectedTenant.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Email</p>
                      <p className="font-medium text-slate-900">
                        {selectedTenant.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Phone</p>
                      <p className="font-medium text-slate-900">
                        {selectedTenant.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Move In Date</p>
                      <p className="font-medium text-slate-900">
                        {new Date(
                          selectedTenant.moveInDate || "",
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedTenant.moveOutDate && (
                      <div>
                        <p className="text-slate-600">Move Out Date</p>
                        <p className="font-medium text-slate-900">
                          {new Date(
                            selectedTenant.moveOutDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">
                    Payment History
                  </h4>
                  <div className="overflow-x-auto">
                    {selectedTenant.paymentHistory.length === 0 ? (
                      <div className="text-slate-500 text-sm italic">No payment history available.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900">
                              Month
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900">
                              Due Date
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900">
                              Paid Date
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-slate-900">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedTenant.paymentHistory.map((payment, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {payment.month}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {new Date(
                                  payment.dueDate,
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {new Date(
                                  payment.paidDate,
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900">
                                Rs. {payment.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                  {payment.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors">
                                  <Download size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-slate-600">
                Select a tenant to view details and payment history
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
