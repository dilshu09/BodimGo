import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Search } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import api from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

const MyListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');

    // Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [listingToDelete, setListingToDelete] = useState(null);

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

    // Delete Trigger from Card
    const handleDeleteClick = (id) => {
        setListingToDelete(id);
        setIsDeleteModalOpen(true);
    };

    // Confirm Delete
    const confirmDelete = async () => {
        if (!listingToDelete) return;

        try {
            await api.delete(`/listings/${listingToDelete}`);
            // Remove from state
            setListings(prev => prev.filter(l => l._id !== listingToDelete));
            // Close modal
            setIsDeleteModalOpen(false);
            setListingToDelete(null);
        } catch (err) {
            console.error("Failed to delete listing", err);
            alert("Failed to delete listing. Please try again.");
            setIsDeleteModalOpen(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-800 dark:text-white tracking-tight">My Listings</h1>
                    <p className="text-neutral-500 dark:text-slate-400 mt-2">Manage your diverse portfolio of boarding places.</p>
                </div>
                <Link to="/add-listing" className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/25 h-10 px-6">
                    <Plus size={18} />
                    Create New Listing
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-neutral-200 dark:border-slate-800 shadow-sm mb-8 flex flex-wrap items-center gap-4 transition-colors duration-200">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title or city..."
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-[#FF385C] dark:hover:border-[#FF385C] transition-colors duration-300"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilterStatus('All')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'All' ? 'bg-neutral-800 text-white dark:bg-slate-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterStatus('Published')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'Published' ? 'bg-green-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    >
                        Published
                    </button>
                    <button
                        onClick={() => setFilterStatus('Draft')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'Draft' ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
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
                        <ListingCard
                            key={listing._id}
                            listing={listing}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-neutral-300 dark:border-slate-700 transition-colors duration-200">
                    <h3 className="text-lg font-medium text-neutral-800 dark:text-white mb-2">No properties found</h3>
                    <p className="text-neutral-500 dark:text-slate-400 mb-6">Adjust your filters or create a new listing.</p>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Listing"
                message="Are you sure you want to delete this listing? This action cannot be undone and will remove all associated data."
                confirmText="Delete Listing"
                cancelText="Cancel"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setListingToDelete(null);
                }}
            />
        </div>
    );
};

export default MyListings;
