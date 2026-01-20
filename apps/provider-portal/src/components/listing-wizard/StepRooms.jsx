import { Plus, Trash2, Copy, BedDouble, Users, Hotel, Info, Camera, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const ROOM_TYPES = ['Single', 'Shared', 'Dormitory', 'Suite', 'Apartment'];
const OCCUPANCY_MODES = ['Entire Room', 'Per Bed']; // Matches Backend Enum

const StepRooms = ({ data, update }) => {
    const [uploadingRoomId, setUploadingRoomId] = useState(null);

    const addRoom = () => {
        const newRoom = {
            id: Date.now(),
            name: `Unit #${(data.rooms?.length || 0) + 1}`,
            type: 'Single',
            occupancyMode: 'Entire Room', // Fixed Key
            price: '', // Fixed Key (was rent)
            capacity: 1, // Fixed Key (was beds)
            status: 'Available',
            images: [],
            features: { // Ensure sub-object exists
                bathroomType: 'Shared',
                furnishing: []
            }
        };
        update({ rooms: [...(data.rooms || []), newRoom] });
    };

    const removeRoom = (id) => {
        update({ rooms: data.rooms.filter(r => r.id !== id) });
    };

    const duplicateRoom = (room) => {
        const newRoom = { ...room, id: Date.now(), name: `${room.name} (Copy)` };
        update({ rooms: [...data.rooms, newRoom] });
    };

    const updateRoom = (id, field, value) => {
        update({
            rooms: data.rooms.map(r => r.id === id ? { ...r, [field]: value } : r)
        });
    };

    const handleRoomImageUpload = async (roomId, e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const room = data.rooms.find(r => r.id === roomId);
        if (!room) return;

        if ((room.images?.length || 0) + files.length > 3) {
            toast.error("Maximum 3 photos per room.");
            return;
        }

        setUploadingRoomId(roomId);
        const tId = toast.loading(`Uploading room photos...`);

        try {
            const newUrls = [];
            for (const file of files) {
                if (file.size > 10 * 1024 * 1024) continue;

                const fData = new FormData();
                fData.append('image', file);

                try {
                    const res = await api.post('/upload', fData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (res.data?.url) newUrls.push(res.data.url);
                } catch (innerErr) {
                    console.error("Room Upload Fail:", innerErr);
                }
            }

            if (newUrls.length > 0) {
                updateRoom(roomId, 'images', [...(room.images || []), ...newUrls]);
                toast.success("Room photos uploaded!", { id: tId });
            } else {
                toast.error("Upload failed.", { id: tId });
            }
        } catch (err) {
            toast.error("Error uploading photos.", { id: tId });
        } finally {
            setUploadingRoomId(null);
            e.target.value = '';
        }
    };

    const removeRoomImage = (roomId, index) => {
        const room = data.rooms.find(r => r.id === roomId);
        if (!room) return;
        const newImages = room.images.filter((_, i) => i !== index);
        updateRoom(roomId, 'images', newImages);
    };

    return (
        <div className="space-y-6 animate-fade-in max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="font-bold text-xl text-neutral-800">Room Details</h3>
                    <p className="text-neutral-500 text-sm">Add individual rooms or units.</p>
                </div>
                <button
                    onClick={addRoom}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-sm font-medium"
                >
                    <Plus size={18} /> Add Room
                </button>
            </div>

            {data.rooms?.length === 0 && (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                    <Hotel className="mx-auto text-neutral-300 mb-3" size={48} />
                    <p className="text-neutral-500 font-medium">No rooms added yet</p>
                </div>
            )}

            <div className="space-y-6">
                {data.rooms?.map((room, index) => (
                    <div key={room.id} className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                                {room.name || `Unit #${index + 1}`}
                            </h4>
                            <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => duplicateRoom(room)} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500" title="Duplicate">
                                    <Copy size={16} />
                                </button>
                                <button onClick={() => removeRoom(room.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500" title="Delete">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Form Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Room Name</label>
                                <input
                                    type="text"
                                    value={room.name}
                                    onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                                    className="input-field"
                                    placeholder="e.g. Master Bedroom"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Type</label>
                                <select
                                    value={room.type}
                                    onChange={(e) => updateRoom(room.id, 'type', e.target.value)}
                                    className="input-field"
                                >
                                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Booking Mode</label>
                                <select
                                    value={room.occupancyMode}
                                    onChange={(e) => updateRoom(room.id, 'occupancyMode', e.target.value)}
                                    className="input-field"
                                >
                                    {OCCUPANCY_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Rent (LKR)</label>
                                <input
                                    type="number"
                                    value={room.price}
                                    onChange={(e) => updateRoom(room.id, 'price', e.target.value)}
                                    className="input-field font-mono"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Capacity / Beds</label>
                                <div className="relative">
                                    <BedDouble size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        type="number"
                                        value={room.capacity}
                                        onChange={(e) => updateRoom(room.id, 'capacity', parseInt(e.target.value) || 1)}
                                        className="input-field pl-9"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Status</label>
                                <select
                                    value={room.status}
                                    onChange={(e) => updateRoom(room.id, 'status', e.target.value)}
                                    className="input-field"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Occupied">Occupied</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                            </div>
                        </div>

                        {/* Room Warning */}
                        {room.occupancyMode === 'Per Bed' && room.capacity < 2 && (
                            <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg flex items-center gap-2 text-xs text-orange-700 font-medium mb-6">
                                <Info size={14} />
                                Warning: Shared rooms usually have 2+ beds.
                            </div>
                        )}

                        {/* Room Photos */}
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block flex items-center justify-between">
                                <span>Room Photos ({room.images?.length || 0}/3)</span>
                                <span className="text-primary normal-case font-normal text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                                    Cover all angles
                                </span>
                            </label>

                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {(room.images?.length || 0) < 3 && (
                                    <div className="relative w-24 h-24 flex-shrink-0 border-2 border-dashed border-neutral-300 rounded-xl hover:bg-neutral-50 hover:border-primary transition-colors flex flex-col items-center justify-center cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple={true}
                                            onChange={(e) => handleRoomImageUpload(room.id, e)}
                                            disabled={uploadingRoomId === room.id}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        {uploadingRoomId === room.id ? (
                                            <Loader2 className="animate-spin text-primary" size={20} />
                                        ) : (
                                            <>
                                                <Camera size={20} className="text-neutral-400 mb-1" />
                                                <span className="text-[10px] text-neutral-500 font-bold">Add Photo</span>
                                            </>
                                        )}
                                    </div>
                                )}

                                {room.images?.map((img, i) => (
                                    <div key={i} className="w-24 h-24 flex-shrink-0 relative group rounded-xl overflow-hidden border border-neutral-200">
                                        <img src={img} alt="Room" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeRoomImage(room.id, i)}
                                            className="absolute top-1 right-1 p-1 bg-white/90 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="h-12"></div>
        </div>
    );
};
export default StepRooms;
