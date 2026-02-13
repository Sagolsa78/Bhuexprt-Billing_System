const mongoose = require('mongoose');

const purchaseSchema = mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Vendor' },
    vendorName: { type: String }, // Snapshot for history
    vendorGstin: { type: String },

    invoiceNumber: { type: String, required: true }, // Vendor's Invoice Number
    invoiceDate: { type: Date, required: true },

    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
            quantity: { type: Number, required: true },
            purchasePrice: { type: Number, required: true }, // Cost Price
            taxRate: { type: Number, default: 0 },
            hsnCode: { type: String },
            taxAmount: { type: Number, default: 0 },
            total: { type: Number, required: true }
        }
    ],

    totalAmount: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    grandTotal: { type: Number, required: true },

    status: { type: String, default: 'RECEIVED', enum: ['PENDING', 'RECEIVED', 'RETURNED'] },
    notes: { type: String }
}, {
    timestamps: true,
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;
