import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import api from "../services/api";


const ListingCard = ({ listing, isSaved: initialSaved = false, onToggleWishlist }) => {
  const [isSaved, setIsSaved] = useState(initialSaved);

  // Sync state if prop changes
  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (onToggleWishlist) {
        // Let parent handle state (e.g., Wishlist page removing item)
        await onToggleWishlist(listing._id);
      } else {
        // Default behavior (Home page toggling)
        if (isSaved) {
          await api.delete(`/seekers/wishlist/${listing._id}`);
          setIsSaved(false);
        } else {
          await api.post("/seekers/wishlist", { listingId: listing._id });
          setIsSaved(true);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Please login to manage wishlist");
    }
  };

  return (
    <Link to={`/listings/${listing._id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-200 mb-3">
        {listing.images && listing.images.length > 0 ? (
          <img
            src={
              typeof listing.images[0] === "string"
                ? listing.images[0]
                : listing.images[0].url
            }
            alt={listing.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-neutral-400 text-sm">
            No Image
          </div>
        )}

        {/* ❤️ WISHLIST BUTTON */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 hover:scale-110 transition-all z-10"
        >
          <Heart
            size={24}
            className={isSaved ? "fill-[#E51D54] text-white" : "fill-black/50 text-white"}
            strokeWidth={2}
          />
        </button>
      </div>

      <div className="flex justify-between items-start">
        <h3 className="font-bold text-neutral-900 truncate pr-2">
          {listing.title}
        </h3>
        <div className="flex items-center gap-1 text-sm">
          <Star size={14} className="text-black fill-black" />
          <span>
            {listing.stats?.averageRating > 0 ? listing.stats.averageRating : "New"}
            {listing.stats?.reviewCount > 0 && ` (${listing.stats.reviewCount})`}
          </span>
        </div>
      </div>

      <p className="text-neutral-500 text-sm">
        {listing.property?.location?.city ||
          listing.location?.city ||
          "Colombo"}
      </p>

      <p className="text-neutral-500 text-sm mb-1">
        {listing.type === "entire_place" ? "Entire Unit" : "Private Room"}
      </p>

      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-bold text-neutral-900 text-lg">
          {listing.rooms && listing.rooms.length > 0
            ? Math.min(...listing.rooms.map(r => r.price)).toLocaleString()
            : "Contact for Price"}
        </span>
        <span className="text-neutral-900">month</span>
      </div>
    </Link >
  );
};

export default ListingCard;
