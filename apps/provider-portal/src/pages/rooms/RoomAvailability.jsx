"use client";

import { useState, useEffect } from "react";
import { BedDouble, ChevronUp, ChevronDown, Hotel, MapPin, Users, DollarSign } from "lucide-react";
import api from "../../services/api";

export default function AvailabilityPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedListingId, setExpandedListingId] = useState(null);

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

  // Group by Listing
  const groupedRooms = availableRooms.reduce((acc, room) => {
    const lId = room.listingId;
    if (!acc[lId]) {
      acc[lId] = {
        id: lId,
        title: room.listingTitle,
        city: room.location?.city,
        address: room.location?.address,
        image: room.image,
        rooms: []
      };
    }
    acc[lId].rooms.push(room);
    return acc;
  }, {});

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
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
            <BedDouble size={32} />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            No rooms are currently marked as Available.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedRooms).map((listing) => (
            <div key={listing.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Listing Header */}
              <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                onClick={() => setExpandedListingId(expandedListingId === listing.id ? null : listing.id)}
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                    {listing.image ? <img src={listing.image} alt="" className="w-full h-full object-cover" /> : <Hotel size={24} className="text-slate-400" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{listing.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <MapPin size={14} />
                      <span>{listing.address}, {listing.city}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-400 uppercase font-bold">Vacancies</p>
                      <p className="font-bold text-green-600 leading-tight">{listing.rooms.length} Units Available</p>
                      <p className="text-[10px] text-slate-400 font-medium">Total Capacity: {listing.rooms.reduce((sum, r) => sum + (parseInt(r.capacity) || 0), 0)} People</p>
                   </div>
                   <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                      {expandedListingId === listing.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                   </button>
                </div>
              </div>

              {/* Available Rooms for this Listing */}
              {expandedListingId === listing.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listing.rooms.map((room) => (
                      <div key={room._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                            <BedDouble size={20} />
                          </div>
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase rounded-full">
                            Available
                          </span>
                        </div>
                        
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{room.name}</h4>
                        <p className="text-xs text-slate-500 mb-4">{room.type}</p>
                        
                        <div className="space-y-2 mb-6 flex-grow">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1"><Users size={12} /> Capacity</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{room.capacity} Person(s)</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1"><DollarSign size={12} /> Monthly Rent</span>
                            <span className="font-bold text-primary">LKR {room.price?.toLocaleString()}</span>
                          </div>
                        </div>

                        <button className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                          Manage Listing
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
