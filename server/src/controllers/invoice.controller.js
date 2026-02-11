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
        const invoices = await Invoice.find({ provider: req.user._id })
            .populate('tenant', 'name email roomId')
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        console.error("Get Invoices Error:", error);
        res.status(500).json({ message: error.message });
    }
};
