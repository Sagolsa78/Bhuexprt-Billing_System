const express = require('express');
const router = express.Router();
const {
    createExpense,
    getExpenses,
    deleteExpense,
    getExpenseStats,
    upload
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getExpenses).post(protect, upload.single('receipt'), createExpense);
router.route('/stats').get(protect, getExpenseStats);
router.route('/:id').delete(protect, deleteExpense);

module.exports = router;
