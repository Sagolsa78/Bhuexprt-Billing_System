const mongoose = require('mongoose');

const warehouseSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String
    },
    type: {
        type: String,
        enum: ['Main', 'Store', 'Scrap', 'Virtual'],
        default: 'Main'
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;
