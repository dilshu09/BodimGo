import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';

const ListingCard = ({ listing }) => {
    return (
        <Link to={`/listings/${listing._id}`} className="group block">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-200 mb-3">
                {listing.images && listing.images.length > 0 ? (
                    <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-neutral-400 text-sm">No Image</div>
                )}
                <button className="absolute top-3 right-3 text-white/70 hover:text-white hover:scale-110 transition-all">
                    <Heart size={24} fill="rgba(0,0,0,0.2)" />
                </button>
            </div>

            <div className="flex justify-between items-start">
                <h3 className="font-bold text-neutral-900 truncate pr-2">{listing.title}</h3>
                <div className="flex items-center gap-1 text-sm">
                    <Star size={14} className="text-black fill-black" />
                    <span>4.9</span> {/* Mock Rating for now */}
                </div>
            </div>

            <p className="text-neutral-500 text-sm">{listing.property?.location?.city || listing.location?.city || 'Colombo'}</p>
            <p className="text-neutral-500 text-sm mb-1">{listing.type === 'entire_place' ? 'Entire Unit' : 'Private Room'}</p>

            <div className="flex items-baseline gap-1 mt-1">
                <span className="font-bold text-neutral-900 text-lg">Rs {listing.rent.toLocaleString()}</span>
                <span className="text-neutral-900">month</span>
            </div>
        </Link>
    );
};

export default ListingCard;
