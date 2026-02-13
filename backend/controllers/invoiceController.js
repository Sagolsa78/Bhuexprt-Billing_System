const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Public
const createInvoice = async (req, res, next) => {
    try {
        let { customerId, customerName, customerEmail, customerAddress, customerMobile, items, subtotal, tax, total } = req.body;

        if (!items || items.length === 0) {
            res.status(400);
            throw new Error('No invoice items');
        }

        // Check Credit Limit ONLY if customerId is present
        if (customerId) {
            const customer = await Customer.findById(customerId);
            if (!customer) {
                res.status(404);
                throw new Error('Customer not found');
            }

            // Auto-fill customer details from Customer model if not provided
            if (!customerName) customerName = customer.name || '';
            if (!customerEmail) customerEmail = customer.email || '';
            if (!customerAddress) customerAddress = customer.address || '';
            if (!customerMobile) customerMobile = customer.phone || '';

            const newBalance = (customer.outstandingBalance || 0) + Number(total);
            if (customer.creditLimit > 0 && newBalance > customer.creditLimit) {
                res.status(400);
                throw new Error(`Credit limit exceeded. Current Balance: ${customer.outstandingBalance}, New Total: ${newBalance}, Limit: ${customer.creditLimit}`);
            }

            // Update Customer Balance
            customer.outstandingBalance = newBalance;
            await customer.save();
        }

        // Sanitize customerMobile: only pass it if it's a valid phone number
        if (customerMobile && !/^\+?\d{10,15}$/.test(customerMobile)) {
            customerMobile = undefined;
        }

        try {
            const invoice = new Invoice({
                customerId: customerId || undefined,
                customerName,
                customerEmail,
                customerAddress,
                customerMobile,
                items,
                subtotal,
                tax,
                total,
                balanceDue: total
            });

            const createdInvoice = await invoice.save();
            res.status(201).json(createdInvoice);
        } catch (error) {
            console.error("Invoice creation error:", error);
            res.status(400);
            throw new Error(error.message || 'Failed to create invoice');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get invoices by customer ID
// @route   GET /api/invoices/:customerId
// @access  Public
const getInvoicesByCustomer = async (req, res, next) => {
    try {
        const invoices = await Invoice.find({ customerId: req.params.customerId }).populate('items.productId');
        res.json(invoices);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Public
const getInvoices = async (req, res, next) => {
    try {
        const invoices = await Invoice.find({}).populate('customerId', 'name email phone address').populate('items.productId');

        // Backfill customerName for old invoices that don't have it stored
        const updatePromises = [];
        const result = invoices.map(inv => {
            const invoiceObj = inv.toObject();
            if (!invoiceObj.customerName && invoiceObj.customerId && invoiceObj.customerId.name) {
                // Backfill the missing customerName in the database
                updatePromises.push(
                    Invoice.findByIdAndUpdate(inv._id, {
                        customerName: invoiceObj.customerId.name,
                        customerEmail: invoiceObj.customerEmail || invoiceObj.customerId.email || '',
                        customerMobile: invoiceObj.customerMobile || invoiceObj.customerId.phone || '',
                        customerAddress: invoiceObj.customerAddress || invoiceObj.customerId.address || '',
                    })
                );
                // Also set it in the response
                invoiceObj.customerName = invoiceObj.customerId.name;
                if (!invoiceObj.customerEmail) invoiceObj.customerEmail = invoiceObj.customerId.email || '';
                if (!invoiceObj.customerMobile) invoiceObj.customerMobile = invoiceObj.customerId.phone || '';
                if (!invoiceObj.customerAddress) invoiceObj.customerAddress = invoiceObj.customerId.address || '';
            }
            return invoiceObj;
        });

        // Run backfill updates in background (don't block response)
        if (updatePromises.length > 0) {
            Promise.all(updatePromises).catch(err => console.error('Backfill error:', err));
        }

        res.json(result);
    } catch (error) {
        next(error);
    }
};

// @desc    Update invoice to paid
// @route   PUT /api/invoices/:id/pay
// @access  Public
const updateInvoiceToPaid = async (req, res, next) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (invoice) {
            invoice.status = 'PAID';
            const updatedInvoice = await invoice.save();
            res.json(updatedInvoice);
        } else {
            res.status(404);
            throw new Error('Invoice not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createInvoice,
    getInvoicesByCustomer,
    getInvoices,
    updateInvoiceToPaid,
};
