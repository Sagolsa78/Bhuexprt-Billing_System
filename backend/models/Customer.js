const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            unique: true
        },
        phone: {
            type: String,
            required: true,
        },
        gstNumber: String,
        address: String,
        state: {
            type: String,
            required: true,
            default: 'Maharashtra'
        },
        stateCode: {
            type: String,
            required: true,
            default: '27'
        },
        creditLimit: {
            type: Number,
            default: 0,
        },
        outstandingBalance: {
            type: Number,
            default: 0,
        },
        notes: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
