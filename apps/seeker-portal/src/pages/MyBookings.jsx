import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import ConfirmationModal from '../components/ConfirmationModal';
import { Calendar, MapPin, CreditCard, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings');
            // Assuming the API returns an array of bookings directly or inside a data property
            setBookings(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch bookings", err);
            toast.error("Failed to load bookings");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (bookingId) => {
        setBookingToDelete(bookingId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!bookingToDelete) return;
        try {
            await api.delete(`/bookings/${bookingToDelete}`);
            setBookings(prev => prev.filter(b => b._id !== bookingToDelete));
            toast.success("Booking request removed");
            setIsDeleteModalOpen(false);
            setBookingToDelete(null);
        } catch (err) {
            console.error("Failed to delete booking", err);
            toast.error(err.response?.data?.message || "Failed to remove booking");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><Clock size={14} /> Pending</span>;
            case 'accepted':
                return <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Accepted</span>;
            case 'pending_payment':
                return <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><CreditCard size={14} /> Awaiting Payment</span>;
            case 'confirmed':
                return <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Confirmed</span>;
            case 'rejected':
                return <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><XCircle size={14} /> Rejected</span>;
            default:
                return <span className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 px-3 py-1 rounded-full text-sm font-medium">{status}</span>;
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 transition-colors duration-200">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 dark:bg-slate-800 rounded"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 transition-colors duration-200">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8 pt-24">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8">My Bookings</h1>

                {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-800 transition-colors">
                        <Clock size={48} className="mx-auto text-neutral-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No bookings yet</h3>
                        <p className="text-neutral-500 dark:text-slate-400 mb-6">You haven't made any booking requests yet.</p>
                        <Link to="/" className="btn-primary px-6 py-2 rounded-full font-bold">Browse Listings</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <div key={booking._id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-card dark:shadow-none border border-neutral-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 transition-colors hover:shadow-lg dark:hover:bg-slate-800/50">
                                {/* Listing Image */}
                                <div className="w-full md:w-48 h-32 shrink-0 bg-neutral-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                                    <img
                                        src={booking.listing?.images?.[0] || 'https://via.placeholder.com/300'}
                                        alt={booking.listing?.title}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{booking.listing?.title}</h3>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(booking.status)}
                                            <button
                                                onClick={() => handleDeleteClick(booking._id)}
                                                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                title="Remove Booking"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-neutral-500 dark:text-slate-400 space-y-1 mb-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-neutral-400 dark:text-slate-500" />
                                            <span className="text-sm text-neutral-600 dark:text-slate-300">{booking.listing?.location?.address || 'Address hidden'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-neutral-400 dark:text-slate-500" />
                                            <span className="text-sm text-neutral-600 dark:text-slate-300">
                                                {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-slate-800">
                                        <Link to={`/listings/${booking.listing?._id}`} className="text-primary font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-4 py-2 rounded-lg transition-colors">
                                            View Listing
                                        </Link>

                                        {(booking.status === 'accepted' || booking.status === 'pending_payment') && (
                                            <Link
                                                to={`/checkout/${booking._id}`}
                                                className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                                            >
                                                <CreditCard size={18} />
                                                Pay Now
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Remove Booking Request"
                message="Are you sure you want to remove this booking request? This action cannot be undone."
                confirmText="Remove"
                cancelText="Keep it"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </div >
    );
};

export default MyBookings;
