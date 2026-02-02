import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Ensure this points to your axios instance
import { User, Calendar, MapPin, CheckCircle, XCircle, Mail, Phone, ArrowLeft, FileText, Briefcase } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooking();
    }, [id]);

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

    const handleAction = async (action) => {
        if (!confirm(`Are you sure you want to ${action} this booking?`)) return;

        try {
            await api.put(`/bookings/${id}/status`, { action });
            toast.success(`Booking ${action}ed successfully`);
            fetchBooking(); // Refresh
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Action failed');
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
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide 
                        ${booking.status === 'confirmed' || booking.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            booking.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {booking.status}
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
                                <div className="flex items-center gap-3 text-neutral-700">
                                    <Briefcase size={18} className="text-neutral-400" />
                                    <span>{applicationData.occupation}</span>
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

                            <div className="pt-4 flex gap-3">
                                <a href={`mailto:${seeker.email}`} className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50">
                                    <Mail size={18} /> Email
                                </a>
                                {applicationData?.phone && (
                                    <a href={`tel:${applicationData.phone}`} className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50">
                                        <Phone size={18} /> Call
                                    </a>
                                )}
                            </div>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-neutral-200 p-3 rounded-lg">
                                    <p className="text-xs text-neutral-500">Check In</p>
                                    <p className="font-bold text-neutral-900">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                                </div>
                                <div className="border border-neutral-200 p-3 rounded-lg">
                                    <p className="text-xs text-neutral-500">Check Out</p>
                                    <p className="font-bold text-neutral-900">{new Date(booking.checkOutDate).toLocaleDateString()}</p>
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
                    <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex justify-end gap-3">
                        <button
                            onClick={() => handleAction('reject')}
                            className="bg-white border border-red-200 text-red-600 px-6 py-2 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <XCircle size={18} /> Reject
                        </button>
                        <button
                            onClick={() => handleAction('accept')}
                            className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-200"
                        >
                            <CheckCircle size={18} /> Accept Application
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingDetails;
