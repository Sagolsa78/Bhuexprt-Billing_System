const express = require('express');
const router = express.Router();
const {
    getQuotations,
    getQuotationById,
    createQuotation,
    convertToInvoice
} = require('../controllers/quotationController');

router.route('/').get(getQuotations).post(createQuotation);
router.route('/:id').get(getQuotationById);
router.route('/:id/convert').post(convertToInvoice);

module.exports = router;
