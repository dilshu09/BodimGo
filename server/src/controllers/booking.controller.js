import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import Room from '../models/Room.js';
import Tenant from '../models/tenant.model.js';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Seeker)
export const createBooking = async (req, res) => {
  try {
    const { listingId, roomId, startDate, endDate, guests } = req.body;
    console.log("Create Booking Request Body:", req.body);
    console.log("Received listingId:", listingId, "roomId:", roomId);

    const listing = await Listing.findById(listingId);
    if (!listing) {
      console.log("Listing lookup failed for ID:", listingId);
      return res.status(404).json({ message: 'Listing not found' });
    }

    // --- Room Inventory Management (Fix 37, 38, 39) ---
    let selectedRoom = null;
    let rent = listing.rent;
    let deposit = listing.deposit || 0;

    if (roomId) {
      // Find the room subdocument
      selectedRoom = listing.rooms.id(roomId);
      if (!selectedRoom) {
        return res.status(404).json({ message: 'Selected room not found in this listing.' });
      }

      // Check Availability
      if (selectedRoom.availableBeds <= 0 || selectedRoom.status === 'Occupied') {
        return res.status(400).json({ message: 'This room is no longer available.' });
      }

      // Update Rent/Deposit from Room
      rent = selectedRoom.price;
      if (selectedRoom.deposit) deposit = selectedRoom.deposit;

      // FIX: Initialize availableBeds if missing (migration/fallback)
      if (selectedRoom.availableBeds === undefined || selectedRoom.availableBeds === null) {
        if (selectedRoom.occupancyMode === 'Entire Room') {
          selectedRoom.availableBeds = 1; // 1 unit available
        } else {
          selectedRoom.availableBeds = selectedRoom.capacity; // Assume all beds available
        }
      }

      // Re-check Availability after init
      if (selectedRoom.availableBeds <= 0 || selectedRoom.status === 'Occupied') {
        return res.status(400).json({ message: 'This room is no longer available.' });
      }

      // DECREMENT INVENTORY (Optimistic locking or atomic update preferred, but direct save for MVP is ok)
      selectedRoom.availableBeds -= 1;

      // Update Status if Full
      if (selectedRoom.availableBeds <= 0) {
        selectedRoom.status = 'Occupied'; // Or 'Reserved' if we want to wait for payment?
        // Let's use 'Reserved' until paid? Or 'Occupied' if we consider booking request as holding it?
        // User said "won't be charged until they accept", so technically we should HOLD it or warn provider.
        // For now, let's mark as Occupied/Reserved to prevent double booking.
        selectedRoom.status = 'Occupied';
      }

      // Save the listing with updated room stats
      await listing.save();
      console.log(`Room ${selectedRoom.name} inventory updated. Remaining: ${selectedRoom.availableBeds}`);

    } else {
      // Fallback for non-room listings
      // If listing HAS rooms but NONE selected, we should probably error if the UI forces it.
      if (listing.rooms && listing.rooms.length > 0) {
        // Ideally we should mandate room selection.
        // But for backward compatibility or explicit "Entire Unit", we proceed.
        if (!rent) rent = Math.min(...listing.rooms.map(r => r.price)); // Fallback
      }
    }

    rent = rent || 5000;

    // Calculate total
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end - start) / (1000 * 60 * 60 * 24 * 30.44);
    const totalAmount = (rent * Math.max(1, Math.ceil(months))) + deposit;

    // --- Gender Validation ---
    const applicantGender = req.body.applicationData?.gender;
    const genderPolicy = listing.genderPolicy;

    if (applicantGender) {
      if (genderPolicy === 'Girls only' && applicantGender === 'Male') {
        return res.status(400).json({
          message: 'This boarding is for Girls only. Male applicants are not allowed.'
        });
      }
      if (genderPolicy === 'Boys only' && applicantGender === 'Female') {
        return res.status(400).json({
          message: 'This boarding is for Boys only. Female applicants are not allowed.'
        });
      }
    } else {
      if (genderPolicy !== 'Mixed' && !applicantGender) {
        return res.status(400).json({ message: 'Gender is required for this restricted listing.' });
      }
    }

    const booking = await Booking.create({
      seeker: req.user._id,
      listing: listingId,
      provider: listing.provider,
      room: roomId, // Save the room ID
      checkInDate: startDate,
      checkOutDate: endDate,
      moveInDate: startDate,
      status: 'pending',
      agreedMonthRent: rent,
      agreedDeposit: deposit,
      totalAmount: totalAmount,
      applicationData: {
        name: req.body.applicationData?.name,
        nic: req.body.applicationData?.nic,
        occupation: req.body.applicationData?.occupation,
        note: req.body.applicationData?.note,
        phone: req.body.applicationData?.phone,
        address: req.body.applicationData?.address,
        gender: req.body.applicationData?.gender,
        organization: req.body.applicationData?.organization,
        faculty: req.body.applicationData?.faculty,
        workplace: req.body.applicationData?.workplace,
        otherDescription: req.body.applicationData?.otherDescription
      },
      agreementAccepted: req.body.agreementAccepted || false
    });

    // Populate provider info for email
    const fullBooking = await Booking.findById(booking._id)
      .populate('provider', 'name email')
      .populate('seeker', 'name')
      .populate('listing', 'title');

    // --- NOTIFICATION TRIGGER ---
    const { createNotification } = await import('./notification.controller.js');
    await createNotification({
      recipient: fullBooking.provider._id,
      type: 'booking_request',
      title: 'New Booking Request',
      message: `You have received a booking request from ${fullBooking.seeker.name} for ${fullBooking.listing.title}`,
      data: { bookingId: booking._id }
    });


    // Send Email to Provider
    if (fullBooking.provider && fullBooking.provider.email) {
      const acceptLink = `${process.env.ADMIN_URL || 'http://localhost:5174'}/booking-action/${booking._id}?action=accept`;
      const rejectLink = `${process.env.ADMIN_URL || 'http://localhost:5174'}/booking-action/${booking._id}?action=reject`;

      const { sendBookingRequestEmail } = await import('../utils/emailService.js');

      await sendBookingRequestEmail(
        fullBooking.provider.email,
        fullBooking.provider.name,
        {
          listingTitle: fullBooking.listing.title,
          seekerName: fullBooking.seeker.name,
          occupation: fullBooking.applicationData?.occupation || 'N/A',
          organization: fullBooking.applicationData?.organization,
          faculty: fullBooking.applicationData?.faculty,
          workplace: fullBooking.applicationData?.workplace,
          otherDescription: fullBooking.applicationData?.otherDescription,
          note: fullBooking.applicationData?.note || 'No note',
          startDate: fullBooking.checkInDate,
          endDate: fullBooking.checkOutDate
        },
        acceptLink,
        rejectLink
      );
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my bookings
// @route   GET /api/bookings
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const role = req.user.role;
    let query = {};

    if (role === 'seeker') {
      query = { seeker: req.user._id };
    } else if (role === 'provider') {
      query = { provider: req.user._id };
    }

    const bookings = await Booking.find(query)
      .populate('listing', 'title images location')
      .populate('seeker', 'name email')
      .populate('provider', 'name phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listing')
      .populate('seeker', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Access control: only seeker or provider involved
    const userId = req.user._id.toString();
    const seekerId = booking.seeker._id.toString(); // seeker is populated, need _id
    const providerId = booking.provider.toString(); // provider is NOT populated in this query (based on line 144-146) - wait, let's check population.
    // Line 146 populates seeker. Line 145 populates listing. Provider is NOT populated, so it is an ID.

    console.log(`[DEBUG] getBookingById Auth Check: UserID=${userId}, Role=${req.user.role}`);
    console.log(`[DEBUG] Booking Details: SeekerID=${seekerId}, ProviderID=${providerId}`);

    if (seekerId !== userId && providerId !== userId && req.user.role !== 'admin') {
      console.log('[DEBUG] Authorization Failed');
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (Accept/Reject)
// @route   PUT /api/bookings/:id/status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action } = req.body;

    let newStatus = status;
    if (!newStatus && action) {
      if (action === 'accept') newStatus = 'pending_payment';
      if (action === 'reject') newStatus = 'rejected';
    }

    if (!['pending_payment', 'rejected', 'accepted'].includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }

    const booking = await Booking.findById(id).populate('seeker', 'name email').populate('listing', 'title');
    // Note: booking.provider is not populated here, so it's the ID. Perfect for Tenant.providerId.
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = newStatus;
    await booking.save();

    // --- NOTIFICATION TRIGGER (REJECTED) ---
    if (newStatus === 'rejected') {
      const { createNotification } = await import('./notification.controller.js');
      await createNotification({
        recipient: booking.seeker._id,
        type: 'booking_rejected',
        title: 'Booking Update',
        message: `Your booking for ${booking.listing.title} was declined.`,
        data: { bookingId: booking._id }
      });
    }

    // Notify Seeker (Log for MVP)
    if (newStatus === 'pending_payment') {
      console.log(`Sending Acceptance Email to ${booking.seeker.email}`);

      // --- NOTIFICATION TRIGGER (ACCEPTED) ---
      const recipientId = booking.seeker._id;
      console.log(`[DEBUG] Booking Accepted. Sending notification to Seeker ID: ${recipientId} (Provider ID was: ${booking.provider})`);

      const { createNotification } = await import('./notification.controller.js');
      await createNotification({
        recipient: recipientId, // Seeker ID
        type: 'booking_accepted',
        title: 'Booking Accepted! 🎉',
        message: `Your booking for ${booking.listing.title} has been accepted! Please complete payment.`,
        data: { bookingId: booking._id }
      });

      // Create Pending Tenant
      try {
        await Tenant.create({
          listingId: booking.listing._id,
          roomId: 'Unassigned', // Or map if available
          providerId: booking.provider,
          name: booking.applicationData?.name || booking.seeker.name,
          nic: booking.applicationData?.nic || 'Pending',
          phone: booking.applicationData?.phone || 'Pending',
          email: booking.seeker.email,
          status: 'Pending',
          rentAmount: booking.agreedMonthRent,
          depositAmount: booking.agreedDeposit
        });
        console.log("Tenant created successfully for accepted booking");
      } catch (tenantError) {
        console.error("Failed to auto-create tenant:", tenantError);
        // We don't fail the request, just log it
      }
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check ownership
    if (booking.seeker.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this booking' });
    }

    // Optional: Prevent deleting active/confirmed bookings if needed
    // For now, we allow the user to delete their request history as requested.
    // However, if the status is 'confirmed', deleting it might leave the Provider with a ghost record if we don't handle it.
    // But since this is a hard delete, it deletes it for everyone.
    // Let's assume this is the intended behavior for cleaning up "rejected" or "pending" requests.

    await booking.deleteOne();

    res.json({ message: 'Booking removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
