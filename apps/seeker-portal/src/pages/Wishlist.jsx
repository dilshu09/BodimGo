
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import ConfirmationModal from '../components/ConfirmationModal';
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToRemove, setItemToRemove] = useState(null);

    const handleRemoveClick = (listingId) => {
        setItemToRemove(listingId);
        setIsModalOpen(true);
    };

    const confirmRemove = async () => {
        if (!itemToRemove) return;
        try {
            await api.delete(`/seekers/wishlist/${itemToRemove}`);
            setWishlist(prev => prev.filter(item => item._id !== itemToRemove));
            setIsModalOpen(false);
            setItemToRemove(null);
        } catch (err) {
            console.error("Failed to remove item", err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 transition-colors duration-200">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8">Wishlist</h1>
                    <div className="text-neutral-500 dark:text-slate-400">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 transition-colors duration-200">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8">Wishlist</h1>

                {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {wishlist.map(listing => (
                            <ListingCard
                                key={listing._id}
                                listing={listing}
                                isSaved={true}
                                onToggleWishlist={handleRemoveClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-4xl mb-4">❤️</div>
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">No items yet</h2>
                        <p className="text-neutral-500 dark:text-slate-400">Start saving your favorite places!</p>
                    </div>
                )}

                <ConfirmationModal
                    isOpen={isModalOpen}
                    title="Remove from Wishlist"
                    message="Are you sure you want to remove this property from your wishlist?"
                    confirmText="Remove"
                    cancelText="Keep"
                    isDanger={true}
                    onConfirm={confirmRemove}
                    onCancel={() => setIsModalOpen(false)}
                />
            </div>
        </div>
    );
};

export default Wishlist;
