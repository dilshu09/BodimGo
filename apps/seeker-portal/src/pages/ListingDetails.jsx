import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { MapPin, User, Check, ShieldCheck, Star as StarIcon, Flag, MessageSquare, Star, Bath, Bed, Maximize, Heart, Share2, Shield, Calendar, AlertTriangle } from "lucide-react";
import ReviewModal from "../components/ReviewModal";
import ReportModal from "../components/ReportModal";
import { SkeletonDetails } from "../components/Skeleton";
import BookingWizard from "../components/BookingWizard";
import ViewingRequestModal from "../components/ViewingRequestModal";
import MessageModal from "../components/MessageModal";
import { toast } from 'react-hot-toast';

const ListingDetails = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProvider, setShowProvider] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showViewingModal, setShowViewingModal] = useState(false);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/listings/${id}`);
        setListing(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load listing details.");
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/listing/${id}`);
        setReviews(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    // Fetch user profile for Wiz pre-fill
    const fetchProfile = async () => {
      try {
        // New endpoint we might need or use existing. 
        // Assuming /auth/me or similar exists, OR /seekers/profile.
        // Based on previous logs, we have /seekers/profile (from wishlist logic finding SeekerProfile).
        // But SeekerProfile is for preferences. User model has name/email.
        // Let's try /users/me which is standard, or just rely on SeekerProfile + populate user.
        // If /seekers/profile doesn't exist, we might fail.
        // Let's assume we can GET /seekers/profile mentioned in previous turn logic.
        // Using /auth/profile as seen in auth.routes.js
        const res = await api.get('/auth/profile').catch(() => null);
        if (res && res.data) setUserProfile(res.data);
      } catch (err) {
        // Not logged in, Ignore
      }
    };

    const checkReviewEligibility = async () => {
      try {
        const res = await api.get('/bookings');
        const myBookings = Array.isArray(res.data) ? res.data : res.data.data || [];
        // Check if user has a confirmed/active booking for this listing
        const hasValidBooking = myBookings.some(b =>
          b.listing === id || (b.listing && b.listing._id === id) &&
          ['confirmed', 'active', 'completed', 'moved_out'].includes(b.status)
        );
        setCanReview(hasValidBooking);
      } catch (err) {
        // Likely not logged in or error fetching
        setCanReview(false);
      }
    };

    fetchDetails();
    fetchReviews();
    fetchProfile();
    checkReviewEligibility();
  }, [id]);

  const navigate = useNavigate();

  const handleRequestBook = () => {
    // If no user profile loaded (guest) OR user is not a seeker (admin/provider viewing as guest)
    if (!userProfile) {
      // We can also check if they are logged in but as wrong role by trying to fetch profile again or just let Login page handle it.
      // Since Navbar sets user=null for wrong roles, userProfile will be null here.
      // Redirect to login.
      navigate('/login');
      return;
    }
    setShowBookingWizard(true);
  };

  const onSuccessRequest = () => {
    setShowBookingWizard(false);
    alert("Request Sent! The provider will review it shortly.");
    // Maybe navigate to a "Requests" page? For now, stay here.
  };

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <SkeletonDetails />
      </div>
    </div>
  );
  if (!listing) return <div>Listing not found</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20 transition-colors duration-200">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-6">
          {listing.title}
        </h1>

        {/* Images Grid (Mock for MVP: just one Main or placeholder) */}
        <div className="h-[400px] bg-neutral-200 dark:bg-slate-800 rounded-2xl overflow-hidden mb-12 grid grid-cols-4 grid-rows-2 gap-2 relative">
          <div className="col-span-2 row-span-2 bg-neutral-300">
            {/* Main Image */}
            {listing.images?.[0] && (
              <img
                src={listing.images[0]}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="bg-neutral-300 dark:bg-slate-700"></div>
          <div className="bg-neutral-300 dark:bg-slate-700"></div>
          <div className="bg-neutral-300 dark:bg-slate-700"></div>
          <div className="bg-neutral-300 dark:bg-slate-700"></div>
          <button className="absolute bottom-4 right-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:scale-105 transition-transform text-neutral-900 dark:text-white">
            Show all photos
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-slate-800 pb-6">
              <div>
                <h2 className="text-xl font-bold text-neutral-800 dark:text-slate-100 mb-1">
                  {listing.type === "entire_place"
                    ? "Entire unit"
                    : "Private room"}{" "}
                  hosted by {listing.provider?.name}
                </h2>
                <p className="text-neutral-500 dark:text-slate-400 text-sm">
                  2 guests • 1 bedroom • 1 bed • 1 bath
                </p>
              </div>
              <button
                onClick={() => setShowProvider(true)}
                className="h-12 w-12 bg-neutral-200 dark:bg-slate-700 rounded-full flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-slate-600 transition overflow-hidden"
              >
                {listing.provider?.profileImage ? (
                  <img
                    src={listing.provider.profileImage}
                    alt={listing.provider.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={24} />
                )}
              </button>
            </div>


            {listing.provider?.isVerified && (
              <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-slate-800 pb-6">
                <ShieldCheck size={24} className="text-neutral-800 dark:text-slate-200" />
                <div>
                  <h3 className="font-bold text-sm text-neutral-800 dark:text-slate-100">
                    Identity verified
                  </h3>
                  <p className="text-neutral-500 dark:text-slate-400 text-sm">
                    This host has successfully completed identity checks.
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-neutral-800 dark:text-slate-100 mb-4">
                About this place
              </h3>
              <p className="text-neutral-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-neutral-800 dark:text-slate-100 mb-4">
                What this place offers
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {listing.facilities?.map((facility) => (
                  <div
                    key={facility}
                    className="flex items-center gap-3 text-neutral-600 dark:text-slate-300"
                  >
                    <Check size={18} />
                    <span>{facility}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Rooms Section */}
            {listing.rooms && listing.rooms.length > 0 && (
              <div className="border-t border-neutral-200 dark:border-slate-800 pt-8 mt-8">
                <h3 className="text-xl font-bold text-neutral-800 dark:text-slate-100 mb-6">
                  Available Rooms
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {listing.rooms.map((room) => (
                    <div key={room._id} className="border border-neutral-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col bg-white dark:bg-slate-900">
                      {/* Room Image */}
                      <div className="h-48 bg-neutral-100 dark:bg-slate-800 relative">
                        {room.images && room.images.length > 0 ? (
                          <img
                            src={typeof room.images[0] === 'string' ? room.images[0] : room.images[0].url}
                            className="w-full h-full object-cover"
                            alt={room.name}
                          />
                        ) : (
                          // Fallback to listing main image or placeholder
                          listing.images && listing.images[0] ? (
                            <img src={listing.images[0]} className="w-full h-full object-cover opacity-50" alt="Room" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-slate-500 text-sm">No Image</div>
                          )
                        )}
                        <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                          ${room.status === 'Available' ? 'bg-green-500 text-white' : 'bg-neutral-500 text-white'}`}>
                          {room.status}
                        </div>
                      </div>

                      {/* Room Details */}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-neutral-900 dark:text-white">{room.name}</h4>
                          <span className="font-bold text-neutral-900 dark:text-white">
                            Rs {room.price?.toLocaleString()} <span className="text-xs text-neutral-500 dark:text-slate-400 font-normal">/mo</span>
                          </span>
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                          <User size={14} /> {room.capacity} Person(s)
                          {room.occupancyMode === 'Entire Room' ? ' • Entire Room' : ' • Shared'}
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-2 mt-auto">
                          {room.features?.bathroomType && (
                            <span className="text-xs bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 px-2 py-1 rounded">{room.features.bathroomType} Bath</span>
                          )}
                          {room.features?.furnishing?.map((f, i) => (
                            <span key={i} className="text-xs bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 px-2 py-1 rounded">{f}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Section */}
            {listing.location && (
              <div className="border-t border-neutral-200 pt-8">
                <h3 className="text-xl font-bold text-neutral-800 mb-4">
                  Where you'll be
                </h3>
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-neutral-100 p-3 rounded-full">
                    <MapPin size={24} className="text-neutral-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white text-lg">
                      {listing.location.city}, {listing.location.district}
                    </p>
                    <p className="text-neutral-500 dark:text-slate-400">
                      {listing.location.address || "Exact location provided after booking"}
                    </p>
                  </div>
                </div>

                {listing.location.coordinates && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${listing.location.coordinates.lat},${listing.location.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-neutral-900 dark:border-slate-200 text-neutral-900 dark:text-slate-200 px-6 py-3 rounded-xl font-semibold hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <MapPin size={18} />
                    Show on Google Maps
                  </a>
                )}
              </div>
            )}


            {/* Reviews Section */}
            <div id="reviews-section">
              <div className="mb-8 border-b border-neutral-200 dark:border-slate-800 pb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Guest Reviews</h3>
                    <div className="flex items-center gap-4">
                      <div className="text-5xl font-extrabold text-neutral-900 dark:text-white">
                        {reviews.length > 0
                          ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                          : "New"}
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex gap-1 mb-1">
                          {[...Array(5)].map((_, i) => {
                            const avg = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
                            return (
                              <StarIcon
                                key={i}
                                size={18}
                                className={i < Math.round(avg) ? "fill-yellow-500 text-yellow-500" : "text-neutral-200 dark:text-slate-700"}
                              />
                            );
                          })}
                        </div>
                        <p className="text-neutral-500 dark:text-slate-400 font-medium">
                          Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {canReview && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="px-6 py-3 border border-neutral-900 dark:border-slate-200 rounded-xl font-semibold hover:bg-neutral-50 dark:hover:bg-slate-800 dark:text-slate-200 transition"
                    >
                      Write a review
                    </button>
                  )}
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b border-neutral-100 dark:border-slate-800 pb-6 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 bg-neutral-200 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                          {review.author?.profileImage ? (
                            <img src={review.author.profileImage} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-white">{review.author?.name || 'User'}</p>
                          <p className="text-xs text-neutral-500 dark:text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} size={14} className={i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-neutral-300 dark:text-slate-600"} />
                        ))}
                      </div>
                      <p className="text-neutral-700 dark:text-slate-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 dark:text-slate-400 italic">No reviews yet.</p>
              )}
            </div>

            {/* Report (Mobile/Bottom backup) */}
            <div className="block lg:hidden pt-6 border-t border-neutral-200 dark:border-slate-800">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 text-neutral-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-semibold underline"
              >
                <Flag size={16} />
                Report this listing
              </button>
            </div>
          </div>




          {/* Booking Card */}
          <div className="hidden lg:block relative">
            <div className="sticky top-28 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-[0_6px_16px_rgba(0,0,0,0.12)] rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                    Rs {listing.rooms && listing.rooms.length > 0
                      ? Math.min(...listing.rooms.map(r => r.price)).toLocaleString()
                      : (listing.rent ?? "N/A")}
                  </span>
                  <span className="text-neutral-500 dark:text-slate-400"> month</span>
                </div>
                {/* Review Mini-Summary in Card */}
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <StarIcon size={14} className="fill-yellow-500 text-yellow-500" />
                  {reviews.length > 0 ? (
                    <>
                      <span>{(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}</span>
                      <span className="text-neutral-400">·</span>
                      <a href="#reviews-section" className="text-neutral-500 dark:text-slate-400 underline hover:text-black dark:hover:text-white transition">
                        {reviews.length} reviews
                      </a>
                    </>
                  ) : (
                    <span className="text-neutral-400">New</span>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div className="border border-neutral-400 rounded-lg p-3">
                  {/* Booking Section */}
                  <div className="mb-4">
                    <div className="text-xs font-bold uppercase text-neutral-800 dark:text-slate-300">
                      Check-in
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-slate-400 mb-2">Today</div>
                    <button
                      onClick={handleRequestBook}
                      className="w-full bg-[#E51D54] hover:bg-[#d41b4e] text-white font-bold py-3.5 rounded-lg text-lg transition-transform active:scale-[0.98]"
                    >
                      Request to Book
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-neutral-200 dark:border-slate-700 my-4"></div>

                  {/* Viewing Section */}
                  <div>
                    <div className="text-xs font-bold uppercase text-neutral-800 dark:text-slate-300">
                      Want to see it first?
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-slate-400 mb-2">Check availability for a tour</div>
                    <button
                      onClick={() => setShowViewingModal(true)}
                      className="w-full border border-neutral-300 dark:border-slate-600 text-neutral-700 dark:text-slate-200 font-bold py-3.5 rounded-lg text-lg hover:bg-neutral-50 dark:hover:bg-slate-800 transition-transform active:scale-[0.98]"
                    >
                      Schedule Viewing
                    </button>
                  </div>
                </div>

                <p className="text-center text-sm text-neutral-500 dark:text-slate-500 mb-6">
                  You won't be charged yet
                </p>

                <div className="flex justify-center items-center text-neutral-600 dark:text-slate-400 text-sm pt-4 border-t border-neutral-200 dark:border-slate-700">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-2 hover:text-red-600 dark:hover:text-red-400 transition-colors underline"
                  >
                    <Flag size={14} />
                    Report this listing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


        {
          showProvider && listing.provider && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-xl">
                {/* Close button */}
                <button
                  onClick={() => setShowProvider(false)}
                  className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700"
                >
                  ✕
                </button>

                {/* Provider Info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 bg-neutral-200 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                    {listing.provider?.profileImage ? (
                      <img
                        src={listing.provider.profileImage}
                        alt={listing.provider.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={28} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-900">
                      {listing.provider.name}
                    </h3>
                    <p className="text-sm text-neutral-500">Boarding Provider</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase">
                      Email
                    </p>
                    <p className="text-neutral-800">{listing.provider.email}</p>
                  </div>

                  {listing.provider.isVerified && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <ShieldCheck size={16} />
                      Verified Provider
                    </div>
                  )}
                </div>

                {/* Contact Button */}
                <button
                  onClick={() => {
                    setShowProvider(false);
                    setShowMessageModal(true);
                  }}
                  className="block w-full text-center bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-hover transition"
                >
                  Contact Provider
                </button>
              </div>
            </div>
          )
        }

        {/* Modals */}
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          listingId={id}
          onReviewAdded={() => {
            // Reload reviews
            const fetchReviews = async () => {
              try {
                const res = await api.get(`/reviews/listing/${id}`);
                setReviews(res.data.data);
                // Also refresh listing to get updated stats
                const resList = await api.get(`/listings/${id}`);
                setListing(resList.data);
              } catch (err) { console.error(err); }
            };
            fetchReviews();
          }}
        />

        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          listingId={id}
        />

        {
          showBookingWizard && (
            <BookingWizard
              listing={listing}
              onClose={() => setShowBookingWizard(false)}
              onSuccess={onSuccessRequest}
              user={userProfile}
            />
          )
        }

        <ViewingRequestModal
          isOpen={showViewingModal}
          onClose={() => setShowViewingModal(false)}
          listingId={id}
          providerName={listing.provider?.name}
        />

        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          providerName={listing.provider?.name}
        />
      </div>
    </div>
  );
};

export default ListingDetails;
