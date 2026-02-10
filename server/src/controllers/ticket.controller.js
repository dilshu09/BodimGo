import Ticket from '../models/Ticket.js';

// @desc    Create a new support ticket
// @route   POST /api/tickets
// @access  Private (Provider)
export const createTicket = async (req, res) => {
    try {
        const { subject, message, category, priority } = req.body;

        const ticket = new Ticket({
            provider: req.user.id,
            subject,
            message,
            category,
            priority
        });

        const savedTicket = await ticket.save();
        res.status(201).json(savedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user's tickets
// @route   GET /api/tickets
// @access  Private (Provider)
export const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ provider: req.user.id }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all tickets (Admin)
// @route   GET /api/admin/tickets
// @access  Private (Admin)
export const getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({})
            .populate('provider', 'name email contactNumber')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update ticket status or reply
// @route   PUT /api/admin/tickets/:id
// @access  Private (Admin)
export const updateTicket = async (req, res) => {
    try {
        const { status, adminResponse } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (status) ticket.status = status;
        if (adminResponse) {
            ticket.adminResponse = adminResponse;
            ticket.respondedAt = Date.now();
            // Auto close or resolve if response given? Let frontend decide.
        }

        const updatedTicket = await ticket.save();

        // Populate provider before returning so UI doesn't break
        await updatedTicket.populate('provider', 'name email');

        res.json(updatedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
