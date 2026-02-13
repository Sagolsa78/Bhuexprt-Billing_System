const express = require('express');
const router = express.Router();
const {
    getStockLevel,
    adjustStock,
    getStockHistory,
    getWarehouses,
    createWarehouse
} = require('../controllers/inventoryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/warehouses').get(protect, getWarehouses).post(protect, admin, createWarehouse);
router.route('/adjust').post(protect, admin, adjustStock);
router.route('/:productId').get(protect, getStockLevel);
router.route('/history/:productId').get(protect, getStockHistory);

module.exports = router;
