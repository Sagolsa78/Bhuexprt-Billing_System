const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
const getCustomers = async (req, res, next) => {
    try {
        const customers = await Customer.find({});
        res.json(customers);
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (customer) {
            res.json(customer);
        } else {
            res.status(404);
            throw new Error('Customer not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Public
const createCustomer = async (req, res, next) => {
    try {
        const { name, email, phone, address, state, stateCode, gstNumber, creditLimit, outstandingBalance, notes } = req.body;

        const customerExists = await Customer.findOne({ email });

        if (customerExists) {
            res.status(400);
            throw new Error('Customer already exists');
        }

        const customer = await Customer.create({
            name,
            email,
            phone,
            address,
            state: state || 'Maharashtra',
            stateCode: stateCode || '27',
            gstNumber,
            creditLimit: creditLimit || 0,
            outstandingBalance: outstandingBalance || 0,
            notes
        });

        if (customer) {
            res.status(201).json(customer);
        } else {
            res.status(400);
            throw new Error('Invalid customer data');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (customer) {
            customer.name = req.body.name || customer.name;
            customer.email = req.body.email || customer.email;
            customer.phone = req.body.phone || customer.phone;
            customer.address = req.body.address || customer.address;
            customer.state = req.body.state || customer.state;
            customer.stateCode = req.body.stateCode || customer.stateCode;
            customer.gstNumber = req.body.gstNumber || customer.gstNumber;
            if (req.body.creditLimit !== undefined) customer.creditLimit = req.body.creditLimit;
            if (req.body.notes !== undefined) customer.notes = req.body.notes;
            // deliberate decision: Do not allow direct update of outstandingBalance via API to prevent mismatch with transactions
            // Admin can adjust it if we add a specific adjustment feature, or we can allow it here if requested.
            // For now, let's allow it for initial setup/correction
            if (req.body.outstandingBalance !== undefined) customer.outstandingBalance = req.body.outstandingBalance;

            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404);
            throw new Error('Customer not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (customer) {
            await customer.deleteOne();
            res.json({ message: 'Customer removed' });
        } else {
            res.status(404);
            throw new Error('Customer not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer ledger (invoices and payments)
// @route   GET /api/customers/:id/ledger
// @access  Private
const getCustomerLedger = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            res.status(404);
            throw new Error('Customer not found');
        }

        const invoices = await Invoice.find({ customerId: req.params.id }).lean();
        const payments = await Payment.find({ customerId: req.params.id }).lean();

        // Add type field to distinguish
        const invoicesWithType = invoices.map(inv => ({ ...inv, type: 'INVOICE', date: inv.createdAt }));
        const paymentsWithType = payments.map(pay => ({ ...pay, type: 'PAYMENT' }));

        // Merge and sort by date descending
        const transactions = [...invoicesWithType, ...paymentsWithType].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            customer,
            transactions
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomerLedger
};
