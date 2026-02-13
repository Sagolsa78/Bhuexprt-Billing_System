const Product = require('../models/Product');
const InventoryService = require('./inventoryService');

class ProductService {
    async createProduct(productData) {
        // Validate SKU uniqueness
        if (productData.sku) {
            const existingProduct = await Product.findOne({ sku: productData.sku });
            if (existingProduct) {
                throw new Error(`Product with SKU ${productData.sku} already exists`);
            }
        }

        const product = await Product.create(productData);
        return product;
    }

    async updateProduct(id, updateData) {
        const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    async getProductById(id) {
        const product = await Product.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }
        // Attach current stock level
        const stock = await InventoryService.getStockLevel(id);
        return { ...product.toObject(), currentStock: stock.total };
    }

    async getAllProducts() {
        return await Product.find({ isActive: true });
    }
}

module.exports = new ProductService();
