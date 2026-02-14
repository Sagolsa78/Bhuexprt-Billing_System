const {
  _extractLineItems,
  _parseAmount,
} = require("./backend/controllers/ocrController");

// Mock the problematic line
const line = "2 Pet Pattern - Lavender 25 Kg 25081090 5 % 1 NOS 809.52 809.52";
const multiLines = `
Sl No Description HSN/SAC Rated Qty Rate Amount
1 Pet Pattern 5 Kg 25081090 5 % 5 NOS 171.43 857.15
2 Pet Pattern - Lavender 25 Kg 25081090 5 % 1 NOS 809.52 809.52
`;

console.log("Processing lines...");
const items = _extractLineItems(multiLines);
console.log("Extracted Items:", JSON.stringify(items, null, 2));

function parseAmount(str) {
  if (!str) return 0;
  const clean = str.replace(/[₹$,\s]/g, "").replace(/Rs\.?\s*/gi, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
