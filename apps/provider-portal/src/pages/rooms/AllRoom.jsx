"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import api from "../../services/api";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get("/listings/provider/rooms");
      if (response.data.success) {
        setRooms(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading rooms...</div>;
  if (error) return <div className="p-12 text-center text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Rooms & Beds</h2>
          <p className="text-slate-600 mt-1">
            Manage all units in your boarding
          </p>
        </div>
        <button className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
          + Add Room
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Room Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Capacity
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Monthly Rent
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Current Tenant
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    No rooms found. Create a listing to add rooms.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr
                    key={room._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div>{room.name}</div>
                      <div className="text-xs text-slate-500">{room.listingTitle}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{room.type}</td>
                    <td className="px-6 py-4 text-slate-600">{room.capacity} Person(s)</td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      Rs. {room.price ? room.price.toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{room.tenantName}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${room.status === "Available"
                          ? "bg-green-100 text-green-700"
                          : room.status === "Occupied"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded transition-colors">
                          <Eye size={16} className="text-slate-600" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded transition-colors">
                          <Edit2 size={16} className="text-slate-600" />
                        </button>
                        <button className="p-2 hover:bg-red-100 rounded transition-colors">
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
