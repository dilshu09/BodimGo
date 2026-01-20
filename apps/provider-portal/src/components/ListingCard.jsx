import { Link } from 'react-router-dom';
import { MapPin, Users, BedDouble, AlertCircle, CheckCircle, MoreVertical, Edit2, PauseCircle, PlayCircle, Eye } from 'lucide-react';
import { checkListingCompleteness } from '../utils/listingCompleteness';

const ListingCard = ({ listing }) => {
    const { percent, missing, isReady } = checkListingCompleteness(listing);

    // Status Badge Logic
    const getStatusBadge = () => {
        if (listing.status === 'Published' && isReady) return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">Published</span>;
        if (listing.status === 'Published' && !isReady) return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200">Action Required</span>;
        if (listing.status === 'Draft' || !isReady) return <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-full border border-neutral-200">Setup Required</span>;
        if (listing.status === 'Paused') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">Paused</span>;
        return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">{listing.status}</span>;
    };

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
            {/* Cover Image */}
            <div className="h-40 bg-neutral-200 relative group">
                {listing.images && listing.images.length > 0 ? (
                    <img
                        src={typeof listing.images[0] === 'string' ? listing.images[0] : listing.images[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No Image</div>
                )}
                <div className="absolute top-3 right-3">
                    {getStatusBadge()}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Link to={`/listings/${listing._id}`} className="p-2 bg-white rounded-full text-neutral-800 hover:scale-105 transition-transform">
                        <Edit2 size={18} />
                    </Link>
                    <button className="p-2 bg-white rounded-full text-neutral-800 hover:scale-105 transition-transform">
                        <Eye size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="font-bold text-neutral-800 line-clamp-1">{listing.title || 'Untitled Property'}</h3>
                        <div className="flex items-center gap-1 text-xs text-neutral-500 mt-1">
                            <MapPin size={12} />
                            {listing.location?.city || 'Location Pending'}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 my-4">
                    <div className="bg-neutral-50 p-2 rounded-lg text-center">
                        <span className="block text-xs text-neutral-400 font-medium">Occupancy</span>
                        <span className="block text-sm font-bold text-neutral-700">60%</span>
                    </div>
                    <div className="bg-neutral-50 p-2 rounded-lg text-center">
                        <span className="block text-xs text-neutral-400 font-medium">Inquiries</span>
                        <span className="block text-sm font-bold text-neutral-700">12</span>
                    </div>
                </div>

                {/* Progress or Status */}
                <div className="mt-auto">
                    {!isReady && listing.status !== 'Published' ? (
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                            <div className="flex items-center justify-between text-xs font-semibold text-orange-700 mb-1">
                                <span>Setup Required</span>
                                <span>{percent}%</span>
                            </div>
                            <div className="h-1.5 bg-orange-200 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-orange-500" style={{ width: `${percent}%` }} />
                            </div>
                            {missing[0] && (
                                <div className="flex items-center gap-1.5 text-xs text-orange-600">
                                    <AlertCircle size={10} />
                                    <span>Missing: {missing[0]}</span>
                                </div>
                            )}
                            <Link to={`/listings/${listing._id}`} className="block w-full text-center mt-3 bg-white border border-orange-200 text-orange-700 text-xs font-bold py-2.5 rounded-xl hover:bg-orange-50 transition-colors shadow-sm">
                                Complete Setup
                            </Link>
                        </div>
                    ) : (
                        <Link
                            to={`/listings/${listing._id}`}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-neutral-800 hover:shadow-lg transition-all transform active:scale-[0.98]"
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
