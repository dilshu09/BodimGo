
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
