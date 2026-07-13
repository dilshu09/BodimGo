
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Force Node.js to prefer IPv4 DNS resolution (resolves connection timeouts on cloud hosts like Render)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL/TLS directly
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (options, subject, textOrHtml) => {
  try {
    let to, emailSubject, emailHtml, emailText;

    if (options && typeof options === 'object' && !Array.isArray(options)) {
      // Called with object format: sendEmail({ to, subject, html })
      to = options.to;
      emailSubject = options.subject;
      emailHtml = options.html;
      emailText = options.text;
    } else {
      // Called with positional format: sendEmail(to, subject, text/html)
      to = options;
      emailSubject = subject;
      // If textOrHtml starts with HTML tags or is longer HTML text, treat as html
      if (textOrHtml && (textOrHtml.trim().startsWith('<') || textOrHtml.includes('</'))) {
        emailHtml = textOrHtml;
      } else {
        emailText = textOrHtml;
      }
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error to prevent blocking the flow, just log it
    // In prod, you might want a retry queue
  }
};


export const sendBookingRequestEmail = async (providerEmail, providerName, bookingDetails, acceptLink, rejectLink) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-w-600px; margin: 0 auto; color: #333;">
      <h2 style="color: #E51D54;">New Booking Request!</h2>
      <p>Hi ${providerName},</p>
      <p>You have a new booking request for <strong>${bookingDetails.listingTitle}</strong>.</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Seeker Details</h3>
        <p><strong>Name:</strong> ${bookingDetails.seekerName}</p>
        <p><strong>Occupation:</strong> ${bookingDetails.occupation}</p>
        ${bookingDetails.organization ? `<p><strong>Institute:</strong> ${bookingDetails.organization}</p>` : ''}
        ${bookingDetails.faculty ? `<p><strong>Faculty/Course:</strong> ${bookingDetails.faculty}</p>` : ''}
        ${bookingDetails.workplace ? `<p><strong>Workplace:</strong> ${bookingDetails.workplace}</p>` : ''}
        ${bookingDetails.otherDescription ? `<p><strong>Description:</strong> ${bookingDetails.otherDescription}</p>` : ''}
        <p><strong>Note:</strong> "${bookingDetails.note}"</p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">
        <p><strong>Dates:</strong> ${new Date(bookingDetails.startDate).toLocaleDateString()} - ${new Date(bookingDetails.endDate).toLocaleDateString()}</p>
      </div>

      <p>Please review this request. If accepted, the seeker will be notified to proceed with payment.</p>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${acceptLink}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 15px;">Accept Request</a>
        <a href="${rejectLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reject</a>
      </div>
    </div>
  `;

  await sendEmail({
    to: providerEmail,
    subject: `Action Required: New Request for ${bookingDetails.listingTitle}`,
    html
  });
};

export const sendInvoiceEmail = async (to, invoiceDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4F46E5; margin: 0;">BodimGo Invoice</h2>
        <p style="color: #666; font-size: 14px; margin-top: 5px;">Thank you for your payment!</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <p style="margin: 0; font-size: 14px; color: #666;">Invoice To:</p>
          <p style="margin: 5px 0; font-weight: bold;">${invoiceDetails.payerName}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #666;">Invoice #:</p>
          <p style="margin: 5px 0; font-weight: bold;">${invoiceDetails.invoiceNumber}</p>
          <p style="margin: 0; font-size: 14px; color: #666;">Date:</p>
          <p style="margin: 5px 0;">${new Date(invoiceDetails.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; color: #666;">Property:</p>
        <p style="margin: 5px 0; font-weight: bold; color: #111;">${invoiceDetails.listingTitle}</p>
        <p style="margin: 0; font-size: 14px; color: #666; margin-top: 10px;">Provider:</p>
        <p style="margin: 5px 0;">${invoiceDetails.payeeName}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="text-align: left; padding: 10px; border-bottom: 1px solid #ddd;">Description</th>
            <th style="text-align: right; padding: 10px; border-bottom: 1px solid #ddd;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceDetails.items.map(item => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
              <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">Rs. ${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr>
            <td style="padding: 10px; font-weight: bold; text-align: right;">Total</td>
            <td style="padding: 10px; font-weight: bold; text-align: right; color: #4F46E5;">Rs. ${invoiceDetails.totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #999;">
        <p>This is an automatically generated receipt for your payment.</p>
        <p>&copy; ${new Date().getFullYear()} BodimGo. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject: `Payment Receipt: ${invoiceDetails.invoiceNumber} - ${invoiceDetails.listingTitle}`,
    html
  });
};

export const sendBookingAcceptedEmail = async (seekerEmail, seekerName, bookingDetails, paymentLink) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 48px;">🎉</span>
        <h2 style="color: #22c55e; margin-top: 10px;">Booking Accepted!</h2>
      </div>
      
      <p>Hi <strong>${seekerName}</strong>,</p>
      <p>Great news! Your booking request for <strong>${bookingDetails.listingTitle}</strong> has been accepted by the provider.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <h3 style="margin-top: 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Reservation Summary</h3>
        <p style="margin: 8px 0;"><strong>Property:</strong> ${bookingDetails.listingTitle}</p>
        <p style="margin: 8px 0;"><strong>Monthly Rent:</strong> Rs. ${bookingDetails.rent.toLocaleString()}</p>
        <p style="margin: 8px 0;"><strong>Security Deposit:</strong> Rs. ${bookingDetails.deposit.toLocaleString()}</p>
        <p style="margin: 8px 0;"><strong>Check-in Date:</strong> ${new Date(bookingDetails.startDate).toLocaleDateString()}</p>
      </div>

      <p style="color: #475569; line-height: 1.6;">To secure your spot and confirm the reservation, please complete the initial payment using the button below:</p>

      <div style="margin: 35px 0; text-align: center;">
        <a href="${paymentLink}" style="background-color: #E51D54; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(229, 29, 84, 0.2);">Complete Payment</a>
      </div>

      <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px;">
        If you have any questions, you can message the provider directly through the BodimGo app.
      </p>
    </div>
  `;

  await sendEmail({
    to: seekerEmail,
    subject: `Congratulations! Your booking for ${bookingDetails.listingTitle} was accepted`,
    html
  });
};

export const sendPaymentReminderEmail = async (tenantEmail, tenantName, invoiceDetails, daysLeft) => {
  const isToday = daysLeft === 0;
  const timeText = isToday ? "is due today!" : `is due in ${daysLeft} days.`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 48px;">📅</span>
        <h2 style="color: #4F46E5; margin-top: 10px;">Payment Reminder</h2>
      </div>
      
      <p>Hi <strong>${tenantName}</strong>,</p>
      <p>This is a friendly reminder that your payment for <strong>${invoiceDetails.listingTitle}</strong> ${timeText}</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 8px 0;"><strong>Invoice #:</strong> ${invoiceDetails.invoiceNumber}</p>
        <p style="margin: 8px 0;"><strong>Amount Due:</strong> Rs. ${invoiceDetails.amount.toLocaleString()}</p>
        <p style="margin: 8px 0;"><strong>Due Date:</strong> ${new Date(invoiceDetails.dueDate).toLocaleDateString()}</p>
      </div>

      <p style="color: #475569; line-height: 1.6;">Please ensure your payment is completed on time to avoid any late fees or disruptions.</p>

      <div style="margin: 35px 0; text-align: center;">
        <a href="${process.env.CLIENT_URL}/my-boarding" style="background-color: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Invoice & Pay</a>
      </div>
    </div>
  `;

  await sendEmail({
    to: tenantEmail,
    subject: `Reminder: Payment Due ${isToday ? 'Today' : `in ${daysLeft} days`} - ${invoiceDetails.invoiceNumber}`,
    html
  });
};

export const sendOverdueNoticeEmail = async (tenantEmail, tenantName, invoiceDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #fee2e2; padding: 20px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 48px;">⚠️</span>
        <h2 style="color: #ef4444; margin-top: 10px;">Payment Overdue</h2>
      </div>
      
      <p>Hi <strong>${tenantName}</strong>,</p>
      <p>Your payment for <strong>${invoiceDetails.listingTitle}</strong> is now <strong style="color: #ef4444;">overdue</strong>.</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #fecaca;">
        <p style="margin: 8px 0;"><strong>Invoice #:</strong> ${invoiceDetails.invoiceNumber}</p>
        <p style="margin: 8px 0;"><strong>Amount Due:</strong> Rs. ${invoiceDetails.amount.toLocaleString()}</p>
        <p style="margin: 8px 0;"><strong>Original Due Date:</strong> ${new Date(invoiceDetails.dueDate).toLocaleDateString()}</p>
      </div>

      <p style="color: #475569; line-height: 1.6;">Please complete your payment immediately to keep your account in good standing and avoid further penalties or eviction procedures.</p>

      <div style="margin: 35px 0; text-align: center;">
        <a href="${process.env.CLIENT_URL}/my-boarding" style="background-color: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Pay Now</a>
      </div>
    </div>
  `;

  await sendEmail({
    to: tenantEmail,
    subject: `URGENT: Payment Overdue - ${invoiceDetails.invoiceNumber}`,
    html
  });
};
