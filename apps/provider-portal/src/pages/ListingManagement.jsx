import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, PlayCircle, PauseCircle, Edit, ExternalLink, FileText, Plus, X, Loader, Check, Trash2, Users, Bed, Bath, LayoutGrid } from 'lucide-react';
import api from '../services/api';
import { checkListingCompleteness } from '../utils/listingCompleteness';
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

                <div className="bg-white rounded-2xl border border-neutral-200 p-6 min-h-[200px]">
                    <h3 className="font-bold text-lg mb-4">Recent Activity</h3>
                    <p className="text-neutral-400 text-sm">No recent activity.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                    <h3 className="font-bold text-neutral-800 mb-1">Occupancy</h3>
                    <div className="text-3xl font-bold text-primary mb-2">{occupancyRate}%</div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all duration-500" style={{ width: `${occupancyRate}%` }}></div>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">{occupiedCount}/{totalCapacity} Beds Occupied</p>
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
            setLoading(true);
            let updatedRooms = [...(listing.rooms || [])];
            if (editingRoom) {
                updatedRooms = updatedRooms.map(r => r._id === editingRoom._id ? { ...roomData, _id: r._id } : r);
            } else {
                updatedRooms.push(roomData);
            }

            // This PUT request now handles base64 images processing in backend
            const res = await api.put(`/listings/${listing._id}`, { rooms: updatedRooms });

            if (res.data.success) {
                toast.success("Room saved successfully");
                setIsModalOpen(false);
                setEditingRoom(null);
                onRefetch();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save room");
        } finally {
            setLoading(false);
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
                    <h2 className="text-xl font-bold text-neutral-800">Rooms & Beds</h2>
                    <p className="text-neutral-500 text-sm">Manage your property's rooms.</p>
                </div>
                <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                    <Plus size={16} /> Add Room
                </button>
            </div>

            {(!listing.rooms || listing.rooms.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 dashed">
                    <div className="bg-neutral-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
                        <LayoutGrid size={32} />
                    </div>
                    <h3 className="font-bold text-neutral-900 mb-2">No Rooms Added Yet</h3>
                    <p className="text-neutral-500 text-sm mb-6 max-w-md mx-auto">Start by adding the rooms available in your property.</p>
                    <button onClick={openAdd} className="btn-secondary">Add Your First Room</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listing.rooms.map((room, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-lg transition-shadow group flex flex-col h-full">
                            {/* Room Images Preview */}
                            <div className="h-40 bg-neutral-100 rounded-xl mb-4 overflow-hidden relative">
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
                                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                                        <Bed size={32} opacity={0.3} />
                                        <span className="text-xs mt-2">No Photos</span>
                                    </div>
                                )}

                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-sm">
                                    <button onClick={() => openEdit(room)} className="p-1 hover:bg-neutral-100 rounded text-neutral-600 hover:text-primary"><Edit size={14} /></button>
                                    <button onClick={() => handleDeleteClick(room._id)} className="p-1 hover:bg-red-50 rounded text-neutral-600 hover:text-red-600"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-neutral-800 text-sm line-clamp-1">{room.name}</h4>
                                        <p className="text-xs text-neutral-500">{room.type}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4 flex-grow">
                                <div className="flex items-center justify-between text-xs text-neutral-600">
                                    <span className="flex items-center gap-1"><Users size={12} /> Capacity</span>
                                    <span className="font-semibold">{room.capacity}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-neutral-600">
                                    <span className="flex items-center gap-1"><Bath size={12} /> Bathroom</span>
                                    <span className="font-semibold">{room.features?.bathroomType}</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between mt-auto">
                                <div className="font-bold text-primary">LKR {room.price?.toLocaleString()}</div>
                                <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${room.status === 'Occupied' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">Agreements</h2>
                    <p className="text-neutral-500 text-sm">Manage rental agreements and templates.</p>
                </div>
                <Link to="/agreements/new" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                    <Plus size={16} /> Create Template
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h3 className="font-bold text-neutral-800 mb-4">Assigned Template</h3>
                {listing.agreementTemplate ? (
                    <div className="flex items-center justify-between bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl border border-neutral-100 flex items-center justify-center text-primary shadow-sm">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-neutral-800 text-lg">
                                    {typeof listing.agreementTemplate === 'object' ? listing.agreementTemplate.name : 'Agreement Template Assigned'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Active</span>
                                    <span>•</span>
                                    <span>Last updated just now</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-sm font-bold text-primary hover:text-primary-dark hover:underline"
                        >
                            Change Template
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-10 bg-orange-50 rounded-2xl border border-dashed border-orange-200">
                        <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-orange-400">
                            <AlertTriangle size={24} />
                        </div>
                        <p className="text-orange-900 font-bold text-lg mb-1">No Template Assigned</p>
                        <p className="text-orange-700 text-sm mb-6">You must assign an agreement template before publishing this listing.</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-2.5 bg-white border border-orange-200 text-orange-700 rounded-xl text-sm font-bold shadow-sm hover:bg-orange-100 transition-colors"
                        >
                            Select Template
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                            <h3 className="text-lg font-bold text-neutral-800">Select Agreement Template</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} className="text-neutral-400 hover:text-neutral-600" /></button>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {loadingTemplates ? (
                                <div className="flex justify-center py-10"><Loader className="animate-spin text-primary" /></div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-neutral-500 mb-4">No templates found.</p>
                                    <Link to="/agreements/new" className="text-primary font-bold hover:underline">Create New Template</Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {templates.map(tpl => (
                                        <button
                                            key={tpl._id}
                                            onClick={() => handleAssign(tpl._id)}
                                            disabled={assigning}
                                            className="w-full text-left p-4 rounded-xl border border-neutral-200 hover:border-primary hover:bg-neutral-50 transition-all group relative"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-neutral-800 group-hover:text-primary transition-colors">{tpl.name}</h4>
                                                    <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
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
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/listings')} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-neutral-800 line-clamp-1">{listing.title}</h1>

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
                        {!completeness.isReady ? (
                            <button className="btn-primary opacity-50 cursor-not-allowed flex items-center gap-2 px-4 py-2 text-sm">
                                <AlertTriangle size={16} /> Complete Setup to Publish
                            </button>
                        ) : listing.status === 'Published' ? (
                            <button
                                onClick={() => handlePublish('Draft')}
                                disabled={publishing}
                                className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
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
                {activeTab !== 'overview' && activeTab !== 'agreements' && activeTab !== 'rooms' && (
                    <div className="text-center py-20 text-neutral-400 bg-white rounded-2xl border border-neutral-200 dashed">
                        Module "{activeTab}" coming in next phase.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListingManagement;
