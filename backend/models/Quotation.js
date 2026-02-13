const mongoose = require('mongoose');

const quotationSchema = mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Customer' },
    customerName: { type: String, required: false },
    customerEmail: { type: String },
    customerAddress: { type: String },
    customerMobile: { type: String },

    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }, // Unit Price
            taxRate: { type: Number, required: true, default: 0.18 },
            hsnCode: { type: String },
            gstAmount: { type: Number, default: 0 },
        }
    ],

    // Monetary Details
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },

    // GST Breakdown
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },

    validUntil: { type: Date, required: true },
    status: {
        type: String,
        default: 'PENDING',
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CONVERTED']
    },
    convertedInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' } // Reference if converted
}, {
    timestamps: true,
});

const Quotation = mongoose.model('Quotation', quotationSchema);

module.exports = Quotation;
