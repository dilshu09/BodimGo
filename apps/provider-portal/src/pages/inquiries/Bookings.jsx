"use client";

import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Eye, CheckCircle, XCircle, ChevronDown, Download } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "http://localhost:5000/api"; // Adjust if needed

export default function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Map backend data to frontend structure
      const formattedBookings = res.data.map(b => ({
        id: b._id,
        guestName: b.seeker?.name || "Unknown",
        email: b.seeker?.email || "N/A",
        room: b.listing?.title || "Unknown Listing",
        checkIn: b.checkInDate,
        checkOut: b.checkOutDate,
        nights: Math.ceil((new Date(b.checkOutDate) - new Date(b.checkInDate)) / (1000 * 60 * 60 * 24)),
        totalPrice: b.totalAmount || 0,
        status: b.status.charAt(0).toUpperCase() + b.status.slice(1).replace('_', ' '), // e.g. pending_payment -> Pending payment
        paymentStatus: b.paymentStatus ? (b.paymentStatus.charAt(0).toUpperCase() + b.paymentStatus.slice(1)) : 'Unpaid',
      }));

      setBookings(formattedBookings);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const s = status.toLowerCase();
    if (s.includes('confirmed') || s.includes('accepted')) return "bg-green-100 text-green-700";
    if (s.includes('pending')) return "bg-yellow-100 text-yellow-700";
    if (s.includes('cancelled') || s.includes('rejected')) return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  if (loading) {
    return <div className="p-8"><div className="text-center text-slate-500">Loading bookings...</div></div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Bookings</h2>
          <p className="text-neutral-500 dark:text-slate-400 mt-2">
            Track and manage all your incoming reservations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Bookings</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {bookings.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-slate-400">Confirmed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            {bookings.filter((b) => b.status.toLowerCase().includes('confirmed') || b.status.toLowerCase().includes('accepted')).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
            {bookings.filter((b) => b.status.toLowerCase().includes('pending')).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            Rs.{" "}
            {bookings
              .filter((b) => b.paymentStatus === "Paid")
              .reduce((sum, b) => sum + b.totalPrice, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">No bookings found.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                    Guest Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                    Room
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                    Check-in
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                    Check-out
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                    Total Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-200">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {booking.guestName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{booking.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-300">{booking.room}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Date(booking.checkIn).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {new Date(booking.checkOut).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      Rs. {(booking.totalPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${getStatusColor(booking.status)}`}
                      >
                        {(booking.status.includes("Confirmed") || booking.status.includes("Accepted")) && (
                          <CheckCircle size={14} />
                        )}
                        {(booking.status.includes("Cancelled") || booking.status.includes("Rejected")) && <XCircle size={14} />}
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.paymentStatus === "Paid"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : booking.paymentStatus === "Pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
                          }`}
                      >
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 font-medium text-sm"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
