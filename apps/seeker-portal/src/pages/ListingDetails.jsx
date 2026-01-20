import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { MapPin, User, Check, ShieldCheck } from 'lucide-react';

const ListingDetails = () => {
    const { id } = useParams();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/listings/${id}`);
                setListing(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);


    const navigate = useNavigate();

    const handleReserve = async () => {
        // Basic hardcoded dates for MVP demo
        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days

        try {
            const res = await api.post('/bookings', {
                listingId: listing._id,
                startDate,
                endDate,
                guests: 1
            });
            navigate(`/checkout/${res.data._id}`);
        } catch (err) {
            alert('Please login to reserve');
            // prompt login or redirect
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!listing) return <div>Listing not found</div>;

    return (
        <div className="min-h-screen bg-white pb-20">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-neutral-900 mb-4">{listing.title}</h1>

                {/* Images Grid (Mock for MVP: just one Main or placeholder) */}
                <div className="h-[400px] bg-neutral-200 rounded-2xl overflow-hidden mb-8 grid grid-cols-4 grid-rows-2 gap-2 relative">
                    <div className="col-span-2 row-span-2 bg-neutral-300">
                        {/* Main Image */}
                        {listing.images?.[0] && <img src={listing.images[0]} className="w-full h-full object-cover" />}
                    </div>
                    <div className="bg-neutral-300"></div><div className="bg-neutral-300"></div>
                    <div className="bg-neutral-300"></div><div className="bg-neutral-300"></div>
                    <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:scale-105 transition-transform">Show all photos</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex justify-between items-center border-b border-neutral-200 pb-6">
                            <div>
                                <h2 className="text-xl font-bold text-neutral-800 mb-1">
                                    {listing.type === 'entire_place' ? 'Entire unit' : 'Private room'} hosted by {listing.provider?.name}
                                </h2>
                                <p className="text-neutral-500 text-sm">2 guests • 1 bedroom • 1 bed • 1 bath</p>
                            </div>
                            <div className="h-12 w-12 bg-neutral-200 rounded-full flex items-center justify-center">
                                <User size={24} />
                            </div>
                        </div>

                        {listing.provider?.isVerified && (
                            <div className="flex items-center gap-4 border-b border-neutral-200 pb-6">
                                <ShieldCheck size={24} className="text-neutral-800" />
                                <div>
                                    <h3 className="font-bold text-sm text-neutral-800">Identity verified</h3>
                                    <p className="text-neutral-500 text-sm">This host has successfully completed identity checks.</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <h3 className="text-xl font-bold text-neutral-800 mb-4">About this place</h3>
                            <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-neutral-800 mb-4">What this place offers</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {listing.facilities.map(facility => (
                                    <div key={facility} className="flex items-center gap-3 text-neutral-600">
                                        <Check size={18} />
                                        <span>{facility}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Booking Card */}
                    <div className="relative">
                        <div className="sticky top-28 bg-white border border-neutral-200 shadow-xl rounded-2xl p-6">
                            <div className="flex justify-between items-baseline mb-6">
                                <div>
                                    <span className="text-2xl font-bold text-neutral-900">Rs {listing.rent.toLocaleString()}</span>
                                    <span className="text-neutral-500"> month</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="border border-neutral-400 rounded-lg p-3">
                                    <div className="text-xs font-bold uppercase text-neutral-800">Check-in</div>
                                    <div className="text-sm text-neutral-600">Today</div>
                                </div>
                                <button onClick={handleReserve} className="w-full btn-primary py-3 text-lg">Reserve</button>
                            </div>

                            <p className="text-center text-xs text-neutral-500 mt-4">You won't be charged yet</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetails;
