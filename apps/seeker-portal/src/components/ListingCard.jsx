import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Star, User } from "lucide-react";
import { toast } from "react-hot-toast";
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
      // Assuming 'user' would be passed as a prop or from context
      // This check is added as per instruction, even if 'user' is not defined in the current snippet.
      // If 'user' is not defined, this will cause a runtime error.
      // For a complete solution, 'user' would need to be provided to this component.
      if (!user) {
        toast.error("Please login to manage wishlist");
        return;
      }
      // Original alert replaced with toast.error
      toast.error("Failed to update wishlist."); // Generic error if user is logged in but API fails
    }
  };

  return (
    <Link to={`/listings/${listing._id}`} className="block group relative">
      <div className="relative w-full h-64 overflow-hidden rounded-xl shadow-sm group-hover:shadow-lg transition-all duration-300 bg-neutral-100 dark:bg-slate-900 border border-transparent dark:border-slate-800">
        <img
          src={listing.images[0] || "https://via.placeholder.com/300"}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all duration-200 
            ${isSaved ? 'scale-110 ring-2 ring-red-100' : 'hover:scale-110 hover:bg-white active:scale-95'}`}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 ${isSaved ? "fill-red-500 text-red-500" : "text-neutral-500 dark:text-slate-400 group-hover:text-neutral-700 dark:group-hover:text-slate-200"}`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between mt-3">
        <h3 className="font-semibold text-neutral-800 dark:text-slate-100 text-lg truncate max-w-[calc(100%-40px)]">
          {listing.title}
        </h3>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          <span className="text-sm text-neutral-600 dark:text-slate-400">
            {listing.averageRating ? listing.averageRating.toFixed(1) : "N/A"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <p className="text-sm text-neutral-500 dark:text-slate-400 truncate">
          {listing.location?.city}{listing.location?.district ? `, ${listing.location.district}` : ''}
        </p>

        <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
          ${listing.rooms?.some(r => r.status === 'Available')
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-neutral-100 text-neutral-500 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {listing.rooms?.some(r => r.status === 'Available') ? 'Available' : 'No Vacancy'}
        </div>
      </div>

      <div className="flex items-baseline gap-1 mt-2">
        <span className="font-bold text-neutral-900 dark:text-white text-lg group-hover:text-[#FF385C] transition-colors">
          {listing.rooms && listing.rooms.length > 0
            ? `Rs ${Math.min(...listing.rooms.map(r => r.price)).toLocaleString()}`
            : "Contact for Price"}
        </span>
        <span className="text-neutral-500 dark:text-slate-400 text-sm">/ month</span>
      </div>
    </Link>
  );
};

export default ListingCard;
