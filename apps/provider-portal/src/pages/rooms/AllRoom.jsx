'use client';
import { useState, useEffect } from "react";
import { Edit2, Trash2, Eye, Plus, ChevronUp, ChevronDown, Home, Bath, Users } from "lucide-react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import RoomFormModal from "../../components/RoomFormModal";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [listings, setListings] = useState([]); // For selecting listing when adding room
  const [loading, setLoading] = useState(true);

  // Inline Action States
  const [expandedRoomId, setExpandedRoomId] = useState(null);
  const [actionType, setActionType] = useState('details'); // 'details', 'delete'

  // Modal Action States
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [editingRoom, setEditingRoom] = useState(null); // If null -> Add Mode, if set -> Edit Mode

  // Step 1 of Add Room: Select Listing
  const [showListingSelectModal, setShowListingSelectModal] = useState(false);

  useEffect(() => {
    fetchRooms();
    fetchListings();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get("/listings/provider/rooms");
      if (response.data.success) {
        setRooms(response.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      const res = await api.get('/listings/my');
      if (res.data.success) {
        setListings(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch listings", err);
    }
  };

  const toggleExpand = (id, type = 'details') => {
    // If clicking edit, open modal directly instead of expanding
    if (type === 'edit') {
      const room = rooms.find(r => r._id === id);
      if (room) {
        setEditingRoom(room);
        setShowRoomModal(true);
      }
      return;
    }

    if (expandedRoomId === id && actionType === type) {
      setExpandedRoomId(null);
      setActionType(null);
    } else {
      setExpandedRoomId(id);
      setActionType(type);
    }
  };

  const handleDelete = async (roomId) => {
    try {
      await api.delete(`/listings/provider/rooms/${roomId}`);
      toast.success("Room deleted");
      setExpandedRoomId(null);
      fetchRooms();
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete room");
    }
  };

  // --- Modal Actions ---

  const handleAddClick = () => {
    setEditingRoom(null);
    setSelectedListingId('');
    if (listings.length === 1) {
      // If only one listing, auto-select it
      setSelectedListingId(listings[0]._id);
      setShowRoomModal(true);
    } else {
      setShowListingSelectModal(true);
    }
  };

  const handleListingSelect = (id) => {
    setSelectedListingId(id);
    setShowListingSelectModal(false);
    setShowRoomModal(true);
  };

  const handleModalSave = async (roomData) => {
    try {
      if (editingRoom) {
        // Edit Mode
        await api.put(`/listings/provider/rooms/${editingRoom._id}`, roomData);
        toast.success("Room updated successfully");
      } else {
        // Add Mode
        await api.post('/listings/provider/rooms', {
          listingId: selectedListingId,
          roomData: { ...roomData, status: 'Available' } // Default status
        });
        toast.success("Room added successfully");
      }
      setShowRoomModal(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Failed to save room");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading rooms...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Rooms & Beds</h2>
          <p className="text-slate-600 mt-1">
            Manage all units in your boarding listings
          </p>
        </div>
        <button
          onClick={handleAddClick}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={18} /> Add Room
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {rooms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
              <Home size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Rooms Found</h3>
            <p className="text-slate-500 mb-6">You haven't added any rooms to your listings yet.</p>
            <button onClick={handleAddClick} className="text-red-600 font-medium hover:underline">Add your first room</button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {rooms.map((room) => (
              <div key={room._id} className={`transition-all duration-200 ${expandedRoomId === room._id ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>

                {/* Compact Row */}
                <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(room._id, 'details')}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {room.image ? <img src={room.image} alt="" className="w-full h-full object-cover" /> : <Home size={20} className="text-slate-300" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{room.name}</h4>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{room.listingTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 mr-8 hidden md:flex">
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs text-right">Type</p>
                      <p className="font-medium text-slate-900">{room.type}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs text-right">Capacity</p>
                      <p className="font-medium text-slate-900">{room.capacity} Person(s)</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs text-right">Rent</p>
                      <p className="font-medium text-slate-900">Rs. {room.price?.toLocaleString()}</p>
                    </div>
                    <div className="text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${room.status === 'Available' ? 'bg-green-100 text-green-700' :
                          room.status === 'Occupied' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {room.status}
                      </span>
                    </div>
                  </div>

                  <button className="text-slate-400 hover:text-slate-600">
                    {expandedRoomId === room._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>

                {/* Expanded Section */}
                {expandedRoomId === room._id && (
                  <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm cursor-default" onClick={e => e.stopPropagation()}>

                      {/* Header with Tabs */}
                      <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                        <button
                          onClick={() => setActionType('details')}
                          className={`text-sm font-bold ${actionType === 'details' ? 'text-red-600' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Details
                        </button>
                        {/* Edit opens Modal now */}
                        <button
                          onClick={() => toggleExpand(room._id, 'edit')}
                          className={`text-sm font-bold text-slate-500 hover:text-slate-800`}
                        >
                          Edit Room (Modal)
                        </button>
                        <button
                          onClick={() => toggleExpand(room._id, 'delete')}
                          className={`text-sm font-bold ${actionType === 'delete' ? 'text-red-600' : 'text-slate-500 hover:text-red-600'}`}
                        >
                          Delete
                        </button>
                      </div>

                      {/* DETAILS VIEW */}
                      {actionType === 'details' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <label className="text-xs text-slate-500 uppercase">Current Tenant</label>
                            <p className="font-medium text-slate-900">{room.tenantName === 'Unknown' ? 'None' : room.tenantName}</p>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase">Location</label>
                            <p className="font-medium text-slate-900 truncate">{room.location?.city || 'N/A'}</p>
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-6">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Bath size={16} /> <span>{room.features?.bathroomType || 'Shared'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Users size={16} /> <span>{room.capacity} People</span>
                            </div>
                            <button onClick={() => toggleExpand(room._id, 'edit')} className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-semibold ml-4">Edit <Edit2 size={12} /></button>
                          </div>
                        </div>
                      )}

                      {/* DELETE VIEW */}
                      {actionType === 'delete' && (
                        <div className="max-w-xl">
                          <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
                            <h4 className="text-red-800 font-bold flex items-center gap-2 mb-1"><Trash2 size={16} /> Delete Room?</h4>
                            <p className="text-red-700 text-sm">Are you sure you want to delete <strong>{room.name}</strong>? This action cannot be undone.</p>
                          </div>
                          <div className="flex justify-end gap-3">
                            <button onClick={() => toggleExpand(room._id, 'details')} className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded text-sm">Cancel</button>
                            <button onClick={() => handleDelete(room._id)} className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">Confirm Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Listing Selection Modal */}
      {showListingSelectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Select Property</h3>
              <button onClick={() => setShowListingSelectModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <p className="text-slate-500 text-sm mb-4">Choose which property listing to add this room to.</p>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {listings.length === 0 ? (
                <p className="text-center text-red-500 py-4">No active listings found.</p>
              ) : (
                listings.map(l => (
                  <button
                    key={l._id}
                    onClick={() => handleListingSelect(l._id)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-red-500 hover:bg-red-50 transition-colors flex justify-between items-center group"
                  >
                    <span className="font-medium text-slate-700 group-hover:text-red-700">{l.title}</span>
                    <span className="text-xs text-slate-400">{l.status}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Room Form Modal (Shared with ListingManagement) */}
      {showRoomModal && (
        <RoomFormModal
          room={editingRoom}
          onSave={handleModalSave}
          onClose={() => setShowRoomModal(false)}
        />
      )}
    </div>
  );
}
