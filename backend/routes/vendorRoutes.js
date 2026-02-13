const express = require('express');
const router = express.Router();
const {
    getVendors,
    getVendorById,
    createVendor
} = require('../controllers/vendorController');

router.route('/').get(getVendors).post(createVendor);
router.route('/:id').get(getVendorById);

module.exports = router;
