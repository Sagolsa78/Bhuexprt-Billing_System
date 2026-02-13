const mongoose = require('mongoose');

const vendorSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },

    // Statutory Details
    gstin: { type: String, unique: true, sparse: true },
    pan: { type: String },
    state: { type: String },
    stateCode: { type: String }, // e.g., '27' for Maharashtra

    // Financials
    openingBalance: { type: Number, default: 0 }, // Positive = Payable, Negative = Receivable
    currentBalance: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;
