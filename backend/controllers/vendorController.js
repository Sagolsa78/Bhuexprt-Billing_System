const Vendor = require('../models/Vendor');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getVendors = async (req, res, next) => {
    try {
        const vendors = await Vendor.find({}).sort({ name: 1 });
        res.json(vendors);
    } catch (error) {
        next(error);
    }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Private
const getVendorById = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (vendor) {
            res.json(vendor);
        } else {
            res.status(404);
            throw new Error('Vendor not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a vendor
// @route   POST /api/vendors
// @access  Private
const createVendor = async (req, res, next) => {
    try {
        const { name, email, phone, address, gstin, pan, state, stateCode, openingBalance } = req.body;

        const vendorExists = await Vendor.findOne({ name });
        if (vendorExists) {
            res.status(400);
            throw new Error('Vendor already exists');
        }

        const vendor = await Vendor.create({
            name,
            email,
            phone,
            address,
            gstin,
            pan,
            state,
            stateCode,
            openingBalance: openingBalance || 0,
            currentBalance: openingBalance || 0
        });

        if (vendor) {
            res.status(201).json(vendor);
        } else {
            res.status(400);
            throw new Error('Invalid vendor data');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVendors,
    getVendorById,
    createVendor
};
