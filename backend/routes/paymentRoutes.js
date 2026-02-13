const express = require('express');
const router = express.Router();
const {
    createPayment,
    getPayments,
    getPaymentById,
    getPaymentsByInvoice
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createPayment)
    .get(protect, getPayments);

router.route('/:id')
    .get(protect, getPaymentById);

router.route('/invoice/:invoiceId')
    .get(protect, getPaymentsByInvoice);

module.exports = router;
