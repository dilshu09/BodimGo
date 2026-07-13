import cron from 'node-cron';
import Invoice from '../models/Invoice.js';
import Notification from '../models/Notification.js';
import { sendPaymentReminderEmail, sendOverdueNoticeEmail } from '../utils/emailService.js';
import { io } from '../index.js';

export const startCronJobs = () => {
  console.log('⏳ Initializing Cron Jobs...');

  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Running daily invoice check job...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all invoices that are 'due'
      const dueInvoices = await Invoice.find({ status: 'due' })
        .populate('tenant')
        .populate('provider');

      for (const invoice of dueInvoices) {
        if (!invoice.tenant || !invoice.provider) continue;

        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const invoiceDetails = {
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount,
          dueDate: invoice.dueDate,
          listingTitle: invoice.items[0]?.description || 'BodimGo Property'
        };

        // 1. Check for Upcoming Due (5, 4, 3, 2, 1, 0 days)
        if (diffDays >= 0 && diffDays <= 5) {
          console.log(`Sending reminder to ${invoice.tenant.email} (Due in ${diffDays} days)`);
          
          // Send Email
          if (invoice.tenant.email) {
            await sendPaymentReminderEmail(
              invoice.tenant.email,
              invoice.tenant.name,
              invoiceDetails,
              diffDays
            );
          }

          // Send In-App Notification to Tenant
          const notification = await Notification.create({
            recipient: invoice.tenant._id, // Assuming tenant is a User, wait tenant model doesn't link to User necessarily but has an email. Actually, Notification recipient needs to be a User. Wait, if Tenant is just a Tenant record, notifications go to the seeker User if they exist. Let's send to seeker if possible, otherwise skip in-app for tenant.
            // Wait, looking at Notification model, recipient is User. If Tenant doesn't have a direct User ref, we might not be able to send in-app to them directly unless we find the Seeker by email.
            // Let's look up the seeker by email.
            type: 'payment_reminder',
            title: `Payment Reminder: ${diffDays === 0 ? 'Due Today' : `Due in ${diffDays} Days`}`,
            message: `Your payment of LKR ${invoice.totalAmount} for ${invoiceDetails.listingTitle} is due ${diffDays === 0 ? 'today' : `in ${diffDays} days`}.`,
            link: '/my-boarding'
          });
          
          // We need to dispatch via Socket to the seeker if we have their User ID
          // Let's do a quick lookup
          const User = (await import('../models/User.js')).default;
          const seeker = await User.findOne({ email: invoice.tenant.email });
          if (seeker) {
            notification.recipient = seeker._id;
            await notification.save();
            io.to(seeker._id.toString()).emit('new-notification', notification);
          } else {
             // If no user account, delete the notification as recipient is required
             await Notification.findByIdAndDelete(notification._id);
          }
        }

        // 2. Check for Overdue (Days < 0)
        else if (diffDays < 0) {
          console.log(`Marking invoice ${invoice.invoiceNumber} as overdue.`);
          
          // Update status
          invoice.status = 'overdue';
          await invoice.save();

          // Send Overdue Email to Tenant
          if (invoice.tenant.email) {
            await sendOverdueNoticeEmail(
              invoice.tenant.email,
              invoice.tenant.name,
              invoiceDetails
            );
          }

          // Send In-App Notification to Provider
          const providerNotification = await Notification.create({
            recipient: invoice.provider._id,
            type: 'payment_overdue',
            title: 'Payment Overdue',
            message: `Tenant ${invoice.tenant.name} has missed the payment deadline for ${invoiceDetails.listingTitle}.`,
            link: '/finance/invoices'
          });
          io.to(invoice.provider._id.toString()).emit('new-notification', providerNotification);

          // Send In-App Notification to Tenant (Seeker)
          const User = (await import('../models/User.js')).default;
          const seeker = await User.findOne({ email: invoice.tenant.email });
          if (seeker) {
            const tenantNotification = await Notification.create({
              recipient: seeker._id,
              type: 'payment_overdue',
              title: 'URGENT: Payment Overdue',
              message: `Your payment of LKR ${invoice.totalAmount} is overdue. Please pay immediately.`,
              link: '/my-boarding'
            });
            io.to(seeker._id.toString()).emit('new-notification', tenantNotification);
          }
        }
      }
    } catch (error) {
      console.error('Error in daily invoice job:', error);
    }
  });

  // Run daily check for unpaid provider platform commissions (at 01:00 AM)
  cron.schedule('0 1 * * *', async () => {
    console.log('🔄 Running daily provider commission check...');
    try {
      const ProviderProfile = (await import('../models/ProviderProfile.js')).default;
      const User = (await import('../models/User.js')).default;
      const Notification = (await import('../models/Notification.js')).default;
      const { sendEmail } = await import('../utils/emailService.js');

      // Find all provider profiles with unpaid commissions > 0
      const profiles = await ProviderProfile.find({ unpaidCommission: { $gt: 0 } }).populate('user');

      for (const profile of profiles) {
        const user = profile.user;
        if (!user) continue;

        // Skip already suspended users
        if (user.status === 'suspended') continue;

        const debt = profile.unpaidCommission;

        // 1. Suspension: Debt >= 5000 or Warning Count >= 2
        if (debt >= 5000 || user.warningCount >= 2) {
          console.log(`Suspending provider ${user.name} (${user.email}) due to unpaid commission debt of LKR ${debt}`);
          user.status = 'suspended';
          await user.save();

          // Send Suspension Email
          try {
            await sendEmail(
              user.email,
              'URGENT: BodimGo Provider Account Suspended',
              `Dear ${user.name},\n\nYour provider account has been temporarily suspended due to unpaid platform commission fees totaling LKR ${debt.toLocaleString()}.\n\nYour active listings have been hidden, and you will not be able to log in until the balance is paid.\n\nPlease log in to clear your balance via card payment to reactivate your account immediately.\n\nRegards,\nBodimGo Administration`
            );
          } catch (emailErr) {
            console.error("Failed to send suspension email:", emailErr);
          }

          // Send notification
          try {
            const notification = await Notification.create({
              recipient: user._id,
              type: 'account_suspended',
              title: 'Account Suspended',
              message: `Your account has been suspended due to LKR ${debt.toLocaleString()} unpaid platform fees.`,
              link: '/settings'
            });
            if (io) {
              io.to(user._id.toString()).emit('new-notification', notification);
            }
          } catch (notifErr) {
            console.error("Failed to create suspension notification:", notifErr);
          }
        }
        // 2. Warning: Debt >= 2000
        else if (debt >= 2000) {
          console.log(`Warning provider ${user.name} (${user.email}) for unpaid commission debt of LKR ${debt}`);
          user.warningCount = (user.warningCount || 0) + 1;
          user.warningHistory.push({
            reason: `Unpaid platform commission debt of LKR ${debt.toLocaleString()}`,
            adminId: null, // System warning
            date: new Date()
          });
          await user.save();

          // Send Warning Email
          try {
            await sendEmail(
              user.email,
              'Warning: Unpaid Platform Commission Debt',
              `Dear ${user.name},\n\nThis is a warning regarding your unpaid platform commission fees of LKR ${debt.toLocaleString()}.\n\nPlatform fees must be settled to keep your account in good standing. Failure to pay outstanding fees will result in temporary suspension of your account and removal of your active listings.\n\nPlease log in to your settings portal to clear this balance.\n\nRegards,\nBodimGo Administration`
            );
          } catch (emailErr) {
            console.error("Failed to send warning email:", emailErr);
          }

          // Send notification
          try {
            const notification = await Notification.create({
              recipient: user._id,
              type: 'payment_reminder',
              title: 'Warning: Unpaid Platform Fees',
              message: `You have received a warning due to LKR ${debt.toLocaleString()} unpaid platform fees.`,
              link: '/settings'
            });
            if (io) {
              io.to(user._id.toString()).emit('new-notification', notification);
            }
          } catch (notifErr) {
            console.error("Failed to create warning notification:", notifErr);
          }
        }
      }
    } catch (err) {
      console.error('Error in daily commission check job:', err);
    }
  });

  console.log('✅ Cron Jobs Scheduled');
};
