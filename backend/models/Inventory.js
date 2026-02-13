const mongoose = require('mongoose');

const inventorySchema = mongoose.Schema({
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
    quantity: { type: Number, required: true, default: 0 },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    location: { type: String } // e.g., 'Rack-A1'
}, {
    timestamps: true
});

// Composite index to ensure unique product storage per warehouse/batch
inventorySchema.index({ product: 1, warehouse: 1, batchNumber: 1 }, { unique: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
