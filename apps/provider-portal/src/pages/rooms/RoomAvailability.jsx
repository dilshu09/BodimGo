"use client";

import { useState, useEffect } from "react";
import api from "../../services/api";

export default function AvailabilityPage() {
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

  const availableRooms = rooms.filter(r => r.status === 'Available');

  if (loading) return <div className="p-12 text-center text-slate-500">Loading availability...</div>;
  if (error) return <div className="p-12 text-center text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Room Availability</h2>
        <p className="text-slate-600 mt-1">
          View and manage rooms currently available for tenants
        </p>
      </div>

      {availableRooms.length === 0 ? (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-600 text-lg">
            No rooms are currently marked as Available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRooms.map((room) => (
            <div key={room._id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-slate-100 relative">
                {room.image ? (
                  <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No Image
                  </div>
                )}
                <span className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                  Available
                </span>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{room.name}</h3>
                    <p className="text-sm text-slate-500">{room.listingTitle}</p>
                  </div>
                  <span className="text-sm font-medium bg-slate-100 px-2 py-1 rounded text-slate-600">
                    {room.type}
                  </span>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Monthly Rent:</span>
                    <span className="font-semibold text-slate-900">Rs. {room.price ? room.price.toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Capacity:</span>
                    <span className="text-slate-900">{room.capacity} Person(s)</span>
                  </div>
                </div>

                <button className="mt-6 w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  Manage Booking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
