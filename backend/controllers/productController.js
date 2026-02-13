const Product = require('../models/Product');

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Protected (Admin)
 */
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            sku,
            hsnCode,
            price,
            taxRate,
            uom,
            category,
            description,
            minStockLevel,
            maxStockLevel,
            currentStock,
            dimensions
        } = req.body;

        // ===== 1. Validation =====
        if (!name || price === undefined || taxRate === undefined) {
            return res.status(400).json({
                success: false,
                message: "Name, Price and Tax Rate are required"
            });
        }

        if (price < 0) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be negative"
            });
        }

        if (taxRate < 0 || taxRate > 1) {
            return res.status(400).json({
                success: false,
                message: "Tax rate must be between 0 and 1 (e.g. 0.18)"
            });
        }

        // ===== 2. Check duplicate SKU if provided =====
        let finalSku = sku;
        if (finalSku) {
            const existingProduct = await Product.findOne({ sku: finalSku });
            if (existingProduct) {
                return res.status(400).json({
                    success: false,
                    message: "SKU already exists. Please use unique SKU."
                });
            }
        } else {
            // Auto-generate SKU
            finalSku = `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        // ===== 3. Create product =====
        const product = new Product({
            name: name.trim(),
            sku: finalSku,
            hsnCode: hsnCode?.trim() || "",
            price,
            taxRate,
            uom: uom || "PCS",
            category: category?.trim() || "General",
            description: description?.trim() || "",
            minStockLevel: minStockLevel || 0,
            maxStockLevel: maxStockLevel || 100,
            currentStock: currentStock || 0,
            dimensions: {
                length: dimensions?.length || 0,
                width: dimensions?.width || 0,
                height: dimensions?.height || 0,
                weight: dimensions?.weight || 0
            },
            createdBy: req.user ? req.user._id : null
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });

    } catch (error) {
        console.error("Create Product Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while creating product"
        });
    }
};


/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public / Protected
 */
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .sort({ createdAt: -1 });

        res.status(200).json(products);

    } catch (error) {
        console.error("Get Products Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching products"
        });
    }
};


/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Protected (Admin)
 */
exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct
        });

    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating product"
        });
    }
};


/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Protected (Admin)
 */
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting product"
        });
    }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public / Protected
 */
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json(product);

    } catch (error) {
        console.error("Get Product By ID Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching product"
        });
    }
};
