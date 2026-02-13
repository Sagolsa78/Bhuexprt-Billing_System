const Expense = require('../models/Expense');
const multer = require('multer');
const path = require('path');

// Multer config for bill upload
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `expense-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only images and PDFs are allowed'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
});

// @desc    Create new expense (with optional bill attachment)
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res, next) => {
    try {
        const { description, amount, category, vendor, date, paymentMode, notes } = req.body;

        if (!description || !amount || !category) {
            res.status(400);
            throw new Error('Please add all required fields');
        }

        const expenseData = {
            description,
            amount,
            category,
            vendor,
            date: date || Date.now(),
            paymentMode,
            notes
        };

        // If a file is uploaded, store its path
        if (req.file) {
            expenseData.receiptUrl = `/uploads/${req.file.filename}`;
        }

        const expense = await Expense.create(expenseData);
        res.status(201).json(expense);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
    try {
        const pageSize = 20;
        const page = Number(req.query.pageNumber) || 1;
        const keyword = req.query.keyword ? {
            description: {
                $regex: req.query.keyword,
                $options: 'i'
            }
        } : {};

        const count = await Expense.countDocuments({ ...keyword });
        const expenses = await Expense.find({ ...keyword })
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ date: -1 });

        res.json({ expenses, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (expense) {
            await expense.deleteOne();
            res.json({ message: 'Expense removed' });
        } else {
            res.status(404);
            throw new Error('Expense not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get Expense Stats (Monthly)
// @route   GET /api/expenses/stats
// @access  Private
const getExpenseStats = async (req, res, next) => {
    try {
        const stats = await Expense.aggregate([
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        year: { $year: "$date" }
                    },
                    totalExpense: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } }
        ]);
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createExpense,
    getExpenses,
    deleteExpense,
    getExpenseStats,
    upload
};
