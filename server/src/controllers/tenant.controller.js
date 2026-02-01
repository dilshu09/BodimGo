import Tenant from '../models/tenant.model.js';
import Listing from '../models/Listing.js';
import Agreement from '../models/agreement.model.js';

// @desc    Create a new manual tenant (Provider initiated)
// @route   POST /api/tenants
// @access  Private (Provider)
export const createTenant = async (req, res, next) => {
    try {
        const { listingId, roomId, name, nic, phone, email } = req.body;

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
            rentAmount,
            status: 'Pending',
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
