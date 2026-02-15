import { Link } from 'react-router-dom';
import { MapPin, Users, BedDouble, AlertCircle, CheckCircle, MoreVertical, Edit2, PauseCircle, PlayCircle, Eye, Trash2 } from 'lucide-react';
import { checkListingCompleteness } from '../utils/listingCompleteness';

const ListingCard = ({ listing, onDelete }) => {
    const { percent, missing, isReady } = checkListingCompleteness(listing);

    // Status Badge Logic
    const getStatusBadge = () => {
        if (listing.status === 'Published' && isReady) return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full border border-green-200 dark:border-green-800">Published</span>;
        if (listing.status === 'Published' && !isReady) return <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full border border-orange-200 dark:border-orange-800">Action Required</span>;
        if (listing.status === 'Draft' || !isReady) return <span className="px-2 py-1 bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 text-xs font-bold rounded-full border border-neutral-200 dark:border-slate-700">Setup Required</span>;
        if (listing.status === 'Paused') return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold rounded-full border border-yellow-200 dark:border-yellow-800">Paused</span>;
        return <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs font-bold rounded-full">{listing.status}</span>;
    };

    return (
        <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-[#FF385C] dark:hover:border-[#FF385C] transition-all duration-300 overflow-hidden flex flex-col h-full relative">
            {/* Cover Image */}
            <div className="h-44 bg-neutral-200 dark:bg-slate-800 relative overflow-hidden">
                {listing.images && listing.images.length > 0 ? (
                    <img
                        src={typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No Image</div>
                )}
                <div className="absolute top-3 right-3 z-10">
                    {getStatusBadge()}
                </div>

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]">
                    <Link to={`/listings/${listing._id}`} className="p-3 bg-white rounded-full text-neutral-800 hover:text-[#FF385C] hover:scale-110 transition-all shadow-lg">
                        <Edit2 size={20} />
                    </Link>
                    <button className="p-3 bg-white rounded-full text-neutral-800 hover:text-[#FF385C] hover:scale-110 transition-all shadow-lg">
                        <Eye size={20} />
                    </button>
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(listing._id);
                            }}
                            className="p-3 bg-white rounded-full text-neutral-800 hover:text-red-600 hover:bg-red-50 hover:scale-110 transition-all shadow-lg"
                            title="Delete Listing"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-1 text-lg group-hover:text-[#FF385C] transition-colors">{listing.title || 'Untitled Property'}</h3>
                        <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-slate-400 mt-1 font-medium">
                            <MapPin size={12} />
                            {listing.location?.city || 'Location Pending'}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="bg-neutral-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-center border border-neutral-100 dark:border-slate-800">
                        <span className="block text-[10px] uppercase tracking-wider text-neutral-400 dark:text-slate-500 font-bold mb-1">Occupancy</span>
                        <div className="flex items-center justify-center gap-1">
                            <Users size={14} className="text-neutral-400 dark:text-slate-500" />
                            <span className="text-sm font-bold text-neutral-700 dark:text-slate-200">60%</span>
                        </div>
                    </div>
                    <div className="bg-neutral-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-center border border-neutral-100 dark:border-slate-800">
                        <span className="block text-[10px] uppercase tracking-wider text-neutral-400 dark:text-slate-500 font-bold mb-1">Inquiries</span>
                        <span className="block text-sm font-bold text-neutral-700 dark:text-slate-200">12</span>
                    </div>
                </div>

                {/* Progress or Status */}
                <div className="mt-auto">
                    {!isReady && listing.status !== 'Published' ? (
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                            <div className="flex items-center justify-between text-xs font-bold text-orange-800 dark:text-orange-400 mb-2">
                                <span>Setup Required</span>
                                <span>{percent}%</span>
                            </div>
                            <div className="h-1.5 bg-orange-200 dark:bg-orange-900/50 rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                            {missing[0] && (
                                <div className="flex items-center gap-1.5 text-xs text-orange-700 dark:text-orange-400 mb-3 font-medium">
                                    <AlertCircle size={10} />
                                    <span>Missing: {missing[0]}</span>
                                </div>
                            )}
                            <Link to={`/listings/${listing._id}`} className="block w-full text-center bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs font-bold py-2.5 rounded-lg hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm">
                                Complete Setup
                            </Link>
                        </div>
                    ) : (
                        <Link
                            to={`/listings/${listing._id}`}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-900 dark:bg-slate-800 dark:text-white text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#FF385C] dark:hover:bg-[#FF385C] hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        >
                            Manage Property
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ListingCard;
