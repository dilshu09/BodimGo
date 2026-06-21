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

    // Fetch provider's Stripe Connect profile
    const ProviderProfile = (await import('../models/ProviderProfile.js')).default;
    const providerProfile = await ProviderProfile.findOne({ user: booking.provider });

    const paymentIntentOptions = {
      amount: amount,
      currency: 'lkr',
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id.toString()
      },
      payment_method_types: ['card'],
    };

    // If provider has connected their Stripe account and completed onboarding, split the payment (2% platform commission)
    if (providerProfile && providerProfile.stripeAccountId && providerProfile.stripeOnboardingComplete) {
      paymentIntentOptions.application_fee_amount = Math.round(amount * 0.02); // 2% platform fee
      paymentIntentOptions.transfer_data = {
        destination: providerProfile.stripeAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

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

    // Update Provider's unpaid commission debt (2% of payment amount)
    try {
      const ProviderProfile = (await import('../models/ProviderProfile.js')).default;
      const providerProfile = await ProviderProfile.findOne({ user: req.user._id });
      if (providerProfile) {
        const commission = amount * 0.02;
        providerProfile.unpaidCommission = (providerProfile.unpaidCommission || 0) + commission;
        await providerProfile.save();
      }
    } catch (profileErr) {
      console.error("Failed to update provider commission balance on manual payment:", profileErr);
    }

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

    let createNew = !providerProfile.stripeAccountId;

    if (providerProfile.stripeAccountId) {
      // Validate that the account exists on Stripe
      try {
        await stripe.accounts.retrieve(providerProfile.stripeAccountId);
      } catch (stripeErr) {
        if (stripeErr.message.includes('No such account') || stripeErr.message.includes('does not have access to account') || stripeErr.statusCode === 400) {
          console.warn(`Stored Stripe account ${providerProfile.stripeAccountId} is invalid. Will create a new one.`);
          createNew = true;
        } else {
          throw stripeErr;
        }
      }
    }

    if (createNew) {
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
      providerProfile.stripeOnboardingComplete = false;
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
    let providerProfile = await ProviderProfile.findOne({ user: req.user._id });

    if (!providerProfile || !providerProfile.stripeAccountId) {
      return res.status(400).json({ message: 'Stripe account not found' });
    }

    try {
      const accountLink = await stripe.accountLinks.create({
        account: providerProfile.stripeAccountId,
        refresh_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?stripe=refresh`,
        return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?stripe=return`,
        type: 'account_onboarding',
      });

      res.json({ url: accountLink.url });
    } catch (stripeErr) {
      // If the account ID does not exist or access is revoked (e.g. Stripe API key changed/sandbox cleared)
      if (stripeErr.message.includes('No such account') || stripeErr.message.includes('does not have access to account') || stripeErr.statusCode === 400) {
        console.warn(`Stripe account ${providerProfile.stripeAccountId} is invalid or has access revoked. Resetting and creating a new one...`);
        
        // 1. Clear invalid account ID
        providerProfile.stripeAccountId = undefined;
        providerProfile.stripeOnboardingComplete = false;
        await providerProfile.save();
        
        // 2. Create a new one
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: req.user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        
        providerProfile.stripeAccountId = account.id;
        await providerProfile.save();
        
        // 3. Create account link with new ID
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?stripe=refresh`,
          return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?stripe=return`,
          type: 'account_onboarding',
        });
        
        res.json({ url: accountLink.url });
      } else {
        throw stripeErr;
      }
    }

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

    let account;
    try {
      account = await stripe.accounts.retrieve(providerProfile.stripeAccountId);
    } catch (stripeErr) {
      // If the account ID does not exist or access is revoked, clear it in our DB
      if (stripeErr.message.includes('No such account') || stripeErr.message.includes('does not have access to account') || stripeErr.statusCode === 400) {
        console.warn(`Stripe account ${providerProfile.stripeAccountId} is invalid. Clearing from database.`);
        providerProfile.stripeAccountId = undefined;
        providerProfile.stripeOnboardingComplete = false;
        await providerProfile.save();
        return res.json({
          stripeAccountId: null,
          onboardingComplete: false,
          detailsSubmitted: false
        });
      }
      throw stripeErr;
    }

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
    const Invoice = (await import('../models/Invoice.js')).default;

    // Find active tenancy to identify provider, prioritizing valid room assignments
    let tenant = await Tenant.findOne({
      email: req.user.email,
      status: 'Active',
      roomId: { $ne: 'Unassigned', $exists: true }
    });

    if (!tenant) {
      tenant = await Tenant.findOne({
        email: req.user.email,
        status: { $in: ['Active', 'Pending'] }
      });
    }

    if (!tenant) {
      return res.status(404).json({ message: 'No active tenancy found.' });
    }

    const currentMonthStr = new Date().toISOString().slice(0, 7); // Format YYYY-MM
    let invoice = await Invoice.findOne({
      tenant: tenant._id,
      status: { $in: ['due', 'overdue', 'draft'] }
    }).sort({ createdAt: -1 });

    if (!invoice) {
      // If no invoice is found, auto-generate one for this amount and current month
      invoice = await Invoice.create({
        tenant: tenant._id,
        provider: tenant.providerId,
        invoiceNumber: `INV-${Date.now()}`,
        month: currentMonthStr,
        dueDate: new Date(),
        items: [{ description: `Rent Payment for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, amount: amount }],
        totalAmount: amount,
        status: 'due'
      });
    }

    // Save proofImageUrl to the invoice directly
    invoice.proofImageUrl = proofImageUrl;
    await invoice.save();

    const paymentDate = date ? new Date(date) : new Date();

    const newPayment = await Payment.create({
      payer: req.user._id,
      payee: tenant.providerId,
      amount: amount,
      method: 'bank_transfer',
      status: 'pending', // Pending verification
      proofImageUrl: proofImageUrl,
      invoice: invoice._id,
      createdAt: paymentDate
    });

    // Notify Provider
    try {
      const { createNotification } = await import('./notification.controller.js');
      const io = req.app.get('socketio');
      
      const notification = await createNotification({
        recipient: tenant.providerId,
        type: 'payment_slip_uploaded',
        title: 'Payment Slip Uploaded',
        message: `Tenant ${tenant.name} uploaded a payment slip for LKR ${amount.toLocaleString()}. Please review it.`,
        data: { invoiceId: invoice._id }
      });

      if (io && notification) {
        io.to(tenant.providerId.toString()).emit('new-notification', notification);
      }
    } catch (notifErr) {
      console.error("Failed to create provider notification:", notifErr);
    }

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

// @desc    Create Stripe Payment Intent for Rent
// @route   POST /api/payments/rent/create-intent
// @access  Private (Seeker)
export const createRentPaymentIntent = async (req, res) => {
  try {
    const Tenant = (await import('../models/tenant.model.js')).default;
    const Invoice = (await import('../models/Invoice.js')).default;

    // Find active tenancy to identify provider, prioritizing valid room assignments
    let tenant = await Tenant.findOne({
      email: req.user.email,
      status: 'Active',
      roomId: { $ne: 'Unassigned', $exists: true }
    });

    if (!tenant) {
      tenant = await Tenant.findOne({
        email: req.user.email,
        status: { $in: ['Active', 'Pending'] }
      });
    }

    if (!tenant) {
      return res.status(404).json({ message: 'No active tenancy found.' });
    }

    const currentMonthStr = new Date().toISOString().slice(0, 7); // Format YYYY-MM
    let invoice = await Invoice.findOne({
      tenant: tenant._id,
      status: { $in: ['due', 'overdue', 'draft'] }
    }).sort({ createdAt: -1 });

    if (!invoice) {
      // If no invoice is found, auto-generate one for this amount and current month
      invoice = await Invoice.create({
        tenant: tenant._id,
        provider: tenant.providerId,
        invoiceNumber: `INV-${Date.now()}`,
        month: currentMonthStr,
        dueDate: new Date(),
        items: [{ description: `Rent Payment for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, amount: tenant.rentAmount }],
        totalAmount: tenant.rentAmount,
        status: 'due'
      });
    }

    // Amount in cents
    const amount = Math.round(invoice.totalAmount * 100);

    // Fetch provider's Stripe Connect profile
    const ProviderProfile = (await import('../models/ProviderProfile.js')).default;
    const providerProfile = await ProviderProfile.findOne({ user: tenant.providerId });

    const paymentIntentOptions = {
      amount: amount,
      currency: 'lkr',
      metadata: {
        tenantId: tenant._id.toString(),
        invoiceId: invoice._id.toString(),
        userId: req.user._id.toString()
      },
      payment_method_types: ['card'],
    };

    // If provider has connected their Stripe account and completed onboarding, split the payment (2% platform commission)
    if (providerProfile && providerProfile.stripeAccountId && providerProfile.stripeOnboardingComplete) {
      paymentIntentOptions.application_fee_amount = Math.round(amount * 0.02); // 2% platform fee
      paymentIntentOptions.transfer_data = {
        destination: providerProfile.stripeAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: invoice.totalAmount,
      invoiceNumber: invoice.invoiceNumber
    });

  } catch (error) {
    console.error('Create Rent Payment Intent Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm Rent Payment
// @route   POST /api/payments/rent/confirm
// @access  Private (Seeker)
export const confirmRentPayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    // Verify with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const { tenantId, invoiceId } = paymentIntent.metadata;

      const Tenant = (await import('../models/tenant.model.js')).default;
      const Invoice = (await import('../models/Invoice.js')).default;
      const User = (await import('../models/User.js')).default;

      const tenant = await Tenant.findById(tenantId).populate('listingId');
      const invoice = await Invoice.findById(invoiceId);

      if (!invoice || !tenant) {
        return res.status(404).json({ message: 'Invoice or tenancy not found' });
      }

      // Mark invoice as paid
      invoice.status = 'paid';
      invoice.paidAmount = paymentIntent.amount / 100;
      invoice.paidAt = Date.now();
      await invoice.save();

      // Create Payment Record
      const newPayment = await Payment.create({
        payer: req.user._id,
        payee: tenant.providerId,
        invoice: invoice._id,
        amount: paymentIntent.amount / 100,
        method: 'stripe',
        status: 'completed',
        stripePaymentId: paymentIntent.id
      });

      // Prepare Invoice Details for Email
      const providerUser = await User.findById(tenant.providerId);

      const invoiceDetails = {
        invoiceNumber: invoice.invoiceNumber,
        date: new Date(),
        payerName: req.user.name,
        payeeName: providerUser ? providerUser.name : "Property Provider",
        listingTitle: tenant.listingId ? tenant.listingId.title : "Property",
        items: invoice.items,
        totalAmount: invoice.totalAmount
      };

      // Send to Tenant & Provider
      try {
        await sendInvoiceEmail(req.user.email, invoiceDetails);
        if (providerUser && providerUser.email) {
          await sendInvoiceEmail(providerUser.email, invoiceDetails);
        }
      } catch (emailErr) {
        console.error("Failed to send rent payment invoice email:", emailErr);
      }

      // Notify Provider
      try {
        const { createNotification } = await import('./notification.controller.js');
        const io = req.app.get('socketio');
        
        const notification = await createNotification({
          recipient: tenant.providerId,
          type: 'rent_payment_received',
          title: 'Rent Payment Received',
          message: `Tenant ${tenant.name} paid LKR ${(paymentIntent.amount / 100).toLocaleString()} via Stripe.`,
          data: { invoiceId: invoice._id }
        });

        if (io && notification) {
          io.to(tenant.providerId.toString()).emit('new-notification', notification);
        }
      } catch (notifErr) {
        console.error("Failed to create provider notification:", notifErr);
      }

      res.json({ success: true, message: 'Rent payment confirmed', data: newPayment });
    } else {
      res.status(400).json({ message: 'Payment not successful yet' });
    }

  } catch (error) {
    console.error('Confirm Rent Payment Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Stripe Payment Intent to Pay Platform Commission Debt
// @route   POST /api/payments/commission/create-intent
// @access  Private (Provider)
export const createCommissionPaymentIntent = async (req, res) => {
  try {
    const ProviderProfile = (await import('../models/ProviderProfile.js')).default;
    const providerProfile = await ProviderProfile.findOne({ user: req.user._id });

    if (!providerProfile || !providerProfile.unpaidCommission || providerProfile.unpaidCommission <= 0) {
      return res.status(400).json({ message: 'No outstanding commission balance to pay.' });
    }

    // Amount in cents
    const amount = Math.round(providerProfile.unpaidCommission * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'lkr',
      metadata: {
        paymentType: 'platform_commission_settlement',
        providerId: req.user._id.toString(),
        amount: providerProfile.unpaidCommission.toString()
      },
      payment_method_types: ['card'],
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: providerProfile.unpaidCommission
    });

  } catch (error) {
    console.error('Create Commission Payment Intent Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm Platform Commission Repayment
// @route   POST /api/payments/commission/confirm
// @access  Private (Provider)
export const confirmCommissionPayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const { providerId, amount } = paymentIntent.metadata;

      const ProviderProfile = (await import('../models/ProviderProfile.js')).default;
      const User = (await import('../models/User.js')).default;

      const providerProfile = await ProviderProfile.findOne({ user: providerId });
      const user = await User.findById(providerId);

      if (!providerProfile || !user) {
        return res.status(404).json({ message: 'Provider profile or user not found' });
      }

      // Reset unpaid balance
      providerProfile.unpaidCommission = 0;
      await providerProfile.save();

      // Reset Warning Count & Unsuspend if suspended
      if (user.status === 'suspended') {
        user.status = 'active';
      }
      user.warningCount = 0;
      await user.save();

      // Create Payment Record (payer is provider, payee is platform admin - req.user is provider)
      const Payment = (await import('../models/Payment.js')).default;
      const newPayment = await Payment.create({
        payer: req.user._id,
        payee: null, // Representing platform admin
        amount: parseFloat(amount),
        method: 'stripe',
        status: 'completed',
        stripePaymentId: paymentIntent.id
      });

      res.json({ success: true, message: 'Commission payment confirmed successfully', data: newPayment });
    } else {
      res.status(400).json({ message: 'Payment not successful yet' });
    }

  } catch (error) {
    console.error('Confirm Commission Payment Error:', error);
    res.status(500).json({ message: error.message });
  }
};

