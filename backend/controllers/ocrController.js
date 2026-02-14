const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { PDFParse, VerbosityLevel } = require("pdf-parse");
// const Tesseract = require("tesseract.js");

// Configure multer for PDF upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "..", "uploads", "invoices");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `scan_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only Images (JPG, JPEG, PNG) and PDFs are allowed"));
    }
  },
});

// ─── Helper: Parse Amount ────────────────────────────────────────

function parseAmount(str) {
  if (!str) return 0;
  // Remove currency symbols (₹, $, Rs, Rs.), commas, spaces, and parentheses for negatives
  const clean = str.replace(/[₹$,\s]/g, "").replace(/Rs\.?\s*/gi, "");
  // Handle negative amounts like (-)0.01
  const negMatch = clean.match(/\(?\-?\)?\s*(\d+\.?\d*)/);
  if (negMatch) {
    const num = parseFloat(negMatch[1]);
    if (clean.includes("-") || clean.includes("(")) return -num;
    return isNaN(num) ? 0 : num;
  }
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// ─── GSTIN Extraction ────────────────────────────────────────────

function extractGSTIN(text) {
  // Indian GSTIN format: 2-digit state code + 10-char PAN + 1Z + 1 check digit
  const gstinRegex = /\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d][Z][A-Z\d]/g;
  const matches = text.match(gstinRegex);
  return matches || [];
}

// ─── Invoice Number Extraction ───────────────────────────────────

function extractInvoiceNumber(text) {
  const patterns = [
    /Invoice\s*No\.?\s*[:.]?\s*([A-Za-z0-9\-\/]+(?:\/[A-Za-z0-9\-]+)*)/i,
    /Invoice\s*#\s*[:.]?\s*([A-Za-z0-9\-\/]+)/i,
    /Inv\.?\s*No\.?\s*[:.]?\s*([A-Za-z0-9\-\/]+)/i,
    /Bill\s*No\.?\s*[:.]?\s*([A-Za-z0-9\-\/]+)/i,
    /Ref\.?\s*No\.?\s*[:.]?\s*([A-Za-z0-9\-\/]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

// ─── Date Extraction (supports DD-Mon-YY, DD/MM/YYYY, etc.) ─────

function extractDate(text) {
  const patterns = [
    // "Dated:" or "Date:" followed by DD-Mon-YY or DD-Mon-YYYY  (e.g. 18-Apr-25)
    /(?:Dated?)\s*[:.]?\s*(\d{1,2}[\-\/\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\-\/\s]\d{2,4})/i,
    // DD/MM/YYYY or DD-MM-YYYY
    /(?:Invoice\s*)?(?:Dated?)\s*[:.]?\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    // YYYY-MM-DD
    /(?:Invoice\s*)?(?:Dated?)\s*[:.]?\s*(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
    // DD Month YYYY (e.g. 18 April 2025)
    /(?:Dated?)\s*[:.]?\s*(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
  ];

  const monthMap = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1].trim();

      // Try DD-Mon-YY or DD-Mon-YYYY format first  (e.g. "18-Apr-25")
      const monthNameMatch = raw.match(
        /(\d{1,2})[\-\/\s]+([A-Za-z]+)[\-\/\s]+(\d{2,4})/,
      );
      if (monthNameMatch) {
        const day = parseInt(monthNameMatch[1], 10);
        const monthStr = monthNameMatch[2].toLowerCase();
        let year = parseInt(monthNameMatch[3], 10);
        if (year < 100) year += 2000; // 25 -> 2025

        const monthIdx = monthMap[monthStr];
        if (monthIdx !== undefined && day >= 1 && day <= 31) {
          const m = String(monthIdx + 1).padStart(2, "0");
          const d = String(day).padStart(2, "0");
          return `${year}-${m}-${d}`;
        }
      }

      // Try standard JS Date parsing
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }

      // Try DD/MM/YYYY or DD-MM-YYYY
      const parts = raw.split(/[\/-]/);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        let year = y.length === 2 ? `20${y}` : y;
        const dateStr = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        const parsed2 = new Date(dateStr);
        if (!isNaN(parsed2.getTime())) return dateStr;
      }

      return raw;
    }
  }
  return null;
}

// ─── Vendor Name Extraction ──────────────────────────────────────

function extractVendorName(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2);
  const ignoreWords = [
    "invoice",
    "tax invoice",
    "bill to",
    "ship to",
    "date",
    "page",
    "gst",
    "phone",
    "email",
    "address",
    "order",
    "po ",
    "original",
    "duplicate",
    "copy",
    "buyer",
    "seller",
    "consignee",
    "gstin",
    "state name",
    "e-mail",
    "subject",
  ];

  for (const line of lines.slice(0, 10)) {
    const lower = line.toLowerCase();
    // Skip "Tax Invoice" header line
    if (
      lower === "tax invoice" ||
      lower === "original" ||
      lower === "duplicate"
    )
      continue;
    if (
      !ignoreWords.some((w) => lower.includes(w)) &&
      line.length > 3 &&
      line.length < 80
    ) {
      // Skip lines that are just numbers or dates
      if (/^\d+[\/-]\d+/.test(line)) continue;
      if (/^\d+$/.test(line)) continue;
      // Skip lines that look like addresses (start with number + comma)
      if (/^\d+,/.test(line)) continue;
      return line;
    }
  }
  return null;
}

// ─── Financial Extraction (CGST + SGST + IGST support) ──────────
function extractFinancials(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return {
      subtotal: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      tax: 0,
      roundOff: 0,
      total: 0,
    };
  }

  // ─────────────────────────────────────────────
  // 1️⃣ Normalize Text (CRITICAL for OCR PDFs)
  // ─────────────────────────────────────────────
  let text = rawText
    .replace(/[^\x00-\x7F]/g, " ") // remove weird unicode like ī
    .replace(/\s+/g, " ")
    .replace(/ +\n/g, "\n");

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const result = {
    subtotal: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    tax: 0,
    roundOff: 0,
    total: 0,
  };

  const parseAmount = (val) => {
    if (!val) return 0;
    return parseFloat(val.replace(/,/g, "").replace(/[₹$]/g, "").trim()) || 0;
  };

  const amountPattern = /([\d,]+\.\d{1,2})/;

  // ─────────────────────────────────────────────
  // 2️⃣ Extract CGST / SGST / IGST
  // ─────────────────────────────────────────────
  for (let line of lines) {
    if (/CGST/i.test(line)) {
      const m = line.match(amountPattern);
      if (m) result.cgst = parseAmount(m[1]);
    }

    if (/SGST/i.test(line)) {
      const m = line.match(amountPattern);
      if (m) result.sgst = parseAmount(m[1]);
    }

    if (/IGST/i.test(line)) {
      const m = line.match(amountPattern);
      if (m) result.igst = parseAmount(m[1]);
    }

    if (/round\s*off/i.test(line)) {
      const m = line.match(/-?\d+\.\d{1,2}/);
      if (m) result.roundOff = parseFloat(m[0]);
    }
  }

  // ─────────────────────────────────────────────
  // 3️⃣ Extract Grand Total (robust logic)
  // Handles: "Total 6 NOS 1750.00"
  // ─────────────────────────────────────────────
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];

    if (
      /total/i.test(line) &&
      !/quantity|qty|nos|items|units/i.test(line.toLowerCase())
    ) {
      const m = line.match(/Total.*?([\d,]+\.\d{1,2})/i);
      if (m) {
        result.total = parseAmount(m[1]);
        break;
      }
    }
  }

  // Fallback: pick largest amount in entire document
  if (result.total === 0) {
    let max = 0;
    const matches = text.match(/[\d,]+\.\d{2}/g) || [];
    for (let val of matches) {
      const num = parseAmount(val);
      if (num > max) max = num;
    }
    result.total = max;
  }

  // ─────────────────────────────────────────────
  // 4️⃣ Extract Subtotal (Standalone detection)
  // Your invoice has: "1,666.67"
  // ─────────────────────────────────────────────
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // standalone numeric line
    if (/^[\d,]+\.\d{2}$/.test(line)) {
      const val = parseAmount(line);

      // subtotal should be smaller than total but reasonably large
      if (val > 0 && val < result.total) {
        result.subtotal = val;
        break;
      }
    }

    // labeled subtotal
    if (/subtotal|taxable|base amount/i.test(line)) {
      const m = line.match(amountPattern);
      if (m) {
        result.subtotal = parseAmount(m[1]);
        break;
      }
    }
  }

  // ─────────────────────────────────────────────
  // 5️⃣ Compute Total Tax
  // ─────────────────────────────────────────────
  result.tax = result.cgst + result.sgst + result.igst;

  // If tax missing but total + subtotal present
  if (result.tax === 0 && result.total && result.subtotal) {
    result.tax = result.total - result.subtotal - result.roundOff;
  }

  // If subtotal missing
  if (result.subtotal === 0 && result.total && result.tax) {
    result.subtotal = result.total - result.tax - result.roundOff;
  }

  // ─────────────────────────────────────────────
  // 6️⃣ Final Validation Layer (Industry Standard)
  // ─────────────────────────────────────────────
  const calculatedTotal = result.subtotal + result.tax + result.roundOff;

  if (result.total && Math.abs(calculatedTotal - result.total) > 2) {
    console.warn("⚠ Financial mismatch detected");
  }
  console.log(result);

  return result;
}

// ─── Line Items Extraction (Indian GST format + tabular fallback) ─

function extractLineItems(text) {
  const items = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // ═══════════════════════════════════════════════════════════════
  // STRATEGY 1: Structured multi-line format (Indian GST invoices)
  // Items have labeled fields like:
  //   Product Name
  //   HSN/SAC: 25081090
  //   GST: 5%
  //   Quantity: 5 NOS
  //   Rate: 171.43
  //   Amount: 857.15
  // ═══════════════════════════════════════════════════════════════

  const structuredItems = extractStructuredLineItems(lines);
  if (structuredItems.length > 0) {
    return structuredItems;
  }

  // ═══════════════════════════════════════════════════════════════
  // STRATEGY 2: Tabular format (single-line per item)
  // Description  |  HSN  |  Qty  |  Rate  |  Amount
  // ═══════════════════════════════════════════════════════════════

  return extractTabularLineItems(lines);
}

function extractStructuredLineItems(lines) {
  const items = [];

  // Find regions that look like structured item blocks
  // Key indicators: lines with "HSN/SAC:", "Quantity:", "Rate:", "Amount:"
  let currentItem = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Detect HSN/SAC line — marks the start of item detail fields
    const hsnMatch = line.match(/HSN\s*[\/\\]?\s*SAC\s*[:.]?\s*(\d{4,8})/i);
    if (hsnMatch) {
      if (!currentItem) {
        // Look back 1-3 lines for the item name
        currentItem = {
          name: "",
          hsnCode: hsnMatch[1],
          quantity: 0,
          price: 0,
          total: 0,
          taxRate: 0,
        };
        // Find item name from previous lines (go back until we hit another field or empty)
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          const prevLine = lines[j].trim();
          const prevLower = prevLine.toLowerCase();
          // Stop if we hit another structured field, a footer, or known header
          if (
            /^(hsn|gst|quantity|rate|amount|subtotal|total|cgst|sgst|igst|bank|declaration)/i.test(
              prevLower,
            )
          )
            break;
          if (
            /^(sl\.?\s*no|s\.?\s*no|description|item|particular|product)/i.test(
              prevLower,
            )
          )
            break;

          // Skip purely numeric/symbol lines
          if (/^[\d\s.,\-%]+$/.test(prevLine)) continue;
          // Skip lines that are just units
          if (
            /^(nos|pcs|kg|lbs|mtr|ltr|units|box|set|pairs?|bag|packet|doz|ft|sqft|sqm)\.?$/i.test(
              prevLine,
            )
          )
            continue;

          if (prevLine.length < 2) break;
          // This could be the item name
          currentItem.name =
            prevLine + (currentItem.name ? " " + currentItem.name : "");
        }
        currentItem.name = currentItem.name.trim();
      } else {
        currentItem.hsnCode = hsnMatch[1];
      }
      continue;
    }

    // Detect GST percentage
    const gstMatch = line.match(/GST\s*[:.]?\s*(\d+(?:\.\d+)?)\s*%/i);
    if (gstMatch && currentItem) {
      currentItem.taxRate = parseFloat(gstMatch[1]);
      continue;
    }

    // Detect Quantity
    const qtyMatch = line.match(
      /Quantity\s*[:.]?\s*([\d,]+\.?\d*)\s*(?:NOS|PCS|KG|LTR|MTR|UNITS|BOX|BAGS?|SETS?|PAIRS?)?/i,
    );
    if (qtyMatch && currentItem) {
      currentItem.quantity = parseFloat(qtyMatch[1].replace(/,/g, ""));
      continue;
    }

    // Detect Rate / Unit Price
    const rateMatch = line.match(
      /(?:Rate|Unit\s*Price|Price)\s*[:.]?\s*[₹$]?\s*([\d,]+\.?\d*)/i,
    );
    if (rateMatch && currentItem) {
      currentItem.price = parseAmount(rateMatch[1]);
      continue;
    }

    // Detect Amount / Line Total
    const amtMatch = line.match(/Amount\s*[:.]?\s*[₹$]?\s*([\d,]+\.?\d*)/i);
    if (amtMatch && currentItem) {
      currentItem.total = parseAmount(amtMatch[1]);

      // This typically ends an item block — push and reset
      if (
        currentItem.name &&
        (currentItem.total > 0 || currentItem.price > 0)
      ) {
        // Calculate missing fields
        if (
          currentItem.total === 0 &&
          currentItem.price > 0 &&
          currentItem.quantity > 0
        ) {
          currentItem.total = currentItem.price * currentItem.quantity;
        }
        if (
          currentItem.price === 0 &&
          currentItem.total > 0 &&
          currentItem.quantity > 0
        ) {
          currentItem.price = currentItem.total / currentItem.quantity;
        }
        if (currentItem.quantity === 0) currentItem.quantity = 1;
        items.push({ ...currentItem });
      }
      currentItem = null;
      continue;
    }

    // If we encounter Subtotal/Total/CGST/SGST/Bank, finalize any pending item
    if (
      /^(subtotal|sub\s*total|total|cgst|sgst|igst|bank|declaration|amount\s*in\s*words|less\s*round)/i.test(
        lower,
      )
    ) {
      if (
        currentItem &&
        currentItem.name &&
        (currentItem.total > 0 || currentItem.price > 0)
      ) {
        if (
          currentItem.total === 0 &&
          currentItem.price > 0 &&
          currentItem.quantity > 0
        ) {
          currentItem.total = currentItem.price * currentItem.quantity;
        }
        if (currentItem.quantity === 0) currentItem.quantity = 1;
        items.push({ ...currentItem });
      }
      currentItem = null;
      continue;
    }

    // If we don't have a currentItem yet and this line looks like it could be a product name
    // (not a known field, not a number, reasonable length)
    if (!currentItem && line.length > 3 && line.length < 120) {
      const isField =
        /^(hsn|gst|quantity|rate|amount|subtotal|total|cgst|sgst|igst|bank|declaration|buyer|seller|gstin|state|e-mail|invoice|dated|sl\.?\s*no|s\.?\s*no)/i.test(
          lower,
        );
      const isAddress =
        /^\d+,\s/.test(line) ||
        /pin\s*code/i.test(lower) ||
        /^\d{6}$/.test(line);
      const isHeader =
        /^(description|item|particular|product|qty|quantity|rate|price|amount|total|tax)/i.test(
          lower,
        );

      if (!isField && !isAddress && !isHeader) {
        // Check if next few lines contain structured fields
        let hasStructuredFields = false;
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          if (/^(HSN|GST|Quantity|Rate|Amount)\s*[\/\\:]/i.test(lines[j])) {
            hasStructuredFields = true;
            break;
          }
        }
        if (hasStructuredFields) {
          currentItem = {
            name: line,
            hsnCode: null,
            quantity: 0,
            price: 0,
            total: 0,
            taxRate: 0,
          };
        }
      }
    }
  }

  // Finalize any remaining item
  if (
    currentItem &&
    currentItem.name &&
    (currentItem.total > 0 || currentItem.price > 0)
  ) {
    if (
      currentItem.total === 0 &&
      currentItem.price > 0 &&
      currentItem.quantity > 0
    ) {
      currentItem.total = currentItem.price * currentItem.quantity;
    }
    if (currentItem.quantity === 0) currentItem.quantity = 1;
    items.push({ ...currentItem });
  }

  return items;
}

function extractTabularLineItems(lines) {
  const items = [];

  // Find table header row
  const headerKeywords = [
    "description",
    "item",
    "particular",
    "product",
    "qty",
    "quantity",
    "rate",
    "price",
    "amount",
    "total",
    "hsn",
  ];
  let tableStartIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    const matchCount = headerKeywords.filter((kw) => lower.includes(kw)).length;
    if (matchCount >= 2) {
      tableStartIdx = i;
      break;
    }
  }

  if (tableStartIdx === -1) return items;

  // Footer keywords that end the table
  const footerKeywords = [
    "subtotal",
    "sub total",
    "total tax",
    "grand total",
    "net amount",
    "bank detail",
    "terms",
    "thank you",
    "note:",
    "in words",
    "amount in words",
    "cgst",
    "sgst",
    "igst",
    "declaration",
    "less round",
  ];

  // Check column order in header
  let rateBeforeQty = false;
  if (tableStartIdx !== -1) {
    const headerLine = lines[tableStartIdx].toLowerCase();
    const qtyIdx = headerLine.search(/(qty|quantity)/);
    const rateIdx = headerLine.search(/(rate|price)/);
    if (qtyIdx !== -1 && rateIdx !== -1 && rateIdx < qtyIdx) {
      rateBeforeQty = true;
    }
  }

  for (let i = tableStartIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Stop at footer
    if (footerKeywords.some((kw) => lower.includes(kw))) break;

    // Look for lines with numbers (qty, price, total)
    const nums = line.match(/[\d,]+\.?\d*/g);
    if (!nums || nums.length < 2) continue;

    // Filter out HSN-like codes (4-8 digit codes without decimals that are > 9999)
    const hsnCandidates = [];
    const amountCandidates = [];

    for (const n of nums) {
      const val = parseAmount(n);
      const cleanN = n.replace(/,/g, "");
      // HSN codes: 4-8 digit integers, typically > 9999
      if (
        /^\d{4,8}$/.test(cleanN) &&
        parseInt(cleanN, 10) > 9999 &&
        !cleanN.includes(".")
      ) {
        hsnCandidates.push(n);
      } else if (val > 0) {
        amountCandidates.push({ str: n, val });
      }
    }

    if (amountCandidates.length < 2) continue;

    // ─────────────────────────────────────────────
    // Logic to determine Total, Price, Qty
    // ─────────────────────────────────────────────

    // Default strategy: Largest value is likely the Total
    const sortedByValue = [...amountCandidates].sort((a, b) => b.val - a.val); // Descending
    let total = sortedByValue[0].val;

    // Validation strategy: Look for A * B = C
    // We prioritize the LARGEST 'C' that is a product of two other numbers.
    let foundProductMatch = false;

    // We use a set of values for quick lookup, tolerating small diffs
    const candidateValues = amountCandidates.map((a) => a.val);

    for (const candidateTotal of amountCandidates) {
      const C = candidateTotal.val;
      // Skip if C is small relative to max total (e.g. likely tax/qty)
      if (C < total * 0.1) continue;

      // 1. Check for Qty=1 case (where Price = Total)
      // If we find '1' in the candidates, and C is a reasonable Total
      if (candidateValues.some((v) => Math.abs(v - 1) < 0.01)) {
        // We have a '1'. If C is large, it's a valid Total with Qty=1.
        // We prefer this explanation if C is large.
        if (C >= total) {
          total = C;
          foundProductMatch = true;
        }
      }

      // 2. Check for A * B = C
      for (const candQty of amountCandidates) {
        if (candQty === candidateTotal) continue;
        for (const candPrice of amountCandidates) {
          if (candPrice === candidateTotal || candPrice === candQty) continue;

          const calculated = candQty.val * candPrice.val;
          // Allow small floating point error
          if (Math.abs(calculated - C) < 0.5) {
            // If we found a valid product relationship
            if (Math.abs(C - total) < 0.5) {
              foundProductMatch = true;
            } else if (C > total) {
              // If we found a product that is LARGER result than our naive max
              total = C;
              foundProductMatch = true;
            }
          }
        }
      }
    }

    // Determine Price & Qty based on Total
    let price = 0;
    let qty = 1;

    // Remove the Total from candidates to find Price/Qty
    // Filter out values close to total
    const remaining = amountCandidates.filter(
      (a) => Math.abs(a.val - total) > 0.1,
    );

    // Check if we have '1' in candidates (even if not in remaining, though unlikely if total != 1)
    const hasOne = amountCandidates.some((a) => Math.abs(a.val - 1) < 0.01);

    if (remaining.length >= 2) {
      // Search for pair in remaining that multiplies to Total
      let foundPair = false;
      for (let x of remaining) {
        for (let y of remaining) {
          if (x !== y && Math.abs(x.val * y.val - total) < 0.5) {
            // Found pair. Smaller is typically Qty (unless price < 1)
            // Prioritize integer as Qty
            const xInt = Number.isInteger(x.val);
            const yInt = Number.isInteger(y.val);

            if (xInt && !yInt) {
              qty = x.val;
              price = y.val;
            } else if (yInt && !xInt) {
              qty = y.val;
              price = x.val;
            } else if (x.val < y.val) {
              qty = x.val;
              price = y.val;
            } else {
              qty = y.val;
              price = x.val;
            }
            foundPair = true;
            break;
          }
        }
        if (foundPair) break;
      }

      if (!foundPair) {
        // Fallback to Qty=1 if "1" is present
        if (hasOne) {
          qty = 1;
          price = total;
        } else {
          // Fallback: column order
          if (rateBeforeQty) {
            // Rate | Qty
            price = remaining[0].val;
            qty = remaining[1].val;
          } else {
            // Qty | Rate
            qty = remaining[0].val;
            price =
              remaining.length > 1
                ? remaining[remaining.length - 1].val
                : total;
          }
        }
      }
    } else if (remaining.length === 1) {
      const val = remaining[0].val;

      // If "1" is present in FULL candidates list
      if (Math.abs(val - 1) < 0.01) {
        qty = 1;
        price = total;
      } else if (hasOne) {
        qty = 1;
        price = total;
      } else {
        // Try to guess from remaining value
        if (val < 100 && Number.isInteger(val)) {
          qty = val;
          price = total / qty;
        } else {
          price = val;
          qty = total / price;
        }
      }
    } else {
      // Only Total found (or filtered out).
      if (hasOne) {
        qty = 1;
        price = total;
      } else {
        price = total;
        qty = 1;
      }
    }

    // ─────────────────────────────────────────────
    // Clean Description (Remove numbers AND units)
    // ─────────────────────────────────────────────
    let description = line;
    for (const n of nums) {
      description = description.replace(n, "");
    }

    // Remove Currency Symbols & Extra Spaces
    description = description.replace(/[₹$|]/g, "");

    // Remove Units (Case insensitive, whole word)
    const unitRegex =
      /\b(nos|pcs|kg|lbs|mtr|ltr|units|box|set|pairs?|bag|packet|doz|ft|sqft|sqm)\b/gi;
    description = description.replace(unitRegex, "");

    // Remove Percentage symbols and isolated chars
    description = description.replace(/%/g, "").replace(/\s+/g, " ").trim();

    // Remove leading/trailing non-alphanumeric
    description = description.replace(/^[\s\-\.:,]+|[\s\-\.:,]+$/g, "");

    if (description.length < 2) description = `Item ${items.length + 1}`;

    // Try to detect tax rate from context (e.g. "5%")
    let taxRate = 0;
    const taxRateMatch = line.match(/(\d+(?:\.\d+)?)\s*%/);
    if (taxRateMatch) {
      taxRate = parseFloat(taxRateMatch[1]);
    }

    // HSN code
    const hsnCode = hsnCandidates.length > 0 ? hsnCandidates[0] : null;

    items.push({
      name: description,
      quantity: qty > 10000 ? 1 : qty,
      price: price,
      taxRate: taxRate,
      total: total,
      hsnCode: hsnCode,
    });
    console.log(items);
  }

  return items;
}

// ─── Main Controller ─────────────────────────────────────────────

// @desc    Scan and extract data from uploaded Invoice (PDF or Image)
// @route   POST /api/ocr/scan
// @access  Private
const scanInvoice = async (req, res, next) => {
  let filePath = null;
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    let result = {};

    // ─── 1. Image Processing (JPG/PNG) - Uses Tesseract.js ───
    if ([".jpg", ".jpeg", ".png"].includes(fileExt)) {
      console.log("Processing Image via Tesseract.js...");
      const Tesseract = require("tesseract.js");

      const {
        data: { text },
      } = await Tesseract.recognize(filePath, "eng");
      const rawText = text || "";

      // Extract all data using Regex Logic (Reused from PDF logic)
      const gstins = extractGSTIN(rawText);
      const invoiceNumber = extractInvoiceNumber(rawText);
      const invoiceDate = extractDate(rawText);
      const vendorName = extractVendorName(rawText);
      const financials = extractFinancials(rawText);
      const lineItems = extractLineItems(rawText);

      // Recalculate if missing (Reused from PDF logic)
      if (financials.subtotal === 0 && lineItems.length > 0) {
        financials.subtotal = lineItems.reduce(
          (acc, item) => acc + item.total,
          0,
        );
      }
      if (financials.tax === 0 && lineItems.length > 0) {
        financials.tax = lineItems.reduce((acc, item) => {
          if (item.taxRate > 0) return acc + (item.total * item.taxRate) / 100;
          return acc;
        }, 0);
        financials.tax = Math.round(financials.tax * 100) / 100;
      }
      if (financials.total === 0 && financials.subtotal > 0) {
        financials.total = financials.subtotal + financials.tax;
      }

      result = {
        rawText: rawText.substring(0, 2000),
        invoiceNumber,
        invoiceDate,
        vendorName,
        gstin: gstins[0] || null,
        allGstins: gstins,
        items: lineItems,
        financials: {
          subtotal: financials.subtotal,
          tax: financials.tax,
          cgst: financials.cgst,
          sgst: financials.sgst,
          igst: financials.igst,
          total: financials.total,
        },
      };
    }
    // ─── 2. PDF Processing - Uses pdf-parse (Legacy/Fast) ───
    else if (fileExt === ".pdf") {
      const { PDFParse, VerbosityLevel } = require("pdf-parse");
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({
        data: dataBuffer,
        verbosity: VerbosityLevel.ERRORS,
      });
      const pdfData = await parser.getText();
      const rawText = pdfData.text || "";

      // Extract all data using Regex Logic (Legacy)
      const gstins = extractGSTIN(rawText);
      const invoiceNumber = extractInvoiceNumber(rawText);
      const invoiceDate = extractDate(rawText);
      const vendorName = extractVendorName(rawText);
      const financials = extractFinancials(rawText);
      const lineItems = extractLineItems(rawText);

      // Recalculate if missing
      if (financials.subtotal === 0 && lineItems.length > 0) {
        financials.subtotal = lineItems.reduce(
          (acc, item) => acc + item.total,
          0,
        );
      }
      if (financials.tax === 0 && lineItems.length > 0) {
        financials.tax = lineItems.reduce((acc, item) => {
          if (item.taxRate > 0) return acc + (item.total * item.taxRate) / 100;
          return acc;
        }, 0);
        financials.tax = Math.round(financials.tax * 100) / 100;
      }
      if (financials.total === 0 && financials.subtotal > 0) {
        financials.total = financials.subtotal + financials.tax;
      }

      result = {
        rawText: rawText.substring(0, 2000),
        invoiceNumber,
        invoiceDate,
        vendorName,
        gstin: gstins[0] || null,
        allGstins: gstins,
        items: lineItems,
        financials: {
          subtotal: financials.subtotal,
          tax: financials.tax,
          cgst: financials.cgst,
          sgst: financials.sgst,
          igst: financials.igst,
          total: financials.total,
        },
      };
    } else {
      throw new Error("Unsupported file type");
    }

    // Cleanup uploaded file
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json(result);
  } catch (error) {
    // Cleanup on error
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error("OCR Error:", error);
    res.status(500);
    next(error);
  }
};

module.exports = {
  upload,
  scanInvoice,
  // Export for testing
  _extractDate: extractDate,
  _extractInvoiceNumber: extractInvoiceNumber,
  _extractVendorName: extractVendorName,
  _extractGSTIN: extractGSTIN,
  _extractFinancials: extractFinancials,
  _extractLineItems: extractLineItems,
  _parseAmount: parseAmount,
};
