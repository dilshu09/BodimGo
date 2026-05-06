import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, PlayCircle, PauseCircle, Edit, ExternalLink, FileText, Plus, X, Loader, Check, Trash2, Users, Bed, Bath, LayoutGrid, Mail, Phone, CreditCard, Eye, ChevronDown, ChevronUp, MessageSquare, Search, Filter, Send, MoreVertical, Calendar, DollarSign } from 'lucide-react';
import api from '../services/api';
import { checkListingCompleteness } from '../utils/listingCompleteness';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import RoomFormModal from '../components/RoomFormModal';
import ConfirmationModal from '../components/ConfirmationModal';

// Map missing items to wizard steps OR internal tabs
const STEP_MAPPING = {
    "Property Basic Info": { type: 'wizard', step: 1 },
    "Location Pin": { type: 'wizard', step: 2 },
    "House Rules": { type: 'wizard', step: 3 },
    "Pricing Defaults": { type: 'wizard', step: 4 },
    "Facilities": { type: 'wizard', step: 5 },
    "Property Images": { type: 'wizard', step: 6 },
    "Min 5 Photos Required": { type: 'wizard', step: 6 },
    "Add at least 1 Room": { type: 'wizard', step: 7 },
    "Room Images (Min 2/room)": { type: 'wizard', step: 7 },
    "Agreement Template": { type: 'tab', tab: 'agreements' }
};

// Component: Overview Tab
const OverviewTab = ({ listing, completeness, onFix }) => {
    // Calculate Occupancy
    const totalCapacity = listing.rooms?.reduce((acc, room) => acc + (parseInt(room.capacity) || 0), 0) || 0;
    const occupiedCount = listing.rooms?.reduce((acc, room) => {
        if (room.status === 'Occupied') return acc + parseInt(room.capacity); // Fully occupied
        if (room.occupancyMode === 'Per Bed' && room.availableBeds !== undefined) {
            return acc + (parseInt(room.capacity) - parseInt(room.availableBeds));
        }
        return acc;
    }, 0) || 0;

    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                {/* Setup Progress */}
                {!completeness.isReady && (
                    <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                        <h3 className="font-bold text-lg text-orange-800 mb-4">Complete Your Setup</h3>
                        <div className="space-y-3">
                            {completeness.missing.map((item, i) => (
                                <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-orange-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">!</div>
                                        <span className="font-medium text-neutral-700">{item}</span>
                                    </div>
                                    <button
                                        onClick={() => onFix(item)}
                                        className="text-sm font-bold text-primary hover:underline"
                                    >
                                        Fix Now
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-6 min-h-[200px]">
                    <h3 className="font-bold text-lg mb-4 text-neutral-900 dark:text-white">Recent Activity</h3>
                    <p className="text-neutral-400 dark:text-slate-500 text-sm">No recent activity.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-6">
                    <h3 className="font-bold text-neutral-800 dark:text-white mb-1">Occupancy</h3>
                    <div className="text-3xl font-bold text-primary mb-2">{occupancyRate}%</div>
                    <div className="w-full bg-neutral-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all duration-500" style={{ width: `${occupancyRate}%` }}></div>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-slate-400 mt-2">{occupiedCount}/{totalCapacity} Beds Occupied</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-neutral-800 dark:text-white">Property Details</h3>
                        <button onClick={() => onFix("Property Basic Info")} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg text-primary" title="Edit Info">
                            <Edit size={16} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Type</span>
                            <span className="font-medium text-neutral-800 dark:text-white">{listing.type}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Gender</span>
                            <span className="font-medium text-neutral-800 dark:text-white">{listing.genderPolicy}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">City</span>
                            <span className="font-medium text-neutral-800 dark:text-white">{listing.location?.city}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-neutral-800 dark:text-white">Amenities</h3>
                        <button onClick={() => onFix("Facilities")} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg text-primary" title="Edit Amenities">
                            <Edit size={16} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {listing.facilities?.length > 0 ? (
                            listing.facilities.map((f, i) => (
                                <span key={i} className="px-3 py-1 bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 text-xs rounded-full">{f}</span>
                            ))
                        ) : (
                            <p className="text-xs text-neutral-400">No amenities added.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Component: Rooms Tab
const RoomsTab = ({ listing, onRefetch }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [loading, setLoading] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState(null);

    const handleSaveRoom = async (roomData) => {
        try {
            let updatedRooms = [...(listing.rooms || [])];
            if (editingRoom) {
                updatedRooms = updatedRooms.map(r => r._id === editingRoom._id ? { ...roomData, _id: r._id } : r);
            } else {
                updatedRooms.push(roomData);
            }

            // This PUT request now handles base64 images processing in backend
            const res = await api.put(`/listings/${listing._id}`, { rooms: updatedRooms });

            // Robust success check: res.data.success or just res.status 200
            if (res.data.success || res.status === 200) {
                toast.success("Property updated successfully");
                setIsModalOpen(false);
                setEditingRoom(null);
                onRefetch(); // Refresh the listing data
            } else {
                toast.error("Failed to update property");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save room");
        }
    };

    const handleDeleteClick = (roomId) => {
        setRoomToDelete(roomId);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteRoom = async () => {
        if (!roomToDelete) return;
        try {
            setLoading(true);
            const updatedRooms = listing.rooms.filter(r => r._id !== roomToDelete);
            await api.put(`/listings/${listing._id}`, { rooms: updatedRooms });
            toast.success("Room deleted");
            onRefetch();
            setIsDeleteModalOpen(false);
            setRoomToDelete(null);
        } catch (error) {
            toast.error("Failed to delete room");
            setIsDeleteModalOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => { setEditingRoom(null); setIsModalOpen(true); };
    const openEdit = (room) => { setEditingRoom(room); setIsModalOpen(true); };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Rooms & Beds</h2>
                    <p className="text-neutral-500 dark:text-slate-400 text-sm">Manage your property's rooms.</p>
                </div>
                <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                    <Plus size={16} /> Add Room
                </button>
            </div>

            {(!listing.rooms || listing.rooms.length === 0) ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 dashed">
                    <div className="bg-neutral-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400 dark:text-slate-500">
                        <LayoutGrid size={32} />
                    </div>
                    <h3 className="font-bold text-neutral-900 dark:text-white mb-2">No Rooms Added Yet</h3>
                    <p className="text-neutral-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">Start by adding the rooms available in your property.</p>
                    <button onClick={openAdd} className="btn-secondary">Add Your First Room</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listing.rooms.map((room, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 hover:shadow-lg hover:border-primary/50 transition-all group flex flex-col h-full">
                            {/* Room Images Preview */}
                            <div className="h-40 bg-neutral-100 dark:bg-slate-800 rounded-xl mb-4 overflow-hidden relative">
                                {room.images && room.images.length > 0 ? (
                                    <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-1">
                                        <div className="col-span-2 row-span-2 relative">
                                            <img src={room.images[0]} className="w-full h-full object-cover" alt="Room Main" />
                                        </div>
                                        {room.images[1] && <div className="col-span-1 row-span-1"><img src={room.images[1]} className="w-full h-full object-cover" alt="Thumb 1" /></div>}
                                        {room.images[2] && <div className="col-span-1 row-span-1 relative">
                                            <img src={room.images[2]} className="w-full h-full object-cover" alt="Thumb 2" />
                                            {room.images.length > 3 && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                                                    +{room.images.length - 3}
                                                </div>
                                            )}
                                        </div>}
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 dark:text-slate-600">
                                        <Bed size={32} opacity={0.3} />
                                        <span className="text-xs mt-2">No Photos</span>
                                    </div>
                                )}

                                <div className="absolute top-2 right-2 flex gap-1 bg-white/90 dark:bg-slate-800/90 p-1 rounded-lg shadow-sm border border-neutral-100 dark:border-slate-700">
                                    <button onClick={() => openEdit(room)} className="p-1.5 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded text-neutral-600 dark:text-slate-400 hover:text-primary transition-colors" title="Edit Room"><Edit size={14} /></button>
                                    <button onClick={() => handleDeleteClick(room._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-neutral-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete Room"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-800 dark:text-white text-sm line-clamp-1">{room.name}</h4>
                                        <p className="text-xs text-neutral-500 dark:text-slate-400">{room.type}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4 flex-grow">
                                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1"><Users size={12} /> Capacity</span>
                                    <span className="font-semibold text-neutral-800 dark:text-slate-200">{room.capacity}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1"><Bath size={12} /> Bathroom</span>
                                    <span className="font-semibold text-neutral-800 dark:text-slate-200">{room.features?.bathroomType}</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                                <div className="font-bold text-primary">LKR {room.price?.toLocaleString()}</div>
                                <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${room.status === 'Occupied' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                                    {room.status || 'Available'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <RoomFormModal room={editingRoom} onSave={handleSaveRoom} onClose={() => setIsModalOpen(false)} />
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Room"
                message="Are you sure you want to delete this room? This action cannot be undone."
                confirmText="Delete Room"
                cancelText="Cancel"
                isDanger={true}
                onConfirm={confirmDeleteRoom}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setRoomToDelete(null);
                }}
            />
        </div>
    );
};

// Component: Agreements Tab
const AgreementsTab = ({ listing, onRefetch }) => {
    const [showModal, setShowModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (showModal) {
            fetchTemplates();
        }
    }, [showModal]);

    const fetchTemplates = async () => {
        try {
            setLoadingTemplates(true);
            const res = await api.get('/agreements/templates');
            if (res.data.success) {
                setTemplates(res.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load templates");
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleAssign = async (templateId) => {
        try {
            setAssigning(true);
            await api.put(`/listings/${listing._id}`, { agreementTemplate: templateId });
            toast.success("Template assigned successfully!");
            setShowModal(false);
            onRefetch();
        } catch (error) {
            console.error(error);
            toast.error("Failed to assign template");
        } finally {
            setAssigning(false);
        }
    };

    const assigned = listing.agreementTemplate;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Agreements</h2>
                    <p className="text-neutral-500 dark:text-slate-400 text-sm">Manage rental agreements and templates.</p>
                </div>
                <Link to="/agreements/new" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                    <Plus size={16} /> Create Template
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-6">
                <h3 className="font-bold text-neutral-800 dark:text-white mb-4">Assigned Template</h3>
                {assigned ? (
                    <div className="flex items-center justify-between bg-neutral-50 dark:bg-slate-800 p-6 rounded-xl border border-neutral-200 dark:border-slate-700">
                        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setShowPreview(true)}>
                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl border border-neutral-100 dark:border-slate-600 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-neutral-800 dark:text-white text-lg group-hover:text-primary transition-colors">
                                    {typeof assigned === 'object' ? assigned.name : 'Agreement Template Assigned'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-slate-400 mt-1">
                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-bold">Active</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-primary">Click to preview content</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-sm font-bold text-neutral-500 hover:text-primary transition-colors"
                        >
                            Change
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-10 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-dashed border-orange-200 dark:border-orange-800">
                        <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-orange-400">
                            <AlertTriangle size={24} />
                        </div>
                        <p className="text-orange-900 dark:text-orange-400 font-bold text-lg mb-1">No Template Assigned</p>
                        <p className="text-orange-700 dark:text-orange-500/80 text-sm mb-6">You must assign an agreement template before publishing this listing.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400 rounded-xl text-sm font-bold shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                        >
                            Select Template
                        </button>
                    </div>
                )}
            </div>

            {/* Selection Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-neutral-200 dark:border-slate-800">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Select Agreement Template</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-300" /></button>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {loadingTemplates ? (
                                <div className="flex justify-center py-10"><Loader className="animate-spin text-primary" /></div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-neutral-500 dark:text-slate-400 mb-4">No templates found.</p>
                                    <Link to="/agreements/new" className="text-primary font-bold hover:underline">Create New Template</Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {templates.map(tpl => (
                                        <button
                                            key={tpl._id}
                                            onClick={() => handleAssign(tpl._id)}
                                            disabled={assigning}
                                            className="w-full text-left p-4 rounded-xl border border-neutral-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary hover:bg-neutral-50 dark:hover:bg-slate-800 transition-all group relative"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-neutral-800 dark:text-white group-hover:text-primary transition-colors">{tpl.name}</h4>
                                                    <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-slate-400 mt-1">
                                                        <span>{tpl.lockPeriod}M Lock-in</span>
                                                        <span>•</span>
                                                        <span>{tpl.noticePeriod}M Notice</span>
                                                    </div>
                                                </div>
                                                {assigning && <Loader size={16} className="animate-spin text-primary" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && assigned && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300 border border-neutral-200 dark:border-slate-800">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{assigned.name}</h3>
                                <p className="text-xs text-neutral-500 dark:text-slate-400">Template Preview</p>
                            </div>
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-neutral-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <X size={20} className="text-neutral-500 dark:text-slate-300" />
                            </button>
                        </div>

                        <div className="flex-1 p-8 overflow-y-auto prose dark:prose-invert prose-neutral max-w-none custom-scrollbar">
                            {assigned.content ? (
                                <ReactMarkdown>{assigned.content}</ReactMarkdown>
                            ) : (
                                <p className="text-neutral-400 italic">No content available for this template.</p>
                            )}
                            
                            {assigned.rules?.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-neutral-100 dark:border-slate-800">
                                    <h4 className="text-lg font-bold mb-4">Additional Rules</h4>
                                    <ul className="space-y-2 list-none p-0">
                                        {assigned.rules.map((rule, idx) => (
                                            <li key={idx} className="flex gap-2 text-sm text-neutral-600 dark:text-slate-300 bg-neutral-50 dark:bg-slate-800 p-3 rounded-lg border border-neutral-100 dark:border-slate-700">
                                                <span className="text-primary font-bold">•</span>
                                                {rule}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/50 flex justify-end">
                            <button 
                                onClick={() => setShowPreview(false)}
                                className="btn-primary px-8"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Component: Inquiries Tab
const InquiriesTab = ({ listing }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, [listing._id]);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/conversations?listingId=${listing._id}`);
            setConversations(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load inquiries");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (convId) => {
        try {
            const res = await api.get(`/conversations/${convId}/messages`);
            setMessages(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load messages");
        }
    };

    useEffect(() => {
        if (selectedConv) {
            fetchMessages(selectedConv._id);
        }
    }, [selectedConv]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConv) return;

        try {
            setSending(true);
            const res = await api.post(`/conversations/${selectedConv._id}/messages`, { content: newMessage });
            setMessages([...messages, res.data]);
            setNewMessage("");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary" /></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
            {/* Sidebar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-neutral-800 dark:text-white">Inquiries</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-neutral-400 text-sm">No inquiries for this listing yet.</div>
                    ) : (
                        conversations.map(conv => {
                            const otherParticipant = conv.participants.find(p => p._id !== localStorage.getItem('userId')) || conv.participants[0];
                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => setSelectedConv(conv)}
                                    className={`w-full text-left p-4 border-b border-neutral-50 dark:border-slate-800 transition-colors hover:bg-neutral-50 dark:hover:bg-slate-800 ${selectedConv?._id === conv._id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-slate-800 flex items-center justify-center font-bold text-primary">
                                            {otherParticipant?.name?.[0] || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-neutral-800 dark:text-white text-sm truncate">{otherParticipant?.name}</p>
                                                <span className="text-[10px] text-neutral-400">{format(new Date(conv.updatedAt), 'MMM d')}</span>
                                            </div>
                                            <p className="text-xs text-neutral-500 truncate">{conv.lastMessageContent}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 overflow-hidden flex flex-col">
                {selectedConv ? (
                    <>
                        <div className="p-4 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                    {selectedConv.participants.find(p => p._id !== localStorage.getItem('userId'))?.name?.[0]}
                                </div>
                                <h4 className="font-bold text-neutral-800 dark:text-white">
                                    {selectedConv.participants.find(p => p._id !== localStorage.getItem('userId'))?.name}
                                </h4>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/30 dark:bg-slate-900/50">
                            {messages.map((msg, i) => {
                                const isMe = (msg.sender._id || msg.sender) === localStorage.getItem('userId');
                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-slate-200 border border-neutral-100 dark:border-slate-700 rounded-tl-none shadow-sm'}`}>
                                            {msg.content}
                                            <div className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-neutral-400'}`}>
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <form onSubmit={handleSend} className="p-4 border-t border-neutral-100 dark:border-slate-800 flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-neutral-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none text-neutral-800 dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="bg-primary text-white p-2 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">Select an inquiry to view the conversation</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Component: Tenants Tab
const TenantsTab = ({ listing }) => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);

    const openEdit = (tenant) => {
        setSelectedTenant(tenant);
        setIsEditModalOpen(true);
    };

    useEffect(() => {
        fetchTenants();
    }, [listing._id]);

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/tenants?listingId=${listing._id}`);
            setTenants(res.data.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load tenants");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-800 dark:text-white">Active Tenants</h3>
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                    {tenants.length} Total
                </div>
            </div>

            {tenants.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 dashed">
                    <Users size={48} className="mx-auto mb-4 text-neutral-300" />
                    <p className="text-neutral-500">No tenants assigned to this property yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tenants.map(tenant => (
                        <div key={tenant._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 overflow-hidden transition-all hover:shadow-md">
                            <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                        {tenant.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-800 dark:text-white">{tenant.name}</h4>
                                        <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                                            <span className="flex items-center gap-1"><LayoutGrid size={12} /> Room: {tenant.roomName || tenant.roomId}</span>
                                            <span className="flex items-center gap-1"><Calendar size={12} /> Since {format(new Date(tenant.createdAt), 'MMM yyyy')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] text-neutral-400 uppercase font-bold">Rent</p>
                                        <p className="font-bold text-neutral-800 dark:text-white">LKR {tenant.rentAmount?.toLocaleString()}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tenant.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {tenant.status}
                                    </div>
                                    <button
                                        onClick={() => openEdit(tenant)}
                                        className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors text-indigo-400"
                                        title="Edit Tenant"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => setExpandedId(expandedId === tenant._id ? null : tenant._id)}
                                        className="p-2 hover:bg-neutral-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-neutral-400"
                                    >
                                        {expandedId === tenant._id ? <ChevronUp size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {expandedId === tenant._id && (
                                <div className="px-5 pb-5 pt-0 border-t border-neutral-50 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-neutral-400 uppercase">Contact Information</p>
                                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-slate-300">
                                                <Mail size={14} className="text-primary" /> {tenant.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-slate-300">
                                                <Phone size={14} className="text-primary" /> {tenant.phone}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-neutral-400 uppercase">Personal Details</p>
                                            <p className="text-sm text-neutral-600 dark:text-slate-300 font-medium">NIC: {tenant.nic}</p>
                                            <p className="text-sm text-neutral-600 dark:text-slate-300">Address: {tenant.address || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-neutral-400 uppercase">Financial Status</p>
                                            <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-slate-800 rounded-xl">
                                                <span className="text-xs text-neutral-500">Current Month</span>
                                                <span className={`text-xs font-bold ${tenant.currentMonth?.paid ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tenant.currentMonth?.paid ? '✓ Paid' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isEditModalOpen && selectedTenant && (
                <TenantEditModal 
                    tenant={selectedTenant} 
                    rooms={listing.rooms}
                    onSave={fetchTenants} 
                    onClose={() => setIsEditModalOpen(false)} 
                />
            )}
        </div>
    );
};

// Component: Finance Tab
const FinanceTab = ({ listing }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, [listing._id]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/invoices?listingId=${listing._id}`);
            setInvoices(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader className="animate-spin text-primary" /></div>;

    const totalIncome = invoices.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + inv.totalAmount, 0);
    const pendingAmount = invoices.filter(inv => inv.status !== 'paid').reduce((acc, inv) => acc + inv.totalAmount, 0);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-6 rounded-2xl">
                    <p className="text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-1">Total Collected</p>
                    <h3 className="text-3xl font-black text-green-700 dark:text-green-300">LKR {totalIncome.toLocaleString()}</h3>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-6 rounded-2xl">
                    <p className="text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">Pending Invoices</p>
                    <h3 className="text-3xl font-black text-orange-700 dark:text-orange-300">LKR {pendingAmount.toLocaleString()}</h3>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h3 className="font-bold text-neutral-800 dark:text-white">Recent Invoices</h3>
                    <FileText size={16} className="text-neutral-400" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-50 dark:border-slate-800">
                                <th className="px-6 py-4">Invoice</th>
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 dark:divide-slate-800">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-neutral-400 text-sm">No invoices found for this listing.</td>
                                </tr>
                            ) : (
                                invoices.map(inv => (
                                    <tr key={inv._id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-neutral-800 dark:text-white text-sm">{inv.invoiceNumber}</p>
                                            <p className="text-[10px] text-neutral-400">{inv.items[0]?.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                                                    {inv.tenant?.name?.[0]}
                                                </div>
                                                <span className="text-sm text-neutral-700 dark:text-slate-300">{inv.tenant?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">
                                            {format(new Date(inv.dueDate), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-neutral-800 dark:text-white text-sm">
                                            LKR {inv.totalAmount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {inv.status}
                                            </span>
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
};

// Main Component
const ListingManagement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/listings/${id}`);
            setListing(res.data.data || res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load property details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handlePublish = async (newStatus) => {
        try {
            setPublishing(true);
            await api.put(`/listings/${id}`, { status: newStatus });
            toast.success(`Listing ${newStatus === 'Published' ? 'Published' : 'Paused'} successfully!`);
            fetchDetails();
        } catch (error) {
            console.error(error);
            toast.error(`Failed to ${newStatus === 'Published' ? 'publish' : 'pause'} listing`);
        } finally {
            setPublishing(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader className="animate-spin text-primary" size={32} /></div>;
    if (!listing) return <div className="flex items-center justify-center min-h-screen text-neutral-500">Property not found</div>;

    const completeness = checkListingCompleteness(listing);

    const handleFix = (item) => {
        const action = STEP_MAPPING[item];
        if (action?.type === 'tab') {
            setActiveTab(action.tab);
        } else if (action?.type === 'wizard') {
            navigate(`/add-listing?editing=${listing._id}&step=${action.step}`);
        } else {
            navigate(`/add-listing?editing=${listing._id}&step=1`);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-800 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/listings')} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-lg text-neutral-500 dark:text-slate-400 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-neutral-800 dark:text-white line-clamp-1">{listing.title}</h1>

                                {/* Status Badges */}
                                {listing.status === 'Published' && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <CheckCircle size={12} /> Published
                                    </span>
                                )}
                                {listing.status === 'Draft' && completeness.isReady && (
                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <Check size={12} /> Ready to Publish
                                    </span>
                                )}
                                {(!completeness.isReady) && (
                                    <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <AlertTriangle size={12} /> Action Required
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-neutral-500">{listing.location?.city}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/add-listing?editing=${listing._id}`)}
                            className="flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-slate-700 rounded-lg text-sm font-bold text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Edit size={16} />
                            Edit Property
                        </button>
                        {!completeness.isReady ? (
                            <button className="btn-primary opacity-50 cursor-not-allowed flex items-center gap-2 px-4 py-2 text-sm">
                                <AlertTriangle size={16} /> Complete Setup to Publish
                            </button>
                        ) : listing.status === 'Published' ? (
                            <button
                                onClick={() => handlePublish('Draft')}
                                disabled={publishing}
                                className="flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-slate-700 rounded-lg text-sm font-bold text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                {publishing ? <Loader size={16} className="animate-spin" /> : <PauseCircle size={16} />}
                                Pause Listing
                            </button>
                        ) : (
                            <button
                                onClick={() => handlePublish('Published')}
                                disabled={publishing}
                                className="btn-primary flex items-center gap-2 px-6 py-2 shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 transition-all transform hover:scale-105"
                            >
                                {publishing ? <Loader size={16} className="animate-spin text-white" /> : <PlayCircle size={16} />}
                                Publish Now
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 overflow-x-auto no-scrollbar">
                    {['Overview', 'Rooms', 'Agreements', 'Inquiries', 'Tenants', 'Finance'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {activeTab === 'overview' && <OverviewTab listing={listing} completeness={completeness} onFix={handleFix} />}
                {activeTab === 'rooms' && <RoomsTab listing={listing} onRefetch={fetchDetails} />}
                {activeTab === 'agreements' && <AgreementsTab listing={listing} onRefetch={fetchDetails} />}
                {activeTab === 'inquiries' && <InquiriesTab listing={listing} />}
                {activeTab === 'tenants' && <TenantsTab listing={listing} />}
                {activeTab === 'finance' && <FinanceTab listing={listing} />}
                {activeTab !== 'overview' && activeTab !== 'agreements' && activeTab !== 'rooms' && activeTab !== 'inquiries' && activeTab !== 'tenants' && activeTab !== 'finance' && (
                    <div className="text-center py-20 text-neutral-400 bg-white rounded-2xl border border-neutral-200 dashed">
                        Module "{activeTab}" coming in next phase.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListingManagement;

// Component: Tenant Edit Modal
const TenantEditModal = ({ tenant, rooms, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        nic: tenant.nic,
        address: tenant.address,
        rentAmount: tenant.rentAmount,
        roomId: tenant.roomId
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            await api.patch(`/tenants/${tenant._id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Tenant updated successfully");
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update tenant");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-8 shadow-2xl relative border border-neutral-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-5 right-5 p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full text-neutral-500"><X size={20} /></button>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 text-left">Edit Tenant Details</h3>
                
                <form onSubmit={handleSave} className="space-y-4 text-left">
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Full Name</label>
                        <input 
                            type="text" 
                            required
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full p-3 rounded-xl border border-neutral-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Phone</label>
                            <input 
                                type="text" 
                                required
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full p-3 rounded-xl border border-neutral-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">NIC</label>
                            <input 
                                type="text" 
                                required
                                value={formData.nic} 
                                onChange={e => setFormData({...formData, nic: e.target.value})}
                                className="w-full p-3 rounded-xl border border-neutral-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Email</label>
                        <input 
                            type="email" 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full p-3 rounded-xl border border-neutral-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Address</label>
                        <textarea 
                            value={formData.address} 
                            onChange={e => setFormData({...formData, address: e.target.value})}
                            className="w-full p-3 rounded-xl border border-neutral-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Assigned Room</label>
                        <select 
                            value={formData.roomId} 
                            onChange={e => setFormData({...formData, roomId: e.target.value})}
                            className="w-full p-3 rounded-xl border border-neutral-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Unassigned</option>
                            {rooms?.map(room => (
                                <option key={room._id} value={room._id}>
                                    {room.name} ({room.type}) - {room.status}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-neutral-400 mt-1 italic">Assigning a room will automatically update the room's availability status.</p>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-neutral-500 font-bold hover:bg-neutral-100 rounded-xl transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary px-8 py-2">
                            {saving ? <Loader className="animate-spin" size={18} /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
