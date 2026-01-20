import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Payment Intent
// @route   POST /api/payments/create-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId).populate('listing');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Amount in cents (LKR usually supported, or USD)
    // Stripe accepts smallest currency unit. For LKR it is cents. 100 LKR = 10000 cents.
    // Ensure amount is integer.
    const amount = Math.round(booking.totalAmount * 100); 

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'lkr',
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm Payment (Manual webhook simulation or client success callback)
// @route   POST /api/payments/confirm
// @access  Private
export const confirmPayment = async (req, res) => {
  const { paymentIntentId, bookingId } = req.body;

  try {
    // Verify with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
       // Update Booking
       const booking = await Booking.findById(bookingId);
       if (booking) {
         booking.status = 'confirmed';
         booking.paymentStatus = 'paid';
         await booking.save();

         // Create Payment Record
         await Payment.create({
             payer: req.user._id,
             payee: booking.provider,
             booking: booking._id,
             amount: paymentIntent.amount / 100,
             currency: paymentIntent.currency,
             method: 'card', // or retrieve from intent
             status: 'completed',
             transactionId: paymentIntent.id
         });

         res.json({ success: true, message: 'Booking confirmed' });
       } else {
         res.status(404).json({ message: 'Booking not found for confirmation' });
       }
    } else {
        res.status(400).json({ message: 'Payment not successful yet' });
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
