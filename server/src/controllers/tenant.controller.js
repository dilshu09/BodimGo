import Tenant from '../models/tenant.model.js';
import Listing from '../models/Listing.js';
import Agreement from '../models/agreement.model.js';

// @desc    Create a new manual tenant (Provider initiated)
// @route   POST /api/tenants
// @access  Private (Provider)
export const createTenant = async (req, res, next) => {
    try {
        const { listingId, roomId, name, nic, phone, email, address } = req.body;

        // 1. Validate Provider owns the listing
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }
        if (listing.provider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this listing" });
        }

        // 2. Validate Room
        const room = listing.rooms.find(r => r._id.toString() === roomId || r.name === roomId);

        let rentAmount = 0;
        if (room) {
            rentAmount = room.price || 0;
        }

        // 3. Create Tenant
        const tenant = await Tenant.create({
            providerId: req.user._id,
            listingId,
            roomId,
            name,
            nic,
            phone,
            email,
            address,
            rentAmount,
            status: 'Active', // Manual tenants are valid residents immediately
            agreementStatus: 'Not Generated'
        });

        res.status(201).json({
            success: true,
            data: tenant
        });
    } catch (err) {
        // next(err); // Assuming next error handler is set up, fallback to manual for safety
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// ... (keep generateAgreement and getTenants as is) ...

// @desc    Update tenant status (Move Out, etc.)
// @route   PATCH /api/tenants/:id/status
// @access  Private (Provider)
export const updateTenantStatus = async (req, res) => {
    try {
        const { status, movedOutDate } = req.body;
        const tenant = await Tenant.findOne({ _id: req.params.id, providerId: req.user._id });

        if (!tenant) {
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        tenant.status = status;
        if (status === 'Moved Out' && movedOutDate) {
            tenant.movedOutDate = movedOutDate;

            // Increment room availability if they are moving out
            // Find room by ID (assuming tenant.roomId stores ID as string or ObjectId)
            if (tenant.roomId && tenant.roomId !== "Unassigned") {
                const Room = (await import('../models/Room.js')).default;
                // Try to find room within the listing
                const listing = await Listing.findById(tenant.listingId);
                if (listing) {
                    const room = listing.rooms.find(r => r._id.toString() === tenant.roomId || r.name === tenant.roomId);
                    if (room) {
                        room.availableBeds = (room.availableBeds || 0) + 1;
                        // If it was full, it might not be anymore; simplified logic:
                        if (room.status === 'full') room.status = 'Available';
                        await listing.save();
                    }
                }
            }
        }

        await tenant.save();

        res.status(200).json({
            success: true,
            data: tenant
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Update tenant details (Name, Phone, etc.)
// @route   PATCH /api/tenants/:id
// @access  Private (Provider)
export const updateTenant = async (req, res) => {
    try {
        const { name, email, phone, nic, address, rentAmount, roomId } = req.body;
        const tenant = await Tenant.findOne({ _id: req.params.id, providerId: req.user._id });

        if (!tenant) {
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        if (name) tenant.name = name;
        if (email) tenant.email = email;
        if (phone) tenant.phone = phone;
        if (nic) tenant.nic = nic;
        if (address) tenant.address = address;
        if (rentAmount) tenant.rentAmount = rentAmount;
        // Room update might require more logic (availability check), keeping simple for now
        // if (roomId) tenant.roomId = roomId; 

        await tenant.save();

        res.status(200).json({
            success: true,
            data: tenant,
            message: "Tenant details updated successfully"
        });
    } catch (err) {
        console.error("Update Tenant Error:", err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Generate agreement link for tenant
// @route   POST /api/tenants/:id/agreement
export const generateAgreement = async (req, res, next) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) {
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        // Check if agreement already exists
        let agreement = await Agreement.findOne({ tenantId: tenant._id });

        if (!agreement) {
            let agreementContent = "Standard Lease Agreement Content Placeholder...";

            // If templateId provided, fetch content
            if (req.body.templateId) {
                const AgreementTemplate = (await import('../models/agreementTemplate.model.js')).default;
                const template = await AgreementTemplate.findById(req.body.templateId);
                if (template) {
                    agreementContent = template.content;
                }
            }

            agreement = await Agreement.create({
                tenantId: tenant._id,
                listingId: tenant.listingId,
                providerId: req.user._id,
                content: agreementContent,
                status: 'Pending Signature'
            });

            tenant.agreementStatus = 'Sent';
            await tenant.save();
        }

        // Generate a mock signing link
        const signingLink = `http://${req.headers.host}/sign/${agreement._id}`;

        res.status(200).json({
            success: true,
            data: {
                agreementId: agreement._id,
                signingLink
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Get all tenants for a provider
// @route   GET /api/tenants
// @access  Private (Provider)
export const getTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find({ providerId: req.user._id })
            .populate('listingId', 'title') // Populate listing title
            .sort({ createdAt: -1 });

        const User = (await import('../models/User.js')).default;
        const Payment = (await import('../models/Payment.js')).default;

        // Augment tenants with payment info
        const tenantsWithPayments = await Promise.all(tenants.map(async (tenant) => {
            const tenantObj = tenant.toObject();
            tenantObj.currentMonth = { paid: false, date: null };

            // Find linked user by email
            if (tenant.email) {
                const user = await User.findOne({ email: tenant.email });
                if (user) {
                    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

                    // Get all completed payments for this tenant/provider pair
                    const allPayments = await Payment.find({
                        payer: user._id,
                        payee: req.user._id,
                        status: 'completed'
                    }).sort({ createdAt: -1 });

                    // Check current month payment
                    const lastPayment = allPayments.find(p => p.createdAt >= startOfMonth);
                    if (lastPayment) {
                        tenantObj.currentMonth = {
                            paid: true,
                            date: lastPayment.createdAt
                        };
                    }

                    // Map to paymentHistory structure
                    tenantObj.paymentHistory = allPayments.map(p => ({
                        month: new Date(p.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' }),
                        dueDate: p.createdAt, // Using payment date as proxies for now
                        paidDate: p.createdAt,
                        amount: p.amount,
                        status: 'Paid'
                    }));
                }
            }
            return tenantObj;
        }));

        res.status(200).json({
            success: true,
            count: tenantsWithPayments.length,
            data: tenantsWithPayments
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};
