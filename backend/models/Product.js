const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    // Existing fields (Backward Compatibility)
    name: { type: String, required: true },
    price: { type: Number, required: true },
    taxRate: { type: Number, required: true, default: 0 },

    // ERP Extension Fields
    sku: { type: String, unique: true, sparse: true }, // Sparse allows null/undefined for existing records
    hsnCode: { type: String },
    description: { type: String },
    category: { type: String },
    uom: { type: String, default: 'PCS' }, // Unit of Measure

    // Inventory Constraints
    minStockLevel: { type: Number, default: 0 },
    maxStockLevel: { type: Number },
    currentStock: { type: Number, default: 0 },

    // Dimensions for Logistics
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        weight: Number
    },

    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
