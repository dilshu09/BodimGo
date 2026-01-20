import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ListingCard from '../components/ListingCard';
import SearchBar from '../components/SearchBar';
import api from '../services/api';

const Home = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchListings = async (filters = {}) => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filters).toString();
            const res = await api.get(`/listings?${params}`);
            setListings(res.data);
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
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero / Filter Section */}
            <div className="border-b border-neutral-200 py-6 sticky top-20 bg-white z-40">
                <div className="max-w-7xl mx-auto px-4">
                    <SearchBar onSearch={fetchListings} />
                </div>
            </div>

            {/* Grid */}
            <main className="max-w-[1600px] mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-neutral-400">Loading homes...</div>
                ) : listings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                        {listings.map(listing => (
                            <ListingCard key={listing._id} listing={listing} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <h3 className="text-xl font-bold text-neutral-800">No matches found</h3>
                        <p className="text-neutral-500">Try changing your filters.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;
