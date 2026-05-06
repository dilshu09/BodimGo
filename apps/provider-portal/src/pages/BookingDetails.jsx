import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Ensure this points to your axios instance
import { User, Calendar, MapPin, CheckCircle, XCircle, Mail, Phone, ArrowLeft, FileText, Briefcase, Home } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

const BookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form state for acceptance
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null);

    useEffect(() => {
        fetchBooking();
    }, [id]);

    useEffect(() => {
        if (booking) {
            if (booking.room) {
                setSelectedRoomId(booking.room);
            } else if (booking.listing?.rooms?.length > 0) {
                // Default to first available room if none requested (fallback)
                const firstAvailable = booking.listing.rooms.find(r => r.status === 'Available');
                if (firstAvailable) setSelectedRoomId(firstAvailable._id);
            }
        }
    }, [booking]);

    const fetchBooking = async () => {
        try {
            const res = await api.get(`/bookings/${id}`);
            setBooking(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (action) => {
        setActionToConfirm(action);
        setIsConfirmModalOpen(true);
    };

    const confirmAction = async () => {
        if (!actionToConfirm) return;

        if (actionToConfirm === 'accept' && !selectedRoomId) {
            toast.error("Please select a room to assign to this tenant.");
            setIsConfirmModalOpen(false);
            return;
        }

        try {
            await api.put(`/bookings/${id}/status`, { 
                action: actionToConfirm,
                roomId: selectedRoomId 
            });
            toast.success(`Booking ${actionToConfirm}ed successfully`);
            fetchBooking(); // Refresh
            setIsConfirmModalOpen(false);
            setActionToConfirm(null);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Action failed');
            setIsConfirmModalOpen(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!booking) return <div className="p-8 text-center">Booking not found</div>;

    const { seeker, listing, applicationData } = booking;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button onClick={() => navigate('/bookings')} className="flex items-center gap-2 text-neutral-500 mb-6 hover:text-black">
                <ArrowLeft size={20} /> Back to Bookings
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-neutral-100 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Booking Request</h1>
                        <p className="text-neutral-500 text-sm">Created on {new Date(booking.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                        <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide 
                        ${booking.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {booking.paymentStatus || 'Unpaid'}
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide 
                        ${booking.status === 'confirmed' || booking.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                booking.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {booking.status}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Seeker / Application Info */}
                    <div className="p-6 border-r border-neutral-100">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <User size={20} /> Applicant Details
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-500">
                                    {(applicationData?.name || seeker.name).charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-neutral-900">{applicationData?.name || seeker.name}</p>
                                    <p className="text-sm text-neutral-500">{seeker.email}</p>
                                </div>
                            </div>

                            {applicationData?.occupation && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 text-neutral-700">
                                        <Briefcase size={18} className="text-neutral-400" />
                                        <span className="font-medium">{applicationData.occupation}</span>
                                    </div>
                                    {applicationData.organization && (
                                        <div className="pl-8 text-sm text-neutral-600">
                                            <span className="font-bold">Institute:</span> {applicationData.organization}
                                        </div>
                                    )}
                                    {applicationData.faculty && (
                                        <div className="pl-8 text-sm text-neutral-600">
                                            <span className="font-bold">Faculty:</span> {applicationData.faculty}
                                        </div>
                                    )}
                                    {applicationData.workplace && (
                                        <div className="pl-8 text-sm text-neutral-600">
                                            <span className="font-bold">Workplace:</span> {applicationData.workplace}
                                        </div>
                                    )}
                                    {applicationData.otherDescription && (
                                        <div className="pl-8 text-sm text-neutral-600">
                                            <span className="font-bold">Details:</span> {applicationData.otherDescription}
                                        </div>
                                    )}
                                </div>
                            )}

                            {applicationData?.phone && (
                                <div className="flex items-center gap-3 text-neutral-700">
                                    <Phone size={18} className="text-neutral-400" />
                                    <span>{applicationData.phone}</span>
                                </div>
                            )}

                            {applicationData?.note && (
                                <div className="bg-neutral-50 p-4 rounded-xl mt-4">
                                    <p className="text-xs font-bold text-neutral-500 mb-1 uppercase">Note from Seeker</p>
                                    <p className="text-sm text-neutral-700 italic">"{applicationData.note}"</p>
                                </div>
                            )}

                            {/* Email/Call buttons removed */}
                        </div>
                    </div>

                    {/* Booking / Room Info */}
                    <div className="p-6">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <FileText size={20} /> Reservation Details
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-neutral-50 p-4 rounded-xl flex gap-4">
                                <img src={listing.images[0] || "/placeholder.jpg"} className="w-16 h-16 rounded-lg object-cover" />
                                <div>
                                    <p className="font-bold text-neutral-900 line-clamp-1">{listing.title}</p>
                                    <p className="text-sm text-neutral-500 flex items-center gap-1">
                                        <MapPin size={12} /> {listing.location?.city}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1">
                                <div className="border border-neutral-200 p-3 rounded-lg">
                                    <p className="text-xs text-neutral-500">Check In</p>
                                    <p className="font-bold text-neutral-900">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-2 border-t border-neutral-100 mt-2">
                                <span className="text-neutral-600">Monthly Rent</span>
                                <span className="font-bold">Rs {booking.agreedMonthRent?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-t border-neutral-100">
                                <span className="text-neutral-600">Security Deposit</span>
                                <span className="font-bold">Rs {booking.agreedDeposit?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                {booking.status === 'pending' && (
                    <div className="p-8 bg-neutral-50 border-t border-neutral-200">
                        <div className="mb-6 max-w-sm">
                            <label className="block text-sm font-bold text-neutral-700 mb-2 flex items-center gap-2">
                                <Home size={16} className="text-primary" /> Assign Room for Tenant
                            </label>
                            <select 
                                value={selectedRoomId} 
                                onChange={(e) => setSelectedRoomId(e.target.value)}
                                className="w-full p-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-white font-medium"
                            >
                                <option value="">-- Select Room --</option>
                                {listing.rooms?.map(room => (
                                    <option key={room._id} value={room._id} disabled={room.status === 'Occupied' && room._id !== booking.room}>
                                        {room.name} ({room.type}) {room._id === booking.room ? '⭐ Requested by Seeker' : `- ${room.status}`}
                                    </option>
                                ))}
                            </select>
                            {selectedRoomId && (
                                <p className="text-xs text-neutral-500 mt-2 italic">
                                    Room will be marked as "Occupied" upon acceptance.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => handleActionClick('reject')}
                                className="bg-white border border-red-200 text-red-600 px-6 py-2.5 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <XCircle size={18} /> Reject
                            </button>
                            <button
                                onClick={() => handleActionClick('accept')}
                                className="bg-primary text-white px-8 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <CheckCircle size={18} /> Accept & Assign Room
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                title={`${actionToConfirm === 'accept' ? 'Accept' : 'Reject'} Booking Request`}
                message={`Are you sure you want to ${actionToConfirm} this booking request? This action will notify the applicant.`}
                confirmText={actionToConfirm === 'accept' ? 'Accept Request' : 'Reject Request'}
                cancelText="Cancel"
                isDanger={actionToConfirm === 'reject'}
                onConfirm={confirmAction}
                onCancel={() => {
                    setIsConfirmModalOpen(false);
                    setActionToConfirm(null);
                }}
            />
        </div>
    );
};

export default BookingDetails;
