const mongoose = require('mongoose');

const invoiceSchema = mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, required: false, ref: 'Customer' },
    customerName: { type: String, required: false },
    customerEmail: { type: String, required: false },
    customerAddress: { type: String, required: false },
    customerMobile: { type: String, required: false, match: [/^\+?\d{10,15}$/, "Mobile number must be between 10 and 15 digits"], },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product' },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            taxRate: { type: Number, required: true, default: 0.18 }, // GST Rate (e.g., 18%)
            hsnCode: { type: String }, // NEW: HSN Code for items
            gstAmount: { type: Number, default: 0 }, // NEW: Tax amount for this item
        }
    ],
    // Monetary Details
    subtotal: { type: Number, required: true }, // Taxable Amount
    tax: { type: Number, required: true }, // Total Tax
    total: { type: Number, required: true }, // Grand Total (Subtotal + Tax)

    // GST Breakdown (NEW)
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },

    // Customer/invoice Details (NEW)
    gstin: { type: String }, // Customer GSTIN
    placeOfSupply: { type: String }, // State Code
    invoiceType: { type: String, default: 'B2C', enum: ['B2B', 'B2C', 'EXPORT'] }, // NEW

    amountPaid: { type: Number, required: true, default: 0 },
    balanceDue: { type: Number, required: true, default: function () { return this.total; } },
    status: { type: String, required: true, default: 'UNPAID', enum: ['PAID', 'UNPAID', 'PARTIAL'] },
}, {
    timestamps: true,
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
