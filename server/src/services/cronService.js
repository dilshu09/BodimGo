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

  console.log('✅ Cron Jobs Scheduled');
};
