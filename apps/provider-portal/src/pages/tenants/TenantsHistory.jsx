"use client";

import { Download } from "lucide-react";
import { useState } from "react";

const tenantHistory = [
  {
    id: 1,
    tenantName: "Ahmed Khan",
    email: "ahmed@email.com",
    phone: "+92 300 123 4567",
    room: "Room 102",
    status: "Current",
    moveInDate: "2023-03-15",
    moveOutDate: null,
    paymentHistory: [
      {
        month: "January 2024",
        dueDate: "2024-01-01",
        paidDate: "2024-01-10",
        amount: 35000,
        status: "Paid",
      },
      {
        month: "December 2023",
        dueDate: "2023-12-01",
        paidDate: "2023-12-08",
        amount: 35000,
        status: "Paid",
      },
      {
        month: "November 2023",
        dueDate: "2023-11-01",
        paidDate: "2023-11-05",
        amount: 35000,
        status: "Paid",
      },
    ],
  },
  {
    id: 2,
    tenantName: "Fatima Ahmed",
    email: "fatima@email.com",
    phone: "+92 300 987 6543",
    room: "Room 105",
    status: "Current",
    moveInDate: "2023-06-20",
    moveOutDate: null,
    paymentHistory: [
      {
        month: "January 2024",
        dueDate: "2024-01-01",
        paidDate: "2024-01-08",
        amount: 45000,
        status: "Paid",
      },
      {
        month: "December 2023",
        dueDate: "2023-12-01",
        paidDate: "2023-12-10",
        amount: 45000,
        status: "Paid",
      },
      {
        month: "November 2023",
        dueDate: "2023-11-01",
        paidDate: "2023-11-12",
        amount: 45000,
        status: "Paid",
      },
    ],
  },
  {
    id: 3,
    tenantName: "Hassan Ali",
    email: "hassan@email.com",
    phone: "+92 300 555 7890",
    room: "Room 201",
    status: "Moved Out",
    moveInDate: "2022-09-10",
    moveOutDate: "2023-12-31",
    paymentHistory: [
      {
        month: "December 2023",
        dueDate: "2023-12-01",
        paidDate: "2023-12-05",
        amount: 40000,
        status: "Paid",
      },
      {
        month: "November 2023",
        dueDate: "2023-11-01",
        paidDate: "2023-11-08",
        amount: 40000,
        status: "Paid",
      },
      {
        month: "October 2023",
        dueDate: "2023-10-01",
        paidDate: "2023-10-12",
        amount: 40000,
        status: "Paid",
      },
    ],
  },
  {
    id: 4,
    tenantName: "Sara Khan",
    email: "sara@email.com",
    phone: "+92 300 222 3333",
    room: "Room 203",
    status: "Moved Out",
    moveInDate: "2021-05-15",
    moveOutDate: "2023-08-30",
    paymentHistory: [
      {
        month: "August 2023",
        dueDate: "2023-08-01",
        paidDate: "2023-08-10",
        amount: 38000,
        status: "Paid",
      },
      {
        month: "July 2023",
        dueDate: "2023-07-01",
        paidDate: "2023-07-08",
        amount: 38000,
        status: "Paid",
      },
    ],
  },
];

export default function TenantHistoryPage() {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredTenants =
    filterStatus === "All"
      ? tenantHistory
      : tenantHistory.filter((t) => t.status === filterStatus);

  return (
    <div className="max-w-7xl mx-auto">
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
              setSelectedTenant(null);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterStatus === status
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
                onClick={() => setSelectedTenant(tenant.id)}
                className={`w-full text-left p-4 transition-colors hover:bg-slate-50 ${
                  selectedTenant === tenant.id
                    ? "bg-red-50 border-l-4 border-red-500"
                    : ""
                }`}
              >
                <p className="font-medium text-slate-900">
                  {tenant.tenantName}
                </p>
                <p className="text-sm text-slate-600">{tenant.room}</p>
                <p
                  className={`text-xs mt-1 font-medium ${
                    tenant.status === "Current"
                      ? "text-green-600"
                      : "text-slate-600"
                  }`}
                >
                  {tenant.status}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTenant ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              {(() => {
                const tenant = tenantHistory.find(
                  (t) => t.id === selectedTenant,
                );
                return (
                  <>
                    <div className="p-6 border-b border-slate-200">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900">
                            {tenant?.tenantName}
                          </h3>
                          <p className="text-slate-600">{tenant?.room}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            tenant?.status === "Current"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {tenant?.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Email</p>
                          <p className="font-medium text-slate-900">
                            {tenant?.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600">Phone</p>
                          <p className="font-medium text-slate-900">
                            {tenant?.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600">Move In Date</p>
                          <p className="font-medium text-slate-900">
                            {new Date(
                              tenant?.moveInDate || "",
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {tenant?.moveOutDate && (
                          <div>
                            <p className="text-slate-600">Move Out Date</p>
                            <p className="font-medium text-slate-900">
                              {new Date(
                                tenant.moveOutDate,
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
                            {tenant?.paymentHistory.map((payment, i) => (
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
                      </div>
                    </div>
                  </>
                );
              })()}
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
