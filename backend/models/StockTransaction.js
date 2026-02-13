const mongoose = require('mongoose');

const stockTransactionSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    type: {
        type: String,
        enum: ['IN', 'OUT'],
        required: true
    },
    reason: {
        type: String,
        enum: ['PURCHASE', 'SALE', 'PRODUCTION', 'ADJUSTMENT', 'TRANSFER', 'RETURN'],
        required: true
    },
    quantity: { type: Number, required: true },
    balanceAfter: { type: Number, required: true }, // Audit snapshot
    referenceDocument: { type: String }, // Invoice ID, PO ID, etc.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    description: { type: String }
}, {
    timestamps: true
});

const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);

module.exports = StockTransaction;
