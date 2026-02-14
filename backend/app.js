const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const logger = require("./config/logger");

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Logging Middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

app.use(express.json());
app.use(cors());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/users", require("./routes/authRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/quotations", require("./routes/quotationRoutes"));
app.use("/api/purchases", require("./routes/purchaseRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/ocr", require("./routes/ocrRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
