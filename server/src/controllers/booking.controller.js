import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';
import Room from '../models/Room.js';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Seeker)
export const createBooking = async (req, res) => {
  try {
    const { listingId, startDate, endDate, guests } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Calculate nights and total amount
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end - start) / (1000 * 60 * 60 * 24 * 30.44); // Approx months
    const totalAmount = (listing.rent * Math.max(1, Math.ceil(months))) + (listing.deposit || 0);

    const booking = await Booking.create({
      seeker: req.user._id,
      listing: listingId,
      provider: listing.provider,
      checkInDate: startDate,
      checkOutDate: endDate,
      status: 'pending_payment',
      agreedRent: listing.rent,
      depositAmount: listing.deposit,
      totalAmount: totalAmount // Or just store what needs to be paid now
    });

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
    if (booking.seeker.toString() !== req.user.id && booking.provider.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
