const Invoice = require("../models/Invoice");
const Expense = require("../models/Expense");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const nodemailer = require("nodemailer");

// @desc    Get Dashboard Stats (Cards)
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total Receivables (Unpaid Invoices)
    const receivables = await Invoice.aggregate([
      { $match: { status: { $in: ["PENDING", "PARTIAL"] } } },
      { $group: { _id: null, total: { $sum: "$balanceDue" } } },
    ]);

    // 2. Total Sales (All Time)
    const sales = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    // 3. Total Expenses (All Time)
    const expenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // 4. Monthly Profit (Current Month)
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    const monthlySales = await Invoice.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    const monthlyExpenses = await Expense.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      totalReceivables: receivables[0]?.total || 0,
      totalSales: sales[0]?.total || 0,
      totalExpenses: expenses[0]?.total || 0,
      netProfit:
        (monthlySales[0]?.total || 0) - (monthlyExpenses[0]?.total || 0),
      monthlyRevenue: monthlySales[0]?.total || 0,
      monthlyExpense: monthlyExpenses[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Sales Report (with optional date filter)
// @route   GET /api/reports/sales?startDate=&endDate=
// @access  Private
const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let matchFilter = {};
    if (startDate && endDate) {
      matchFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        },
      };
    } else {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      matchFilter = { createdAt: { $gte: sixMonthsAgo } };
    }

    const sales = await Invoice.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalSales: { $sum: "$total" },
          totalTax: { $sum: "$tax" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Format for Frontend Chart
    const formattedSales = sales.map((item) => {
      const date = new Date(item._id.year, item._id.month - 1);
      return {
        name: date.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        }),
        Sales: item.totalSales,
        Tax: item.totalTax,
        Orders: item.count,
      };
    });

    res.json(formattedSales);
  } catch (error) {
    next(error);
  }
};

// @desc    Get P&L Report (Revenue vs Expense)
// @route   GET /api/reports/pnl
// @access  Private
const getPnLReport = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const sales = await Invoice.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalSales: { $sum: "$total" },
        },
      },
    ]);

    const expenses = await Expense.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          totalExpense: { $sum: "$amount" },
        },
      },
    ]);

    const merged = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const monthName = d.toLocaleString("default", { month: "short" });

      const s = sales.find((x) => x._id.month === month && x._id.year === year);
      const e = expenses.find(
        (x) => x._id.month === month && x._id.year === year,
      );

      merged.push({
        name: monthName,
        Revenue: s?.totalSales || 0,
        Expense: e?.totalExpense || 0,
        Profit: (s?.totalSales || 0) - (e?.totalExpense || 0),
      });
    }

    res.json(merged);
  } catch (error) {
    next(error);
  }
};

// @desc    Get GST Report (Tax breakdown by month)
// @route   GET /api/reports/gst?startDate=&endDate=
// @access  Private
const getGSTReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let matchFilter = {};
    if (startDate && endDate) {
      matchFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        },
      };
    } else {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      matchFilter = { createdAt: { $gte: sixMonthsAgo } };
    }

    const gstData = await Invoice.aggregate([
      { $match: matchFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          taxableAmount: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          totalTax: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity", "$items.taxRate"],
            },
          },
          invoiceCount: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 1,
          taxableAmount: 1,
          totalTax: 1,
          cgst: { $divide: ["$totalTax", 2] },
          sgst: { $divide: ["$totalTax", 2] },
          invoiceCount: { $size: "$invoiceCount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    const formatted = gstData.map((item) => {
      const date = new Date(item._id.year, item._id.month - 1);
      return {
        month: date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        taxableAmount: Math.round(item.taxableAmount * 100) / 100,
        cgst: Math.round(item.cgst * 100) / 100,
        sgst: Math.round(item.sgst * 100) / 100,
        totalTax: Math.round(item.totalTax * 100) / 100,
        totalWithTax:
          Math.round((item.taxableAmount + item.totalTax) * 100) / 100,
        invoiceCount: item.invoiceCount,
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Product Sales Report
// @route   GET /api/reports/product-sales
// @access  Private
const getProductSalesReport = async (req, res, next) => {
  try {
    const productSales = await Invoice.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          totalTax: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity", "$items.taxRate"],
            },
          },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productName: { $ifNull: ["$product.name", "Deleted Product"] },
          sku: "$product.sku",
          totalQty: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] },
          totalTax: { $round: ["$totalTax", 2] },
          orderCount: 1,
          currentStock: "$product.currentStock",
        },
      },
    ]);

    res.json(productSales);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Low Stock Report
// @route   GET /api/reports/low-stock
// @access  Private
const getLowStockReport = async (req, res, next) => {
  try {
    const lowStockProducts = await Product.find({
      isActive: true,
      $expr: { $lte: ["$currentStock", "$minStockLevel"] },
    })
      .select(
        "name sku currentStock minStockLevel maxStockLevel category price",
      )
      .sort({ currentStock: 1 });

    res.json(lowStockProducts);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Customer Outstanding Report
// @route   GET /api/reports/customer-outstanding
// @access  Private
const getCustomerOutstandingReport = async (req, res, next) => {
  try {
    // Get outstanding from invoices with a customerId (linked customers)
    const linkedOutstanding = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ["UNPAID", "PARTIAL"] },
          customerId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$customerId",
          totalDue: { $sum: "$balanceDue" },
          totalInvoiceAmount: { $sum: "$total" },
          invoiceCount: { $sum: 1 },
          oldestInvoice: { $min: "$createdAt" },
        },
      },
      { $sort: { totalDue: -1 } },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          customerName: { $ifNull: ["$customer.name", "Unknown Customer"] },
          email: "$customer.email",
          phone: "$customer.phone",
          totalDue: { $round: ["$totalDue", 2] },
          totalInvoiceAmount: { $round: ["$totalInvoiceAmount", 2] },
          invoiceCount: 1,
          oldestInvoice: 1,
          daysPending: {
            $divide: [{ $subtract: [new Date(), "$oldestInvoice"] }, 86400000],
          },
        },
      },
    ]);

    // Get outstanding from walk-in invoices (no customerId) grouped by customerName
    const walkInOutstanding = await Invoice.aggregate([
      { $match: { status: { $in: ["UNPAID", "PARTIAL"] }, customerId: null } },
      {
        $group: {
          _id: "$customerName",
          totalDue: { $sum: "$balanceDue" },
          totalInvoiceAmount: { $sum: "$total" },
          invoiceCount: { $sum: 1 },
          oldestInvoice: { $min: "$createdAt" },
          email: { $first: "$customerEmail" },
          phone: { $first: "$customerMobile" },
        },
      },
      { $sort: { totalDue: -1 } },
      {
        $project: {
          customerName: { $ifNull: ["$_id", "Unknown Customer"] },
          email: 1,
          phone: 1,
          totalDue: { $round: ["$totalDue", 2] },
          totalInvoiceAmount: { $round: ["$totalInvoiceAmount", 2] },
          invoiceCount: 1,
          oldestInvoice: 1,
          daysPending: {
            $divide: [{ $subtract: [new Date(), "$oldestInvoice"] }, 86400000],
          },
        },
      },
    ]);

    res.json([...linkedOutstanding, ...walkInOutstanding]);
  } catch (error) {
    next(error);
  }
};

const sendReminder = async (req, res, next) => {
  try {
    const { email, customerName, amount, totalDue } = req.body;
    console.log(email, customerName, amount, totalDue);

    if (!email) {
      res.status(400);
      throw new Error("Debtor does not have an email address");
    }

    const finalAmount = amount || totalDue;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"BhuExpert" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Payment Reminder",
      html: `
                <h3>Hello ${customerName},</h3>
                <p>This is a friendly reminder that you have an outstanding balance of <strong>₹${finalAmount}</strong>.</p>
                <p>Please make the payment at your earliest convenience.</p>
                <br/>
                <p>Thank you,<br/>BhuExpert Team</p>
            `,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getSalesReport,
  getPnLReport,
  getGSTReport,
  getProductSalesReport,
  getLowStockReport,
  getCustomerOutstandingReport,
  sendReminder,
};
