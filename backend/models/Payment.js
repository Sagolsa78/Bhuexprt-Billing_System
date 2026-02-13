const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Invoice'
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Customer'
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    paymentMode: {
        type: String,
        required: true,
        enum: ['CASH', 'UPI', 'BANK', 'CHEQUE']
    },
    reference: {
        type: String,
        required: false
    },
    notes: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
