const mongoose = require('mongoose');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const { calculateGST, STATE_CODES } = require('../utils/gstUtils');

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = async (req, res, next) => {
    try {
        const quotations = await Quotation.find({})
            .populate('customerId', 'name email address mobile')
            .sort({ createdAt: -1 });
        res.json(quotations);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single quotation
// @route   GET /api/quotations/:id
// @access  Private
const getQuotationById = async (req, res, next) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate('customerId', 'name email address mobile')
            .populate('items.productId', 'name price');

        if (quotation) {
            res.json(quotation);
        } else {
            res.status(404);
            throw new Error('Quotation not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a quotation
// @route   POST /api/quotations
// @access  Private
const createQuotation = async (req, res, next) => {
    try {
        const {
            customerId,
            customerName,
            customerEmail,
            customerAddress,
            customerMobile,
            items,
            validUntil,
            placeOfSupply // State Code for GST
        } = req.body;

        if (!items || items.length === 0) {
            res.status(400);
            throw new Error('No items in quotation');
        }

        // Calculate Totals & Tax
        let subtotal = 0;
        let totalTax = 0;
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;

        const processedItems = items.map(item => {
            const itemTotal = item.price * item.quantity;
            const taxSplit = calculateGST(itemTotal, item.taxRate, '27', placeOfSupply || '27'); // TODO: Get Supplier State from Config

            subtotal += itemTotal;
            totalTax += taxSplit.totalTax;
            cgstTotal += taxSplit.cgst;
            sgstTotal += taxSplit.sgst;
            igstTotal += taxSplit.igst;

            return {
                ...item,
                gstAmount: taxSplit.totalTax
            };
        });

        const quotation = new Quotation({
            customerId,
            customerName,
            customerEmail,
            customerAddress,
            customerMobile,
            items: processedItems,
            subtotal,
            tax: totalTax,
            total: subtotal + totalTax,
            cgst: cgstTotal,
            sgst: sgstTotal,
            igst: igstTotal,
            validUntil,
            status: 'PENDING'
        });

        const createdQuotation = await quotation.save();
        res.status(201).json(createdQuotation);
    } catch (error) {
        next(error);
    }
};


const convertToInvoice = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const quotation = await Quotation.findById(req.params.id).session(session);

        if (!quotation) {
            throw new Error('Quotation not found');
        }

        if (quotation.status === 'CONVERTED') {
            throw new Error('Quotation already converted');
        }

        // Validate stock first
        for (const item of quotation.items) {
            const product = await Product.findById(item.productId).session(session);

            if (!product) {
                throw new Error('Product not found');
            }

            if (product.currentStock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }
        }

        // Create invoice
        const invoice = await Invoice.create([{
            customerId: quotation.customerId,
            customerName: quotation.customerName,
            customerEmail: quotation.customerEmail,
            customerAddress: quotation.customerAddress,
            customerMobile: quotation.customerMobile,
            items: quotation.items,
            subtotal: quotation.subtotal,
            tax: quotation.tax,
            total: quotation.total,
            cgst: quotation.cgst,
            sgst: quotation.sgst,
            igst: quotation.igst,
            status: 'UNPAID',
            invoiceType: req.body.invoiceType || 'B2C'
        }], { session });

        // Reduce stock safely
        for (const item of quotation.items) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { currentStock: -item.quantity } },
                { session }
            );
        }

        // Update quotation
        quotation.status = 'CONVERTED';
        quotation.convertedInvoiceId = invoice[0]._id;
        await quotation.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(invoice[0]);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

module.exports = {
    getQuotations,
    getQuotationById,
    createQuotation,
    convertToInvoice
};
