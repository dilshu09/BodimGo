import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import SearchBar from '../components/SearchBar';
import { SkeletonGrid } from '../components/Skeleton';
import api from '../services/api';

const Home = () => {
    const [listings, setListings] = useState([]);
    const [wishlistParams, setWishlistParams] = useState(new Set());
    const [loading, setLoading] = useState(true);

    const fetchListings = async (filters = {}) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filters).toString();
            // Fetch listings and wishlist status in parallel
            const [listingsRes, wishlistRes] = await Promise.all([
                api.get(`/listings?${params}`),
                api.get('/seekers/wishlist').catch(() => ({ data: { savedListings: [] } })) // Optional: Ignore error if not logged in
            ]);

            setListings(listingsRes.data);

            // Map saved listing objects to a Set of IDs for O(1) lookup
            const savedIds = new Set(wishlistRes.data?.savedListings?.map(l => l._id) || []);
            setWishlistParams(savedIds);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-20 transition-colors duration-200">
            <Navbar />

            {/* Hero / Filter Section */}
            <div className="border-b border-neutral-200 dark:border-slate-800 py-6 sticky top-20 bg-white dark:bg-slate-950 z-40 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4">
                    <SearchBar onSearch={fetchListings} />
                </div>
            </div>

            {/* Grid */}
            <main className="max-w-[1600px] mx-auto px-4 py-8">
                {loading ? (
                    <SkeletonGrid count={10} />
                ) : listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                        {listings.map(listing => (
                            <ListingCard
                                key={listing._id}
                                listing={listing}
                                isSaved={wishlistParams.has(listing._id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h3 className="text-xl font-bold text-neutral-800 dark:text-white">No matches found</h3>
                        <p className="text-neutral-500 dark:text-slate-400">Try changing your filters.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;
