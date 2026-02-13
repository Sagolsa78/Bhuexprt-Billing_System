const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const Invoice = require('./models/Invoice');

dotenv.config();

const importData = async () => {
    try {
        await connectDB();

        await Invoice.deleteMany();
        await Product.deleteMany();
        await Customer.deleteMany();

        const createdCustomers = await Customer.insertMany([
            { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
            { name: 'Jane Smith', email: 'jane@example.com', phone: '987-654-3210' },
            { name: 'Acme Corp', email: 'contact@acme.com', phone: '555-555-5555' },
        ]);

        const createdProducts = await Product.insertMany([
            { name: 'Web Development', price: 1000, taxRate: 0.18 },
            { name: 'SEO Optimization', price: 500, taxRate: 0.18 },
            { name: 'Hosting (1 Year)', price: 120, taxRate: 0.18 },
        ]);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
}

importData();
