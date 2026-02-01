import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import Navbar from '../components/Navbar';

// Initialize Stripe (Replace with your actual Publishable Key)
const stripePromise = loadStripe('pk_test_51Q5b6bP9...');

const CheckoutForm = ({ booking, clientSecret }) => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        if (!stripe || !elements) return;

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
                billing_details: {
                    name: booking.seeker.name,
                    email: booking.seeker.email
                },
            },
        });

        if (result.error) {
            setError(result.error.message);
            setProcessing(false);
        } else {
            if (result.paymentIntent.status === 'succeeded') {
                // Confirm on backend
                await api.post('/payments/confirm', {
                    paymentIntentId: result.paymentIntent.id,
                    bookingId: booking._id
                });
                alert('Payment Successful! Booking Confirmed.');
                navigate('/');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6">
            <div className="p-4 border border-neutral-300 rounded-lg mb-4">
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': { color: '#aab7c4' },
                        },
                        invalid: { color: '#9e2146' },
                    },
                }} />
            </div>
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full btn-primary py-3 font-bold text-lg"
            >
                {processing ? 'Processing...' : `Pay Rs ${booking.totalAmount.toLocaleString()}`}
            </button>
        </form>
    );
};

const Checkout = () => {
    const { bookingId } = useParams();
    const [clientSecret, setClientSecret] = useState('');
    const [booking, setBooking] = useState(null);

    useEffect(() => {
        // 1. Fetch Booking Details
        api.get(`/bookings/${bookingId}`).then(res => {
            setBooking(res.data);
            // 2. Create Payment Intent
            return api.post('/payments/create-intent', { bookingId });
        }).then(res => {
            setClientSecret(res.data.clientSecret);
        }).catch(err => {
            console.error(err);
            alert(err.response?.data?.message || "Failed to load checkout");
        });
    }, [bookingId]);

    if (!booking || !clientSecret) return <div className="p-10 text-center">Loading Checkout...</div>;

    return (
        <div className="min-h-screen bg-neutral-50">
            <Navbar />
            <div className="max-w-xl mx-auto px-4 py-12">
                <div className="bg-white p-8 rounded-2xl shadow-card">
                    <h1 className="text-2xl font-bold mb-2">Confirm and Pay</h1>
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-100">
                        {booking.listing.images?.[0] && (
                            <img src={booking.listing.images[0]} className="w-20 h-20 rounded-lg object-cover" />
                        )}
                        <div>
                            <h3 className="font-bold">{booking.listing.title}</h3>
                            <p className="text-sm text-neutral-500">
                                {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm booking={booking} clientSecret={clientSecret} />
                    </Elements>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
