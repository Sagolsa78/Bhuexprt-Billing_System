const express = require('express');
const router = express.Router();
const {
    getPurchases,
    createPurchase
} = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getPurchases).post(protect, createPurchase);

module.exports = router;
