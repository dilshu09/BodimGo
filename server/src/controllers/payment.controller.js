import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import User from '../models/User.js'; // Added User import
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import { sendInvoiceEmail } from '../utils/emailService.js';
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
    const amount = Math.round(booking.totalAmount * 100);

    // Create a NEW PaymentIntent every time for now to avoid "succeeded" state issues on retry
    // In production, you might want to reuse pending intents.
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
        const newPayment = await Payment.create({
          payer: req.user._id,
          payee: booking.provider,
          // booking: booking._id,
          amount: paymentIntent.amount / 100,
          method: 'stripe',
          status: 'completed',
          stripePaymentId: paymentIntent.id
        });

        // --- NEW: Auto-Create Tenant (MOVED UP LOGICALLY or we handle here) ---
        let tenantId = null;
        try {
          const Tenant = (await import('../models/tenant.model.js')).default;
          // Check if tenant already exists to avoid duplicates
          const existingTenant = await Tenant.findOne({ email: req.user.email, listingId: booking.listing });

          if (!existingTenant) {
            const newTenant = await Tenant.create({
              listingId: booking.listing,
              roomId: booking.room ? booking.room.toString() : "Unassigned", // Handle if room is populated or ID
              providerId: booking.provider,
              name: req.user.name,
              nic: "N/A", // Placeholder, seeker profile might not have it yet
              phone: req.user.phone || "N/A",
              email: req.user.email,
              status: 'Active',
              agreementStatus: 'Not Generated',
              rentAmount: booking.agreedMonthRent,
              depositAmount: booking.agreedDeposit,
              joinedDate: new Date()
            });
            tenantId = newTenant._id;
          } else {
            tenantId = existingTenant._id;
          }
        } catch (err) {
          console.error("Failed to auto-create tenant:", err);
          // Don't fail the request, just log it
        }

        // --- NEW: Create Invoice and Send Emails ---
        if (tenantId) {
          try {
            const invoiceNumber = `INV-${Date.now()}`; // Simple unique ID
            const newInvoice = await Invoice.create({
              tenant: tenantId,
              provider: booking.provider,
              invoiceNumber: invoiceNumber,
              month: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
              dueDate: new Date(), // Paid immediately
              items: [{ description: `Rent/Deposit Payment for ${booking.listing.title}`, amount: paymentIntent.amount / 100 }],
              totalAmount: paymentIntent.amount / 100,
              paidAmount: paymentIntent.amount / 100,
              status: 'paid'
            });

            // Prepare Invoice Details for Email
            // Need Provider Name - populate or fetch
            const providerUser = await User.findById(booking.provider);

            const invoiceDetails = {
              invoiceNumber,
              date: new Date(),
              payerName: req.user.name,
              payeeName: providerUser ? providerUser.name : "Property Provider",
              listingTitle: booking.listing.title,
              items: newInvoice.items,
              totalAmount: newInvoice.totalAmount
            };

            // Send to Tenant
            await sendInvoiceEmail(req.user.email, invoiceDetails);

            // Send to Provider
            if (providerUser && providerUser.email) {
              await sendInvoiceEmail(providerUser.email, invoiceDetails);
            }

          } catch (invErr) {
            console.error("Failed to create/send invoice:", invErr);
          }
        }

        // --- NEW: Update Room Availability ---
        try {
          if (booking.room) {
            const Room = (await import('../models/Room.js')).default;
            const roomDoc = await Room.findById(booking.room);
            if (roomDoc) {
              roomDoc.availableBeds = Math.max(0, roomDoc.availableBeds - 1);
              if (roomDoc.availableBeds === 0) {
                roomDoc.status = 'full';
              }
              await roomDoc.save();
            }
          }
        } catch (err) {
          console.error("Failed to update room availability:", err);
        }

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


// @desc    Record Manual Payment (Cash/Transfer)
// @route   POST /api/payments/manual
// @access  Private (Provider)
export const recordManualPayment = async (req, res) => {
  const { tenantId, amount, method, date } = req.body;

  try {
    const Tenant = (await import('../models/tenant.model.js')).default;
    const tenant = await Tenant.findOne({ _id: tenantId, providerId: req.user._id });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Find the user account associated with this tenant email
    let payerId = null;
    if (tenant.email) {
      const payer = await User.findOne({ email: tenant.email });
      if (payer) payerId = payer._id;
    }

    // If no registered user found for tenant, we can't link it to a User ID comfortably
    // But Payment model requires 'payer'. 
    // Option A: fail. Option B: use a placeholder or allow null in model (requires schema change).
    // For now, assuming most tenants have a user account or we use the provider's ID as a placeholder/flag? 
    // BETTER: If manual tenant doesn't have an account, we might need to relax Payment schema or create a shadow user.
    // Let's assume for now we use the email to find them, if not found, we can't record "User" payment easily.
    // Workaround: Use the provider ID as payer but mark method clearly, OR just fail if no user.
    // Let's check if User exists.

    if (!payerId) {
      // If the tenant was manually added and hasn't registered, we can't create a valid Payment record 
      // that requires a User ref. 
      // We will try to find a user by email, if not, we return error for now.
      return res.status(400).json({ message: 'Tenant does not have a registered account matching their email.' });
    }

    const paymentDate = date ? new Date(date) : new Date();

    const newPayment = await Payment.create({
      payer: payerId,
      payee: req.user._id,
      amount: amount,
      method: method || 'cash',
      status: 'completed',
      createdAt: paymentDate // Override timestamp for manual entry
    });

    res.json({
      success: true,
      data: newPayment,
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    console.error('Manual Payment Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Stripe Connect Account
// @route   POST /api/payments/connect/create-account
export const createConnectAccount = async (req, res) => {
  try {
    const user = req.user;
    const ProviderProfile = (await import('../models/ProviderProfile.js')).default;

    let providerProfile = await ProviderProfile.findOne({ user: user._id });
    if (!providerProfile) {
      providerProfile = new ProviderProfile({ user: user._id });
    }

    if (!providerProfile.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // Defaulting to US for simplicity, can make dynamic later or use 'standard'
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      providerProfile.stripeAccountId = account.id;
      await providerProfile.save();
    }

    res.json({
      success: true,
      stripeAccountId: providerProfile.stripeAccountId
    });

  } catch (error) {
    console.error('Stripe Connect Create Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Stripe Account Onboarding Link
// @route   POST /api/payments/connect/onboarding-link
export const getAccountLink = async (req, res) => {
  try {
    const ProviderProfile = (await import('../models/ProviderProfile.js')).default;
    const providerProfile = await ProviderProfile.findOne({ user: req.user._id });

    if (!providerProfile || !providerProfile.stripeAccountId) {
      return res.status(400).json({ message: 'Stripe account not found' });
    }

    const accountLink = await stripe.accountLinks.create({
      account: providerProfile.stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?stripe=refresh`,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?stripe=return`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });

  } catch (error) {
    console.error('Stripe Link Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check Stripe Connect Status
// @route   GET /api/payments/connect/status
export const getPaymentStatus = async (req, res) => {
  try {
    const ProviderProfile = (await import('../models/ProviderProfile.js')).default;
    const providerProfile = await ProviderProfile.findOne({ user: req.user._id });

    if (!providerProfile || !providerProfile.stripeAccountId) {
      return res.json({
        stripeAccountId: null,
        onboardingComplete: false,
        detailsSubmitted: false
      });
    }

    const account = await stripe.accounts.retrieve(providerProfile.stripeAccountId);

    // Update local status if changed
    const isComplete = account.details_submitted && account.payouts_enabled;
    if (providerProfile.stripeOnboardingComplete !== isComplete) {
      providerProfile.stripeOnboardingComplete = isComplete;
      await providerProfile.save();
    }

    res.json({
      stripeAccountId: account.id,
      onboardingComplete: isComplete,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements
    });

  } catch (error) {
    console.error('Stripe Status Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Payment History for Provider
// @route   GET /api/payments/history
// @access  Private (Provider)
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ payee: req.user._id })
      .populate('payer', 'name email')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get Payment History Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Finance Stats for Provider
// @route   GET /api/payments/stats
// @access  Private (Provider)
export const getPaymentStats = async (req, res) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Total Revenue (All time or current month? Let's do current month for the card)
    const currentMonthRevenue = await Payment.aggregate([
      {
        $match: {
          payee: req.user._id,
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Total Revenue All Time
    const totalRevenue = await Payment.aggregate([
      {
        $match: {
          payee: req.user._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Total Expenses
    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          provider: req.user._id
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalExpenseAmount = totalExpenses[0]?.total || 0;
    const totalRevenueAmount = totalRevenue[0]?.total || 0;

    res.json({
      currentMonthRevenue: currentMonthRevenue[0]?.total || 0,
      totalRevenue: totalRevenueAmount,
      totalExpenses: totalExpenseAmount,
      netProfit: totalRevenueAmount - totalExpenseAmount
    });

  } catch (error) {
    console.error('Get Payment Stats Error:', error);
    res.status(500).json({ message: error.message });
  }
};
// @desc    Submit Payment Proof (Seeker)
// @route   POST /api/payments/proof
// @access  Private (Seeker)
export const submitPaymentProof = async (req, res) => {
  const { amount, date, proofImageUrl, listingId } = req.body;

  try {
    const Tenant = (await import('../models/tenant.model.js')).default;
    // Find active tenancy to identify provider
    const tenant = await Tenant.findOne({
      email: req.user.email,
      status: { $in: ['Active', 'Pending'] }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'No active tenancy found.' });
    }

    const paymentDate = date ? new Date(date) : new Date();

    const newPayment = await Payment.create({
      payer: req.user._id,
      payee: tenant.providerId,
      amount: amount,
      method: 'bank_transfer',
      status: 'pending', // Pending verification
      proofImageUrl: proofImageUrl,
      createdAt: paymentDate
    });

    // Notify Provider? (Optional for MVP)

    res.json({
      success: true,
      data: newPayment,
      message: 'Payment proof submitted successfully'
    });

  } catch (error) {
    console.error('Submit Payment Proof Error:', error);
    res.status(500).json({ message: error.message });
  }
};
