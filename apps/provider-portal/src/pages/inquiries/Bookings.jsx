"use client";

import { Eye, CheckCircle, XCircle, ChevronDown, Download } from "lucide-react";

const bookings = [
  {
    id: 1,
    guestName: "Muhammad Hassan",
    email: "mhassan@example.com",
    room: "Room 102",
    checkIn: "2024-02-01",
    checkOut: "2024-02-15",
    nights: 14,
    totalPrice: 49000,
    status: "Confirmed",
    paymentStatus: "Paid",
  },
  {
    id: 2,
    guestName: "Zainab Ali",
    email: "zainab@example.com",
    room: "Room 103",
    checkIn: "2024-02-05",
    checkOut: "2024-02-20",
    nights: 15,
    totalPrice: 52500,
    status: "Pending Confirmation",
    paymentStatus: "Pending",
  },
  {
    id: 3,
    guestName: "Imran Khan",
    email: "imran@example.com",
    room: "Room 105",
    checkIn: "2024-01-25",
    checkOut: "2024-02-08",
    nights: 14,
    totalPrice: 63000,
    status: "Confirmed",
    paymentStatus: "Paid",
  },
  {
    id: 4,
    guestName: "Ayesha Ahmed",
    email: "ayesha@example.com",
    room: "Room 201",
    checkIn: "2024-02-10",
    checkOut: "2024-02-25",
    nights: 15,
    totalPrice: 52500,
    status: "Cancelled",
    paymentStatus: "Refunded",
  },
];

export default function BookingsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Bookings</h2>
          <p className="text-neutral-500 mt-2">
            Track and manage all your incoming reservations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Total Bookings</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {bookings.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Confirmed</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {bookings.filter((b) => b.status === "Confirmed").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {bookings.filter((b) => b.status === "Pending Confirmation").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            Rs.{" "}
            {bookings
              .filter((b) => b.paymentStatus === "Paid")
              .reduce((sum, b) => sum + b.totalPrice, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Guest Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Room
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Check-in
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Check-out
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Total Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {booking.guestName}
                      </p>
                      <p className="text-xs text-slate-600">{booking.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-900">{booking.room}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(booking.checkIn).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(booking.checkOut).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    Rs. {booking.totalPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${booking.status === "Confirmed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "Pending Confirmation"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                        }`}
                    >
                      {booking.status === "Confirmed" && (
                        <CheckCircle size={14} />
                      )}
                      {booking.status === "Cancelled" && <XCircle size={14} />}
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.paymentStatus === "Paid"
                        ? "bg-green-100 text-green-700"
                        : booking.paymentStatus === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-slate-100 text-slate-700"
                        }`}
                    >
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-1 text-red-500 hover:text-red-700 font-medium text-sm">
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
