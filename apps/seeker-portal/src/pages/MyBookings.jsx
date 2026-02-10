import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Calendar, MapPin, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

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
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><Clock size={14} /> Pending</span>;
            case 'accepted':
                return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Accepted</span>;
            case 'pending_payment':
                return <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><CreditCard size={14} /> Awaiting Payment</span>;
            case 'confirmed':
                return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> Confirmed</span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"><XCircle size={14} /> Rejected</span>;
            default:
                return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">{status}</span>;
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-neutral-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-neutral-900 mb-8">My Bookings</h1>

                {bookings.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-neutral-100">
                        <Clock size={48} className="mx-auto text-neutral-300 mb-4" />
                        <h3 className="text-lg font-bold text-neutral-900">No bookings yet</h3>
                        <p className="text-neutral-500 mb-6">You haven't made any booking requests yet.</p>
                        <Link to="/" className="btn-primary px-6 py-2 rounded-full font-bold">Browse Listings</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <div key={booking._id} className="bg-white p-6 rounded-2xl shadow-card border border-neutral-100 flex flex-col md:flex-row gap-6">
                                {/* Listing Image */}
                                <div className="w-full md:w-48 h-32 shrink-0">
                                    <img
                                        src={booking.listing?.images?.[0] || 'https://via.placeholder.com/300'}
                                        alt={booking.listing?.title}
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-neutral-900">{booking.listing?.title}</h3>
                                        {getStatusBadge(booking.status)}
                                    </div>

                                    <div className="text-neutral-500 space-y-1 mb-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} />
                                            <span className="text-sm">{booking.listing?.location?.address || 'Address hidden'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} />
                                            <span className="text-sm">
                                                {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                        <Link to={`/listings/${booking.listing?._id}`} className="text-primary font-bold hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
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
        </div>
    );
};

export default MyBookings;
