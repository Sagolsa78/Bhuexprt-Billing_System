const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
const getPurchases = async (req, res, next) => {
    try {
        const purchases = await Purchase.find({})
            .populate('vendorId', 'name gstin')
            .sort({ createdAt: -1 });
        res.json(purchases);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a purchase
// @route   POST /api/purchases
// @access  Private
const createPurchase = async (req, res, next) => {
    try {
        const {
            vendorId,
            invoiceNumber,
            invoiceDate,
            items,
            totalAmount,
            taxAmount,
            grandTotal,
            notes
        } = req.body;

        // Validate Vendor
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            res.status(404);
            throw new Error('Vendor not found');
        }

        // Create Purchase Record
        const purchase = new Purchase({
            vendorId,
            vendorName: vendor.name,
            vendorGstin: vendor.gstin,
            invoiceNumber,
            invoiceDate,
            items,
            totalAmount,
            taxAmount,
            grandTotal,
            notes,
            status: 'RECEIVED' // Default to received for now, can be Pending
        });

        const createdPurchase = await purchase.save();

        // AUTOMATIC STOCK UPDATE
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.currentStock = (product.currentStock || 0) + Number(item.quantity);

                // Optionally update cost price if needed (Weighted Average Price logic could go here)
                // product.costPrice = ... 

                await product.save();
            }
        }

        // Update Vendor Balance (Payable increases)
        vendor.currentBalance = (vendor.currentBalance || 0) + Number(grandTotal);
        await vendor.save();

        res.status(201).json(createdPurchase);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPurchases,
    createPurchase
};
