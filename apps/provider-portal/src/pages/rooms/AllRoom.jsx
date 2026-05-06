'use client';
import { useState, useEffect } from "react";
import { Edit2, Trash2, Eye, Plus, ChevronUp, ChevronDown, Home, Bath, Users, Search, Camera, Hotel, Settings } from "lucide-react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import RoomFormModal from "../../components/RoomFormModal";
import ConfirmationModal from "../../components/ConfirmationModal";

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDeleteId, setRoomToDeleteId] = useState(null);

  const [expandedListingId, setExpandedListingId] = useState(null);

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

  const handleDelete = async () => {
    if (!roomToDeleteId) return;
    try {
      await api.delete(`/listings/provider/rooms/${roomToDeleteId}`);
      toast.success("Room deleted");
      setIsDeleteModalOpen(false);
      setRoomToDeleteId(null);
      fetchRooms();
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete room");
    }
  };

  const confirmDelete = (id) => {
    setRoomToDeleteId(id);
    setIsDeleteModalOpen(true);
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
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Rooms & Beds</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
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

      <div className="space-y-6">
        {rooms.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
              <Home size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Rooms Found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">You haven't added any rooms to your listings yet.</p>
            <button onClick={handleAddClick} className="text-red-600 font-medium hover:underline">Add your first room</button>
          </div>
        ) : (
          Object.values(rooms.reduce((acc, room) => {
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
          }, {})).map((listing) => (
            <div key={listing.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Listing Header Card */}
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">{listing.address}, {listing.city}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{listing.rooms.length} Units</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">{listing.rooms.filter(r => r.status === 'Available').length} Available</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="hidden md:block text-right">
                      <p className="text-xs text-slate-400 uppercase font-bold">Occupancy</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 leading-tight">
                        {Math.round((listing.rooms.filter(r => r.status === 'Occupied').length / listing.rooms.length) * 100)}%
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Total Capacity: {listing.rooms.reduce((sum, r) => sum + (parseInt(r.capacity) || 0), 0)}</p>
                   </div>
                   <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                      {expandedListingId === listing.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                   </button>
                </div>
              </div>

              {/* Rooms List (Expanded) */}
              {expandedListingId === listing.id && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 p-4 space-y-3">
                  {listing.rooms.map((room) => (
                    <div key={room._id} className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all ${expandedRoomId === room._id ? 'ring-1 ring-primary/30 shadow-md' : 'hover:border-primary/30'}`}>
                      {/* Room Row */}
                      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(room._id, 'details')}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center font-bold text-primary">
                            {room.name[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{room.name}</h4>
                            <p className="text-[10px] text-slate-500">{room.type} • Capacity: {room.capacity}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Monthly Rent</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-white">LKR {room.price?.toLocaleString()}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${room.status === 'Available' ? 'bg-green-100 text-green-700' : room.status === 'Occupied' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {room.status}
                          </span>
                          <button className="text-slate-400">
                            {expandedRoomId === room._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Room Details Expanded */}
                      {expandedRoomId === room._id && (
                        <div className="p-6 pt-0 border-t border-slate-50 dark:border-slate-800 animate-in slide-in-from-top-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                            {/* Tenants Info */}
                            <div className="space-y-4">
                              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Users size={14} /> Current Tenants
                              </h5>
                              {room.tenants && room.tenants.length > 0 ? (
                                <div className="space-y-2">
                                  {room.tenants.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{t.name[0]}</div>
                                        <div>
                                          <p className="text-sm font-bold text-slate-700 dark:text-white">{t.name}</p>
                                          <p className="text-[10px] text-slate-500">Status: {t.status}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] text-slate-400">Paid Status</p>
                                        <p className="text-xs font-bold text-green-600">LKR {t.rentAmount?.toLocaleString()}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                  <p className="text-sm text-slate-500 italic">{room.status === 'Occupied' ? 'Tenant details not synced.' : 'No active tenants in this room.'}</p>
                                </div>
                              )}
                            </div>

                            {/* Room Actions & Features */}
                            <div className="space-y-4">
                               <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Settings size={14} /> Management
                              </h5>
                              <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => toggleExpand(room._id, 'edit')} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 text-sm font-bold hover:bg-blue-100 transition-colors">
                                  <Edit2 size={16} /> Edit Room
                                </button>
                                <button onClick={() => confirmDelete(room._id)} className="flex items-center justify-center gap-2 p-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 transition-colors">
                                  <Trash2 size={16} /> Delete
                                </button>
                              </div>
                              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-xs text-slate-500 mb-2">Room Features</p>
                                <div className="flex flex-wrap gap-2">
                                  <span className="px-2 py-1 bg-white dark:bg-slate-900 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700">{room.features?.bathroomType || 'Shared'} Bath</span>
                                  {room.features?.furnishing?.map((f, i) => (
                                    <span key={i} className="px-2 py-1 bg-white dark:bg-slate-900 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700">{f}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Listing Selection Modal */}
      {showListingSelectModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-xl border border-neutral-200 dark:border-slate-800">
            <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Select Property</h3>
            <div className="max-h-[60vh] overflow-y-auto space-y-2 custom-scrollbar">
              {listings.length === 0 ? (
                <p className="text-center text-red-500 py-4">No active listings found.</p>
              ) : (
                listings.map(l => (
                  <button
                    key={l._id}
                    onClick={() => handleListingSelect(l)}
                    className="w-full text-left p-4 rounded-xl border border-neutral-200 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                  >
                    <div className="font-bold text-neutral-800 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400">{l.title}</div>
                    <div className="text-sm text-neutral-500 dark:text-slate-400">{l.location?.city}, {l.location?.district}</div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowListingSelectModal(false)}
              className="mt-4 w-full py-3 text-neutral-500 dark:text-slate-400 font-semibold hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
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

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setRoomToDeleteId(null);
        }}
      />
    </div>
  );
}
