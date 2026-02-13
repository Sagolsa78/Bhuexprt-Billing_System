const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
        // enum: ['Rent', 'Salaries', 'Utilities', 'Maintenance', 'Office Supplies', 'Marketing', 'Other'] // Optional: restrict categories or keep open
    },
    vendor: {
        type: String, // Who was paid?
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    paymentMode: {
        type: String,
        enum: ['CASH', 'UPI', 'BANK', 'CHEQUE', 'CARD'],
        default: 'CASH'
    },
    receiptUrl: {
        type: String, // URL/Path to uploaded file
        required: false
    },
    notes: String
}, {
    timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
