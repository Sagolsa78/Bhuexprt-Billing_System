const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
    console.log('🔄 Starting Integration Tests...');

    try {
        // 0. Login to get Token
        console.log('\nTesting Authentication...');
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/users/login`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            token = loginRes.data.token;
            console.log('✅ Logged in successfully. Token received.');
        } catch (e) {
            console.log('⚠️ Login failed, trying to register admin...');
            // Try to register if login fails
            const regRes = await axios.post(`${API_URL}/users`, {
                name: 'Admin User',
                email: 'admin@test.com',
                password: 'password123'
            });
            token = regRes.data.token;
            console.log('✅ Registered successfully. Token received.');

            // Make admin
            // Note: In real app, we can't make admin via API easily without database access. 
            // We assume the make_admin.js script was run or the first user is admin (if logic exists).
            // For now, we just need a valid token for protected routes.
        }

        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        // 1. Create a Customer
        console.log('\nTesting Customer Creation...');
        const customer = {
            name: `Test Customer ${Date.now()}`,
            email: `test${Date.now()}@example.com`,
            phone: '1234567890',
            gstNumber: 'GSTIN12345',
            address: '123 Test St, Test City'
        };
        const customerRes = await axios.post(`${API_URL}/customers`, customer, config);
        console.log('✅ Customer Created:', customerRes.data.name);
        const customerId = customerRes.data._id;

        // 1a. Update Customer
        console.log('\nTesting Customer Update...');
        const updateData = {
            name: customer.name + ' (Updated)',
            address: '456 New Address'
        };
        const updateCustomerRes = await axios.put(`${API_URL}/customers/${customerId}`, updateData, config);
        console.log('✅ Customer Updated:', updateCustomerRes.data.name);

        // 1b. Get Customer By ID
        console.log('\nTesting Get Customer By ID...');
        const getCustomerRes = await axios.get(`${API_URL}/customers/${customerId}`, config);
        console.log('✅ Customer Fetched:', getCustomerRes.data._id);


        // 2. Create a Product
        console.log('\nTesting Product Creation...');
        const product = {
            name: `Test Product ${Date.now()}`,
            price: 100,
            taxRate: 0.1
        };
        const productRes = await axios.post(`${API_URL}/products`, product, config);
        console.log('✅ Product Created:', productRes.data.name);
        const productId = productRes.data._id;

        // 3. Create an Invoice
        console.log('\nTesting Invoice Creation...');
        const invoice = {
            customerId,
            items: [
                {
                    productId,
                    quantity: 2,
                    price: 100
                }
            ],
            subtotal: 200,
            tax: 20,
            total: 220
        };
        const invoiceRes = await axios.post(`${API_URL}/invoices`, invoice, config);
        console.log('✅ Invoice Created:', invoiceRes.data._id);
        const invoiceId = invoiceRes.data._id;

        // 4. Get Invoices
        console.log('\nTesting Get Invoices...');
        const invoicesRes = await axios.get(`${API_URL}/invoices`, config);
        console.log(`✅ Fetched ${invoicesRes.data.length} invoices`);

        // 5. Pay Invoice
        console.log('\nTesting Pay Invoice...');
        const payRes = await axios.put(`${API_URL}/invoices/${invoiceId}/pay`, {}, config);
        console.log('✅ Invoice Status updated to:', payRes.data.status);


        // 6. Delete Customer (Cleanup)
        console.log('\nTesting Customer Deletion...');
        await axios.delete(`${API_URL}/customers/${customerId}`, config);
        console.log('✅ Customer Deleted');


        console.log('\n🎉 All API Tests Passed Successfully!');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.response ? error.response.data : error.message);
    }
};

// Wait for server to start
setTimeout(runTests, 3000);
