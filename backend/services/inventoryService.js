const Inventory = require('../models/Inventory');
const StockTransaction = require('../models/StockTransaction');
const Product = require('../models/Product');
const mongoose = require('mongoose');

class InventoryService {
    /**
     * Add stock to a warehouse
     * @param {string} productId 
     * @param {string} warehouseId 
     * @param {number} quantity 
     * @param {string} reason (PURCHASE, PRODUCTION, ADJUSTMENT, RETURN)
     * @param {string} referenceDocument 
     * @param {string} userId 
     * @param {string} batchNumber 
     * @param {Date} expiryDate 
     */
    async addStock(productId, warehouseId, quantity, reason, referenceDocument, userId, batchNumber = null, expiryDate = null) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Update Inventory ID
            let inventory = await Inventory.findOne({
                product: productId,
                warehouse: warehouseId,
                batchNumber: batchNumber
            }).session(session);

            if (inventory) {
                inventory.quantity += Number(quantity);
                await inventory.save({ session });
            } else {
                inventory = await Inventory.create([{
                    product: productId,
                    warehouse: warehouseId,
                    quantity: Number(quantity),
                    batchNumber: batchNumber,
                    expiryDate: expiryDate
                }], { session });
                inventory = inventory[0];
            }

            // 2. Create Audit Log (StockTransaction)
            await StockTransaction.create([{
                product: productId,
                warehouse: warehouseId,
                type: 'IN',
                reason: reason,
                quantity: Number(quantity),
                balanceAfter: inventory.quantity,
                referenceDocument: referenceDocument,
                user: userId
            }], { session });

            await session.commitTransaction();
            session.endSession();
            return inventory;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    /**
     * Remove stock from a warehouse
     * @param {string} productId 
     * @param {string} warehouseId 
     * @param {number} quantity 
     * @param {string} reason (SALE, PRODUCTION, ADJUSTMENT, TRANSFER)
     * @param {string} referenceDocument 
     * @param {string} userId 
     * @param {string} batchNumber 
     */
    async removeStock(productId, warehouseId, quantity, reason, referenceDocument, userId, batchNumber = null) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Check Stock Availability
            const query = { product: productId, warehouse: warehouseId };
            if (batchNumber) query.batchNumber = batchNumber;

            const inventory = await Inventory.findOne(query).session(session);

            if (!inventory || inventory.quantity < quantity) {
                throw new Error(`Insufficient stock for product ${productId} in warehouse ${warehouseId}`);
            }

            // 2. Deduct Stock
            inventory.quantity -= Number(quantity);
            await inventory.save({ session });

            // 3. Create Audit Log
            await StockTransaction.create([{
                product: productId,
                warehouse: warehouseId,
                type: 'OUT',
                reason: reason,
                quantity: Number(quantity),
                balanceAfter: inventory.quantity,
                referenceDocument: referenceDocument,
                user: userId
            }], { session });

            await session.commitTransaction();
            session.endSession();
            return inventory;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async getStockLevel(productId, warehouseId = null) {
        const query = { product: productId };
        if (warehouseId) query.warehouse = warehouseId;

        const inventory = await Inventory.find(query);
        const total = inventory.reduce((acc, item) => acc + item.quantity, 0);
        return { total, details: inventory };
    }
}

module.exports = new InventoryService();
