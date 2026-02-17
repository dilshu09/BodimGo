"use client";
import { Star, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../services/api"; // Assuming you have an api utility

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avgRating: 0,
    totalReviews: 0,
    repliedCount: 0
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get('/reviews/provider');
        const fetchedReviews = res.data.data;
        setReviews(fetchedReviews);

        // Calculate stats
        const total = fetchedReviews.length;
        const replied = fetchedReviews.filter(r => r.reply).length;
        const sumRating = fetchedReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = total > 0 ? (sumRating / total).toFixed(2) : 0;

        setStats({
          avgRating: avg,
          totalReviews: total,
          repliedCount: replied
        });

      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading reviews...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Reviews & Ratings</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage tenant reviews and feedback
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.avgRating}</div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < Math.round(stats.avgRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300 dark:text-slate-600"
                  }
                />
              ))}
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Average Rating</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {stats.totalReviews}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Total Reviews</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {stats.repliedCount}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Replies Given</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {review.author?.name || "Unknown Tenant"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {review.targetListing?.title && <span className="block font-medium mb-1 text-slate-800 dark:text-slate-200">{review.targetListing.title}</span>}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-300 dark:text-slate-600"
                      }
                    />
                  ))}
                </div>
              </div>

              {review.title && (
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  {review.title}
                </h4>
              )}
              <p className="text-slate-700 dark:text-slate-300 mb-4">{review.comment}</p>

              {review.reply && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4">
                  <div className="flex gap-2">
                    <MessageSquare
                      size={16}
                      className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1"
                    />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Your Reply
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{review.reply}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                className={`text-sm font-medium px-4 py-2 rounded transition-colors ${review.reply
                  ? "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  : "text-red-600 dark:text-red-400 border border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  }`}
              >
                {review.reply ? "✓ Replied" : "+ Reply"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
