const {
  _extractFinancials,
  _extractLineItems,
  _parseAmount,
} = require("./backend/controllers/ocrController");

const sampleText = `
Invoice No: RC251392
Date: 25-12-2025
Vendor: Nu Sigma Enterprises
GSTIN: 09BEBPG4391C1ZR

Description of Goods HSN/SAC Quantity Rate Amount
1 FIT 32 10KG
23091000
1 Pcs.
5,567.033

Taxable Value: 5,292.022
CGST 9%: 476.282
SGST 9%: 476.282
Total Tax: 952.564
Grand Total: 6,245.000
`;

console.log("--- Testing Parse Amount ---");
console.log("5,292.022 ->", _parseAmount("5,292.022"));
console.log("6,245.000 ->", _parseAmount("6,245.000"));

console.log("\n--- Testing Financials Extraction ---");
const financials = _extractFinancials(sampleText);
console.log(financials);

console.log("\n--- Testing Line Item Extraction ---");
const items = _extractLineItems(sampleText);
console.log(items);
