import { useState } from 'react';
import { Star, X } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

const ReviewModal = ({ isOpen, onClose, listingId, onReviewAdded }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return toast.error("Please select a rating");

        setLoading(true);
        try {
            await api.post('/reviews', {
                listingId,
                rating,
                comment
            });
            toast.success('Review submitted successfully!');
            onReviewAdded();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md p-6 relative border border-transparent dark:border-slate-800 shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-black dark:hover:text-slate-200 transition-colors">
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold mb-4 text-neutral-900 dark:text-white">Write a Review</h2>

                <form onSubmit={handleSubmit}>
                    <div className="flex gap-2 mb-4 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="transition-colors"
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star
                                    size={32}
                                    className={star <= (hoveredStar || rating) ? "fill-yellow-400 text-yellow-400" : "text-neutral-300 dark:text-slate-600"}
                                />
                            </button>
                        ))}
                    </div>

                    <textarea
                        className="w-full border border-neutral-300 dark:border-slate-700 bg-transparent dark:bg-slate-800 dark:text-white rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-slate-500 placeholder:text-neutral-400 dark:placeholder:text-slate-500"
                        rows="4"
                        placeholder="Share your experience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black dark:bg-slate-200 text-white dark:text-slate-900 py-3 rounded-lg font-semibold hover:bg-neutral-800 dark:hover:bg-slate-300 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
