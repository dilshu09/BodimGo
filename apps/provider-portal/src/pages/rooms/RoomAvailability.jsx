"use client";

import { useState, useEffect } from "react";
import { BedDouble } from "lucide-react";
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
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Room Availability</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          View and manage rooms currently available for tenants
        </p>
      </div>

      {availableRooms.length === 0 ? (
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            No rooms are currently marked as Available.
          </p>
        </div>
      ) : (


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRooms.map((room) => (
            <div key={room._id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                    <BedDouble size={24} />
                  </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase rounded-full">
                    Available
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{room.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{room.type} • Up to {room.capacity} people</p>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Price</span>
                    <span className="font-bold text-slate-900 dark:text-white">Rs. {room.price}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Amenities</span>
                    <span className="text-slate-900 dark:text-white font-medium">{room.amenities ? room.amenities.length : 0} items</span>
                  </div>
                </div>
              </div>
              <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                Manage Booking
              </button>
            </div>
          ))}
        </div>

      )}
    </div>
  );
}
