const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getSalesReport,
    getPnLReport,
    getGSTReport,
    getProductSalesReport,
    getLowStockReport,
    getCustomerOutstandingReport,
    sendReminder
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.get('/sales', protect, getSalesReport);
router.get('/pnl', protect, getPnLReport);
router.get('/gst', protect, getGSTReport);
router.get('/product-sales', protect, getProductSalesReport);
router.get('/low-stock', protect, getLowStockReport);
router.get('/customer-outstanding', protect, getCustomerOutstandingReport);
router.post('/send-reminder/:id', protect, sendReminder);

module.exports = router;
