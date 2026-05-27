import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import AdvancedSearchSidebar from '../components/AdvancedSearchSidebar';
import { SkeletonGrid } from '../components/Skeleton';
import api from '../services/api';
import { SlidersHorizontal } from 'lucide-react';

const Home = () => {
    const [listings, setListings] = useState([]);
    const [wishlistParams, setWishlistParams] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);

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
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-20 transition-colors duration-200 flex flex-col">
            <Navbar />

            {/* Mobile Filter Trigger */}
            <div className="lg:hidden border-b border-neutral-200 dark:border-slate-800 py-4 sticky top-20 bg-white dark:bg-slate-950 z-30 px-4">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="w-full py-3 px-4 bg-neutral-100 dark:bg-slate-800 rounded-xl flex items-center justify-center gap-2 font-bold text-neutral-800 dark:text-slate-200 border border-neutral-200 dark:border-slate-700 hover:border-black dark:hover:border-slate-500 transition-colors"
                >
                    <SlidersHorizontal size={20} />
                    Filters & Search
                </button>
            </div>

            <main className="max-w-[1600px] w-full mx-auto px-4 py-6 flex gap-8 items-start flex-1">
                <AdvancedSearchSidebar
                    onSearch={fetchListings}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    isDesktopExpanded={isDesktopExpanded}
                    setIsDesktopExpanded={setIsDesktopExpanded}
                />

                <div className="flex-1 w-full min-w-0">
                    {loading ? (
                        <SkeletonGrid count={8} />
                    ) : listings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                            {listings.map(listing => (
                                <ListingCard
                                    key={listing._id}
                                    listing={listing}
                                    isSaved={wishlistParams.has(listing._id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-neutral-50 dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 mt-6">
                            <h3 className="text-xl font-bold text-neutral-800 dark:text-white">No matches found</h3>
                            <p className="text-neutral-500 dark:text-slate-400 mt-2">Try changing your filters or searching a different area.</p>
                            <button 
                                onClick={() => fetchListings({})}
                                className="mt-6 px-6 py-2 bg-black dark:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-full hover:scale-105 transition-transform"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Home;
