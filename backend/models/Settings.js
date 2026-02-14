const mongoose = require("mongoose");

const settingsSchema = mongoose.Schema(
  {
    companyName: { type: String, required: true, default: "My Company" },
    companyAddress: {
      type: String,
      required: true,
      default: "123 Main St, City, Country",
    },
    companyEmail: {
      type: String,
      required: true,
      default: "info@mycompany.com",
    },
    companyPhone: { type: String, required: true, default: "9999999999" },
    gstNumber: { type: String, default: "" },
    logoUrl: { type: String, default: "" }, // URL to uploaded logo
    invoiceFooter: { type: String, default: "Thank you for your business!" },
    defaultTaxRate: { type: Number, default: 0.18 },
  },
  {
    timestamps: true,
  },
);

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
