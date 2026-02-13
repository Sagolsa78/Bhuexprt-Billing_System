const InventoryService = require('../services/inventoryService');
const StockTransaction = require('../models/StockTransaction');
const Warehouse = require('../models/Warehouse');

// @desc    Get stock level for a product
// @route   GET /api/inventory/:productId
// @access  Private
const getStockLevel = async (req, res, next) => {
    try {
        const stock = await InventoryService.getStockLevel(req.params.productId, req.query.warehouseId);
        res.json(stock);
    } catch (error) {
        next(error);
    }
};

// @desc    Adjust stock (Add/Remove)
// @route   POST /api/inventory/adjust
// @access  Private/Admin
const adjustStock = async (req, res, next) => {
    try {
        const { productId, warehouseId, quantity, type, reason, referenceDocument, batchNumber, expiryDate } = req.body;
        const userId = req.user._id;

        if (type === 'IN') {
            const inventory = await InventoryService.addStock(
                productId, warehouseId, quantity, reason, referenceDocument, userId, batchNumber, expiryDate
            );
            res.status(200).json(inventory);
        } else if (type === 'OUT') {
            const inventory = await InventoryService.removeStock(
                productId, warehouseId, quantity, reason, referenceDocument, userId, batchNumber
            );
            res.status(200).json(inventory);
        } else {
            res.status(400);
            throw new Error('Invalid adjustment type. Use IN or OUT.');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get stock transaction history
// @route   GET /api/inventory/history/:productId
// @access  Private
const getStockHistory = async (req, res, next) => {
    try {
        const history = await StockTransaction.find({ product: req.params.productId })
            .populate('warehouse', 'name')
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all warehouses
// @route   GET /api/inventory/warehouses
// @access  Private
const getWarehouses = async (req, res, next) => {
    try {
        const warehouses = await Warehouse.find({ isActive: true });
        res.json(warehouses);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a warehouse
// @route   POST /api/inventory/warehouses
// @access  Private/Admin
const createWarehouse = async (req, res, next) => {
    try {
        const warehouse = await Warehouse.create(req.body);
        res.status(201).json(warehouse);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStockLevel,
    adjustStock,
    getStockHistory,
    getWarehouses,
    createWarehouse
};
