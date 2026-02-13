const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

// @desc    Create new payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res, next) => {
    try {
        let { invoiceId, amount, date, paymentMode, reference, notes } = req.body;

        if (!invoiceId || !amount) {
            res.status(400);
            throw new Error("Invoice ID and amount are required");
        }

        amount = Number(amount);

        if (isNaN(amount) || amount <= 0) {
            res.status(400);
            throw new Error("Payment amount must be greater than zero");
        }

        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            res.status(404);
            throw new Error("Invoice not found");
        }

        // Ensure balanceDue exists
        const currentBalance = invoice.balanceDue ?? (invoice.total - (invoice.amountPaid || 0));

        if (amount > currentBalance) {
            res.status(400);
            throw new Error(`Payment amount cannot exceed balance due (${currentBalance})`);
        }

        // Create Payment Record
        const payment = await Payment.create({
            invoiceId,
            customerId: invoice.customerId || null,
            amount,
            date: date || Date.now(),
            paymentMode,
            reference,
            notes
        });

        // Update Invoice
        invoice.amountPaid = (invoice.amountPaid || 0) + amount;
        invoice.balanceDue = invoice.total - invoice.amountPaid;

        if (invoice.balanceDue <= 0) {
            invoice.status = "PAID";
            invoice.balanceDue = 0;
        } else {
            invoice.status = "PARTIAL";
        }

        await invoice.save();

        // Update Customer only if exists
        if (invoice.customerId) {
            const customer = await Customer.findById(invoice.customerId);

            if (customer) {
                customer.outstandingBalance =
                    (customer.outstandingBalance || 0) - amount;

                if (customer.outstandingBalance < 0) {
                    customer.outstandingBalance = 0;
                }

                await customer.save();
            }
        }

        res.status(201).json(payment);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res, next) => {
    try {
        const pageSize = 20;
        const page = Number(req.query.pageNumber) || 1;

        const count = await Payment.countDocuments({});
        const payments = await Payment.find({})
            .populate('customerId', 'name email')
            .populate('invoiceId', '_id total')
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ date: -1 });

        res.json({ payments, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        next(error);
    }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('customerId', 'name email')
            .populate('invoiceId', '_id total');

        if (payment) {
            res.json(payment);
        } else {
            res.status(404);
            throw new Error('Payment not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get payments for a specific invoice
// @route   GET /api/payments/invoice/:invoiceId
// @access  Private
const getPaymentsByInvoice = async (req, res, next) => {
    try {
        const payments = await Payment.find({ invoiceId: req.params.invoiceId }).sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPayment,
    getPayments,
    getPaymentById,
    getPaymentsByInvoice
};
