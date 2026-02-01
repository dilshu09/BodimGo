import { useState } from 'react';
import { X, Star } from 'lucide-react';
import api from '../services/api';

const ReviewModal = ({ isOpen, onClose, listingId, onReviewAdded }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [hoveredStar, setHoveredStar] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return alert("Please select a rating");

        setLoading(true);
        try {
            await api.post('/reviews', {
                listingId,
                rating,
                comment
            });
            alert('Review submitted successfully!');
            onReviewAdded();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-black">
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold mb-4">Write a Review</h2>

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
                                    className={star <= (hoveredStar || rating) ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"}
                                />
                            </button>
                        ))}
                    </div>

                    <textarea
                        className="w-full border border-neutral-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-black"
                        rows="4"
                        placeholder="Share your experience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
