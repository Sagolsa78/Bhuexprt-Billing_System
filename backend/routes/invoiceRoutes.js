const express = require('express');
const router = express.Router();
const { createInvoice, getInvoicesByCustomer, getInvoices, updateInvoiceToPaid } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createInvoice).get(protect, getInvoices);
router.route('/:customerId').get(protect, getInvoicesByCustomer);
router.route('/:id/pay').put(protect, updateInvoiceToPaid);

module.exports = router;
