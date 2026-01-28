"use client";
import { Star, MessageSquare } from "lucide-react";

const reviews = [
  {
    id: 1,
    tenantName: "Ahmed Khan",
    rating: 5,
    date: "2024-01-10",
    title: "Excellent Boarding Facility",
    comment:
      "The boarding is well-maintained and the management is very responsive to any issues. Highly recommended!",
    replied: false,
  },
  {
    id: 2,
    tenantName: "Fatima Ahmed",
    rating: 4,
    date: "2024-01-08",
    title: "Good Accommodation",
    comment:
      "Clean rooms and good facilities. Would appreciate if WiFi speed could be improved.",
    replied: true,
    reply:
      "Thank you for your feedback! We are working on upgrading our WiFi infrastructure.",
  },
  {
    id: 3,
    tenantName: "Sara Khan",
    rating: 5,
    date: "2024-01-05",
    title: "Best Boarding Experience",
    comment:
      "Great location, friendly staff, and excellent amenities. Very happy with my stay here.",
    replied: false,
  },
  {
    id: 4,
    tenantName: "Hassan Ali",
    rating: 3,
    date: "2024-01-02",
    title: "Average Experience",
    comment:
      "The room is good but the water supply issues need to be addressed. Please look into it.",
    replied: true,
    reply:
      "We apologize for the inconvenience. Our maintenance team is working to resolve this issue.",
  },
];

export default function ReviewsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Reviews & Ratings</h2>
        <p className="text-slate-600 mt-1">
          Manage tenant reviews and feedback
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-3xl font-bold text-slate-900">4.75</div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < 4
                      ? "fill-yellow-400 text-yellow-400"
                      : i === 4
                        ? "fill-yellow-200 text-yellow-200"
                        : "text-slate-300"
                  }
                />
              ))}
            </div>
          </div>
          <p className="text-slate-600 text-sm">Average Rating</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-slate-900 mb-2">
            {reviews.length}
          </div>
          <p className="text-slate-600 text-sm">Total Reviews</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="text-3xl font-bold text-slate-900 mb-2">
            {reviews.filter((r) => r.replied).length}
          </div>
          <p className="text-slate-600 text-sm">Replies Given</p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900">
                  {review.tenantName}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {new Date(review.date).toLocaleDateString()}
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
                        : "text-slate-300"
                    }
                  />
                ))}
              </div>
            </div>

            <h4 className="font-semibold text-slate-900 mb-2">
              {review.title}
            </h4>
            <p className="text-slate-700 mb-4">{review.comment}</p>

            {review.replied && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <div className="flex gap-2">
                  <MessageSquare
                    size={16}
                    className="text-blue-600 flex-shrink-0 mt-1"
                  />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Your Reply
                    </p>
                    <p className="text-sm text-blue-800 mt-1">{review.reply}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              className={`text-sm font-medium px-4 py-2 rounded transition-colors ${
                review.replied
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-red-600 border border-red-500 hover:bg-red-50"
              }`}
            >
              {review.replied ? "✓ Replied" : "+ Reply"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
