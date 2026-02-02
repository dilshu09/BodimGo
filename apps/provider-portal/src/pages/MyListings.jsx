import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Search } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import api from '../services/api';

const MyListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const fetchListings = async () => {
            try {
                // Fetch basic listing info
                const res = await api.get('/listings/my');
                setListings(res.data.data || []);
            } catch (err) {
                console.error("Failed to load listings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, []);

    // Filter Logic
    const filteredListings = listings.filter(l => {
        if (filterStatus === 'All') return true;
        // Basic mapping for demo
        if (filterStatus === 'Draft') return l.status === 'Draft';
        if (filterStatus === 'Published') return l.status === 'Published';
        return true;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">My Listings</h1>
                    <p className="text-neutral-500 mt-2">Manage your diverse portfolio of boarding places.</p>
                </div>
                <Link to="/add-listing" className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/25 h-10 px-6">
                    <Plus size={18} />
                    Create New Listing
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-8 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title or city..."
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilterStatus('All')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'All' ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterStatus('Published')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'Published' ? 'bg-green-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                    >
                        Published
                    </button>
                    <button
                        onClick={() => setFilterStatus('Draft')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'Draft' ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                    >
                        Setup Required
                    </button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20 text-neutral-400">Loading properties...</div>
            ) : filteredListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map(listing => (
                        <ListingCard key={listing._id} listing={listing} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-300">
                    <h3 className="text-lg font-medium text-neutral-800 mb-2">No properties found</h3>
                    <p className="text-neutral-500 mb-6">Adjust your filters or create a new listing.</p>
                </div>
            )}
        </div>
    );
};

export default MyListings;
