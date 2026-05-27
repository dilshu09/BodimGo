import Invoice from '../models/Invoice.js';
import Tenant from '../models/tenant.model.js';

// @desc    Create Manual Invoice
// @route   POST /api/invoices
// @access  Private (Provider)
export const createManualInvoice = async (req, res) => {
    try {
        const { tenantId, amount, description, dueDate } = req.body;
        const providerId = req.user._id;

        // Validate Tenant
        const tenant = await Tenant.findOne({ _id: tenantId, providerId });
        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found or does not belong to you.' });
        }

        // Create Invoice
        const invoice = new Invoice({
            tenant: tenantId,
            provider: providerId,
            invoiceNumber: `INV-${Date.now()}`, // Simple unique ID
            month: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
            dueDate: new Date(dueDate),
            items: [{ description, amount }],
            totalAmount: amount,
            status: 'due'
        });

        await invoice.save();

        res.status(201).json(invoice);
    } catch (error) {
        console.error("Create Invoice Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Invoices for Provider
// @route   GET /api/invoices
// @access  Private (Provider)
export const getProviderInvoices = async (req, res) => {
    try {
        const { listingId } = req.query;
        let query = { provider: req.user._id };

        if (listingId) {
            // Find all tenants for this listing
            const tenants = await Tenant.find({ listingId, providerId: req.user._id });
            const tenantIds = tenants.map(t => t._id);
            query.tenant = { $in: tenantIds };
        }

        const invoices = await Invoice.find(query)
            .populate('tenant', 'name email roomId')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        console.error("Get Invoices Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark invoice as paid
// @route   PUT /api/invoices/:id/pay
// @access  Private (Provider)
export const markInvoiceAsPaid = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (invoice.provider.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        invoice.status = 'paid';
        invoice.paidAt = Date.now();
        await invoice.save();

        // Check if there is an associated pending payment slip for this invoice
        const Payment = (await import('../models/Payment.js')).default;
        const User = (await import('../models/User.js')).default;

        let payment = await Payment.findOne({ invoice: invoice._id });
        if (payment) {
            payment.status = 'completed';
            payment.verifiedBy = req.user._id;
            await payment.save();
        } else {
            // Find the associated tenant to resolve seeker user account
            const Tenant = (await import('../models/tenant.model.js')).default;
            const tenant = await Tenant.findById(invoice.tenant);
            let payerId = null;
            if (tenant && tenant.email) {
                const user = await User.findOne({ email: tenant.email });
                if (user) payerId = user._id;
            }

            // Create a completed Payment record to ensure active tenants listing marks currentMonth as paid
            if (payerId) {
                await Payment.create({
                    invoice: invoice._id,
                    payer: payerId,
                    payee: req.user._id,
                    amount: invoice.totalAmount,
                    method: invoice.proofImageUrl ? 'bank_transfer' : 'cash',
                    status: 'completed',
                    proofImageUrl: invoice.proofImageUrl,
                    verifiedBy: req.user._id
                });
            }
        }

        res.json(invoice);
    } catch (error) {
        console.error("Mark Paid Error:", error);
        res.status(500).json({ message: error.message });
    }
};
