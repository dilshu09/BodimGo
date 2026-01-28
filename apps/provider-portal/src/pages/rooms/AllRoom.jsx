"use client";

import { Edit2, Trash2, Eye } from "lucide-react";

const rooms = [
  {
    id: 1,
    name: "Room 101",
    type: "Single",
    occupancy: 1,
    price: 25000,
    status: "Available",
    beds: 1,
    tenant: "Empty",
  },
  {
    id: 2,
    name: "Room 102",
    type: "Double",
    occupancy: 2,
    price: 35000,
    status: "Occupied",
    beds: 2,
    tenant: "Ahmed Khan",
  },
  {
    id: 3,
    name: "Room 103",
    type: "Double",
    occupancy: 2,
    price: 35000,
    status: "Available",
    beds: 2,
    tenant: "Empty",
  },
  {
    id: 4,
    name: "Room 104",
    type: "Single",
    occupancy: 1,
    price: 25000,
    status: "Under Maintenance",
    beds: 1,
    tenant: "N/A",
  },
  {
    id: 5,
    name: "Room 105",
    type: "Suite",
    occupancy: 3,
    price: 45000,
    status: "Occupied",
    beds: 3,
    tenant: "Fatima Ahmed",
  },
];

export default function RoomsPage() {
  return (
    <div className="max-w-7xl mx-auto">
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
                  Beds
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
              {rooms.map((room) => (
                <tr
                  key={room.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {room.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{room.type}</td>
                  <td className="px-6 py-4 text-slate-600">{room.beds}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    Rs. {room.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{room.tenant}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        room.status === "Available"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
