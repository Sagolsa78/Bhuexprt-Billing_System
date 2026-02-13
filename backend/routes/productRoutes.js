const express = require('express');
const router = express.Router();
const {
    getProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    bulkCreateProducts
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// router.route('/bulk').post(protect, bulkCreateProducts);
router.route('/')
    .get(protect,getProducts)
    .post(protect, createProduct);

router.route('/:id')
    .get(protect,getProductById)
    .put(protect, updateProduct)
    .delete(protect, deleteProduct);


module.exports = router;
