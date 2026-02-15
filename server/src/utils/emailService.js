
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
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
