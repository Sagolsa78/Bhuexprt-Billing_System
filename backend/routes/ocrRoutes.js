const express = require('express');
const router = express.Router();
const { upload, scanInvoice } = require('../controllers/ocrController');
const { protect } = require('../middleware/authMiddleware');

router.post('/scan', upload.single('invoice'), protect, scanInvoice);

module.exports = router;
