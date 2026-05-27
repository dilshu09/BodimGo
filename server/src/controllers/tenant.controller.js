import Tenant from '../models/tenant.model.js';
import Listing from '../models/Listing.js';
import Agreement from '../models/agreement.model.js';

// @desc    Create a new manual tenant (Provider initiated)
// @route   POST /api/tenants
// @access  Private (Provider)
export const createTenant = async (req, res, next) => {
    try {
        const { listingId, roomId, name, nic, phone, email, address } = req.body;

        // 0. Check for existing ACTIVE tenant with same NIC under this provider
        const existingActiveTenant = await Tenant.findOne({
            providerId: req.user._id,
            nic,
            status: 'Active'
        });

        if (existingActiveTenant) {
            return res.status(400).json({
                success: false,
                message: `Tenant with NIC ${nic} is already active in your property.`
            });
        }

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
        console.log(`[updateTenantStatus] Updating tenant ${req.params.id} to status ${status}`);

        const tenant = await Tenant.findOne({ _id: req.params.id, providerId: req.user._id });

        if (!tenant) {
            console.log(`[updateTenantStatus] Tenant not found`);
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        tenant.status = status;
        if (status === 'Moved Out') {
            tenant.movedOutDate = movedOutDate || new Date();

            // Increment room availability if they are moving out
            if (tenant.roomId && tenant.roomId !== "Unassigned") {
                console.log(`[updateTenantStatus] checking room ${tenant.roomId} for listing ${tenant.listingId}`);

                if (tenant.listingId) {
                    const listing = await Listing.findById(tenant.listingId);
                    if (listing) {
                        const room = listing.rooms.find(r => r._id.toString() === tenant.roomId || r.name === tenant.roomId);
                        if (room) {
                            console.log(`[updateTenantStatus] Marking room ${room.name} as Available`);
                            room.status = 'Available';
                            try {
                                await listing.save();
                                console.log(`[updateTenantStatus] Listing saved (room updated)`);
                            } catch (listingSaveError) {
                                console.error(`[updateTenantStatus] Error saving listing:`, listingSaveError);
                                throw new Error(`Failed to update room availability: ${listingSaveError.message}`);
                            }
                        } else {
                            console.warn(`[updateTenantStatus] Room not found in listing`);
                        }
                    } else {
                        console.warn(`[updateTenantStatus] Listing not found`);
                    }
                } else {
                    console.warn(`[updateTenantStatus] Tenant has no listingId`);
                }
            }
        }

        try {
            await tenant.save();
            console.log(`[updateTenantStatus] Tenant saved successfully`);
        } catch (saveError) {
            console.error(`[updateTenantStatus] Error saving tenant:`, saveError);
            throw new Error(`Failed to save tenant: ${saveError.message}`);
        }

        res.status(200).json({
            success: true,
            data: tenant
        });
    } catch (err) {
        console.error('[updateTenantStatus] Error:', err);
        // If it's a validation error, log the details
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            console.error('[updateTenantStatus] Validation Messages:', messages);
            return res.status(400).json({ success: false, message: messages.join(', '), error: err.message });
        }
        res.status(500).json({ success: false, message: err.message, error: err.message, stack: err.stack });
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
        
        // Handle Room Assignment / Change
        if (roomId && roomId !== tenant.roomId) {
            const listing = await Listing.findById(tenant.listingId);
            if (listing) {
                // 1. Mark OLD room as Available (if it wasn't unassigned)
                if (tenant.roomId && tenant.roomId !== 'Unassigned') {
                    const oldRoom = listing.rooms.id(tenant.roomId) || listing.rooms.find(r => r.name === tenant.roomId);
                    if (oldRoom) {
                        oldRoom.status = 'Available';
                        // Logic for beds could go here if needed
                    }
                }

                // 2. Mark NEW room as Occupied
                if (roomId !== 'Unassigned') {
                    const newRoom = listing.rooms.id(roomId) || listing.rooms.find(r => r.name === roomId);
                    if (newRoom) {
                        newRoom.status = 'Occupied';
                        // Update rent amount automatically if not explicitly provided
                        if (!rentAmount) tenant.rentAmount = newRoom.price;
                    }
                }

                tenant.roomId = roomId;
                await listing.save();
            }
        }

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
        const { listingId } = req.query;
        const query = { providerId: req.user._id };
        if (listingId) query.listingId = listingId;

        const tenants = await Tenant.find(query)
            .populate('listingId', 'title rooms') // Populate listing title and rooms
            .sort({ createdAt: -1 });

        const User = (await import('../models/User.js')).default;
        const Payment = (await import('../models/Payment.js')).default;

        // Augment tenants with payment info and human-readable room names
        const tenantsWithPayments = await Promise.all(tenants.map(async (tenant) => {
            const tenantObj = tenant.toObject();
            tenantObj.currentMonth = { paid: false, date: null };

            // Resolve Room Name
            if (tenant.listingId && tenant.listingId.rooms) {
                const room = tenant.listingId.rooms.find(r => 
                    r._id.toString() === tenant.roomId || r.name === tenant.roomId
                );
                tenantObj.roomName = room ? room.name : (tenant.roomId === 'Unassigned' ? 'Unassigned' : tenant.roomId);
            } else {
                tenantObj.roomName = tenant.roomId;
            }

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

// @desc    Get current tenancy for logged in seeker
// @route   GET /api/tenants/my-tenancy
// @access  Private
export const getMyTenancy = async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Find tenant record by email. Prioritize Active/Pending.
        const tenants = await Tenant.find({
            email: userEmail,
            status: { $in: ['Active', 'Pending'] }
        })
            .populate('listingId', 'title address images location rent deposit rooms')
            .populate('providerId', 'name email phone')
            .sort({ status: 1, createdAt: -1 }); // 'Active' comes before 'Pending'? No, Alphabetical. Active < Pending. So 1 works.

        if (!tenants || tenants.length === 0) {
            return res.status(404).json({ success: false, message: "No active tenancy found" });
        }

        // Sort in memory to be sure: Active with assigned room > Active > Pending
        const activeTenant = tenants.find(t => t.status === 'Active' && t.roomId !== 'Unassigned') ||
                             tenants.find(t => t.status === 'Active') ||
                             tenants[0];

        // Get Payments
        const Payment = (await import('../models/Payment.js')).default;
        const payments = await Payment.find({
            payer: req.user._id,
            payee: activeTenant.providerId._id
        }).sort({ createdAt: -1 });

        const tenantObj = activeTenant.toObject();
        
        // Resolve Room Name
        if (tenantObj.listingId && tenantObj.listingId.rooms && tenantObj.roomId !== 'Unassigned') {
            const room = tenantObj.listingId.rooms.find(r => 
                r._id.toString() === tenantObj.roomId || r.name === tenantObj.roomId
            );
            tenantObj.roomName = room ? room.name : tenantObj.roomId;
        } else {
            tenantObj.roomName = tenantObj.roomId === 'Unassigned' ? 'Shared Space' : tenantObj.roomId;
        }
        tenantObj.paymentHistory = payments.map(p => ({
            _id: p._id,
            month: new Date(p.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' }),
            date: p.createdAt,
            amount: p.amount,
            status: p.status
        }));

        res.status(200).json({
            success: true,
            data: tenantObj
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};
// @desc    Request Move Out (Seeker initiated)
// @route   POST /api/tenants/move-out
// @access  Private (Seeker)
export const requestMoveOut = async (req, res) => {
    try {
        const userEmail = req.user.email;
        // Prioritize active tenancy with a valid room assignment
        let tenant = await Tenant.findOne({
            email: userEmail,
            status: 'Active',
            roomId: { $ne: 'Unassigned', $exists: true }
        })
            .populate('listingId', 'title')
            .populate('providerId', 'name');

        if (!tenant) {
            tenant = await Tenant.findOne({ email: userEmail, status: 'Active' })
                .populate('listingId', 'title')
                .populate('providerId', 'name');
        }

        if (!tenant) {
            return res.status(404).json({ success: false, message: "No active tenancy found" });
        }

        // Check if already requested (optional logic, but good for idempotency)
        // For now, we'll just update status to 'Move Out Requested' or similar?
        // Actually, schema might only support 'Active', 'Moved Out'. 
        // Let's check schema. If no 'Move Out Requested' status exists, we might need to add it or just send a notification.
        // Assuming strict status enum, let's just send a notification to Provider for now, 
        // OR if permitted, update status to specific "Notice Given" state if available.
        // For MVP: Send Notification + maybe update a flag? 
        // Let's assume we can update status to 'Pending Move Out' if schema permits.
        // If not, we'll just send notification. 
        // A safer bet without seeing schema is to Notification-only if status structure is rigid.
        // BUT user asked for "Transaction". 
        // Let's try to update status to "Move Out Pending" and see if it sticks, or catch validation error?
        // Better: Just Notify Provider + Return Success. Provider must manually mark 'Moved Out' to release room.

        const { Notification } = await import('../models/Notification.js'); // Dynamic import if needed or use controller
        const { createNotification } = await import('./notification.controller.js');

        await createNotification({
            recipient: tenant.providerId._id,
            type: 'move_out_request',
            title: 'Move Out Request',
            message: `${tenant.name} has requested to move out from ${tenant.listingId?.title || 'your property'}.`,
            data: { tenantId: tenant._id }
        });

        res.status(200).json({ success: true, message: "Move out request sent to provider" });

    } catch (err) {
        console.error("Move Out Request Error:", err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Send manual payment reminder to tenant
// @route   POST /api/tenants/:id/remind
// @access  Private (Provider)
export const sendManualReminder = async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ _id: req.params.id, providerId: req.user._id })
            .populate('listingId', 'title');

        if (!tenant) {
            return res.status(404).json({ success: false, message: "Tenant not found" });
        }

        const { sendEmail } = await import('../utils/emailService.js');
        const Notification = (await import('../models/Notification.js')).default;
        const User = (await import('../models/User.js')).default;
        const io = req.app.get('socketio');

        // Email to Tenant
        if (tenant.email) {
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <span style="font-size: 48px;">🛎️</span>
                    <h2 style="color: #4F46E5; margin-top: 10px;">Payment Reminder</h2>
                </div>
                <p>Hi <strong>${tenant.name}</strong>,</p>
                <p>This is a polite reminder from your provider regarding the rent payment for <strong>${tenant.listingId?.title || 'your room'}</strong>.</p>
                <p style="color: #475569; line-height: 1.6;">Please ensure your payment of Rs. ${tenant.rentAmount} is completed as soon as possible.</p>
                <div style="margin: 35px 0; text-align: center;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/my-boarding" style="background-color: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Dashboard & Pay</a>
                </div>
                </div>
            `;
            await sendEmail({
                to: tenant.email,
                subject: `Reminder: Rent Payment for ${tenant.listingId?.title}`,
                html
            });
        }

        // Notification to Tenant
        if (tenant.email) {
            const seeker = await User.findOne({ email: tenant.email });
            if (seeker) {
                const notification = await Notification.create({
                    recipient: seeker._id,
                    type: 'payment_reminder',
                    title: 'Manual Payment Reminder',
                    message: `Your provider has sent a reminder for your rent payment of Rs. ${tenant.rentAmount}.`,
                    link: '/my-boarding'
                });
                io.to(seeker._id.toString()).emit('new-notification', notification);
            }
        }

        res.status(200).json({ success: true, message: "Reminder sent successfully" });
    } catch (err) {
        console.error("Manual Reminder Error:", err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

// @desc    Report Room Maintenance (Seeker initiated)
// @route   POST /api/tenants/maintenance
// @access  Private (Seeker)
export const reportMaintenance = async (req, res) => {
    try {
        const { issue, priority } = req.body;
        if (!issue || !issue.trim()) {
            return res.status(400).json({ success: false, message: "Issue description is required" });
        }

        const userEmail = req.user.email;
        
        // Prioritize active tenancy with a valid room assignment
        let tenant = await Tenant.findOne({
            email: userEmail,
            status: 'Active',
            roomId: { $ne: 'Unassigned', $exists: true }
        });

        if (!tenant) {
            tenant = await Tenant.findOne({ email: userEmail, status: 'Active' });
        }

        if (!tenant) {
            return res.status(404).json({ success: false, message: "No active tenancy found" });
        }

        if (!tenant.roomId || tenant.roomId === 'Unassigned') {
            return res.status(400).json({ success: false, message: "No assigned room found for maintenance." });
        }

        // Find the Listing document containing the room
        const Listing = (await import('../models/Listing.js')).default;
        const listing = await Listing.findOne({
            "rooms._id": tenant.roomId
        });

        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing containing your room was not found." });
        }

        // Update the specific room's status and details
        const roomIndex = listing.rooms.findIndex(r => r._id.toString() === tenant.roomId.toString());
        if (roomIndex === -1) {
            return res.status(404).json({ success: false, message: "Room not found in listing." });
        }

        listing.rooms[roomIndex].status = 'Maintenance';
        listing.rooms[roomIndex].maintenanceIssue = issue;
        listing.rooms[roomIndex].maintenancePriority = priority || 'Medium';
        listing.rooms[roomIndex].maintenanceReportedAt = new Date();

        await listing.save();

        // Create a notification for the Provider
        try {
            const { createNotification } = await import('./notification.controller.js');
            const io = req.app.get('socketio');

            const notification = await createNotification({
                recipient: tenant.providerId,
                type: 'maintenance_request',
                title: 'Maintenance Request Raised',
                message: `Tenant ${tenant.name} reported a maintenance issue in room ${listing.rooms[roomIndex].name}: "${issue}"`,
                data: { roomId: tenant.roomId }
            });

            if (io && notification) {
                io.to(tenant.providerId.toString()).emit('new-notification', notification);
            }
        } catch (notifErr) {
            console.error("Failed to notify provider about maintenance:", notifErr);
        }

        res.status(200).json({
            success: true,
            message: "Maintenance request submitted successfully"
        });

    } catch (err) {
        console.error("Report Maintenance Error:", err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};
