const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = '123456';

async function verifyERP() {
    try {
        console.log('--- ERP Verification Started ---');

        // 1. Login to get token
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/users/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('   Success! Token received.');

        // 2. Create Warehouse
        console.log('2. Creating Warehouse...');
        const warehouseData = {
            name: 'Main Warehouse ' + Date.now(),
            address: { street: '123 Test St', city: 'Test City', state: 'TS', zip: '12345' },
            type: 'Main'
        };
        const whRes = await axios.post(`${API_URL}/inventory/warehouses`, warehouseData, config);
        const warehouseId = whRes.data._id;
        console.log(`   Success! Warehouse created: ${warehouseId}`);

        // 3. Create/Get Product
        console.log('3. Fetching Products...');
        const productsRes = await axios.get(`${API_URL}/products`);
        let productId;
        if (productsRes.data.length > 0) {
            productId = productsRes.data[0]._id;
            console.log(`   Found existing product: ${productId}`);
        } else {
            console.log('   No products found, creating one...');
            const prodRes = await axios.post(`${API_URL}/products`, {
                name: 'Test Product ERP',
                price: 100,
                taxRate: 18
            }, config);
            productId = prodRes.data._id;
        }

        // 4. Update Product with ERP fields
        console.log('4. Updating Product with SKU/HSN...');
        const updateData = {
            sku: 'SKU-' + Date.now(),
            hsnCode: '12345678',
            dimensions: { length: 10, width: 5, height: 2, weight: 1 }
        };
        await axios.put(`${API_URL}/products/${productId}`, updateData, config);
        console.log('   Success! Product updated.');

        // 5. Add Stock (IN)
        console.log('5. Adding Stock...');
        const stockData = {
            productId,
            warehouseId,
            quantity: 50,
            type: 'IN',
            reason: 'PURCHASE',
            referenceDocument: 'PO-1001',
            batchNumber: 'BATCH-001'
        };
        await axios.post(`${API_URL}/inventory/adjust`, stockData, config);
        console.log('   Success! Stock added.');

        // 6. Verify Stock Level
        console.log('6. Verifying Stock Level...');
        const levelRes = await axios.get(`${API_URL}/inventory/${productId}?warehouseId=${warehouseId}`, config);
        console.log(`   Current Stock: ${levelRes.data.total}`);
        if (levelRes.data.total !== 50) throw new Error('Stock level mismatch!');

        // 7. Verify Audit Log
        console.log('7. Verifying Audit Log...');
        const historyRes = await axios.get(`${API_URL}/inventory/history/${productId}`, config);
        if (historyRes.data.length === 0) throw new Error('No audit log found!');
        console.log(`   Audit Log Entry: ${historyRes.data[0].reason} - ${historyRes.data[0].quantity} Qty`);

        console.log('--- ERP Verification Passed Successfully ---');

    } catch (error) {
        console.error('--- Verification Failed ---');
        console.error(error.response ? error.response.data : error.message);
    }
}

verifyERP();
