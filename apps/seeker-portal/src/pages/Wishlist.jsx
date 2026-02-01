
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import api from '../services/api';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const res = await api.get('/seekers/wishlist');
                setWishlist(res.data.savedListings || []);
            } catch (err) {
                console.error("Failed to fetch wishlist", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, []);

    const handleRemove = async (listingId) => {
        try {
            await api.delete(`/seekers/wishlist/${listingId}`);
            setWishlist(prev => prev.filter(item => item._id !== listingId));
        } catch (err) {
            console.error("Failed to remove item", err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-neutral-900 mb-8">Wishlist</h1>
                    <div className="text-neutral-500">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-neutral-900 mb-8">Wishlist</h1>

                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {wishlist.map(listing => (
                            <ListingCard
                                key={listing._id}
                                listing={listing}
                                isSaved={true}
                                onToggleWishlist={handleRemove}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-4xl mb-4">❤️</div>
                        <h2 className="text-xl font-bold text-neutral-800 mb-2">No items yet</h2>
                        <p className="text-neutral-500">Start saving your favorite places!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;
