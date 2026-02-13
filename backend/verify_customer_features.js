const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

const runTests = async () => {
    console.log('🔄 Starting Customer Feature Verification...');

    try {
        // 0. Login to get Token
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/users/login`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            token = loginRes.data.token;
            console.log('✅ Logged in successfully.');
        } catch (e) {
            console.log('⚠️ Login failed, trying to register admin...');
            const uniqueEmail = `admin_${Date.now()}@test.com`;
            const regRes = await axios.post(`${API_URL}/users`, {
                name: 'Admin User',
                email: uniqueEmail,
                password: 'password123'
            });
            token = regRes.data.token;
            console.log('✅ Registered successfully.');
        }

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 1. Create a Customer with Credit Limit
        console.log('\n--- Test 1: Create Customer with Credit Limit ---');
        const customerData = {
            name: `Credit Customer ${Date.now()}`,
            email: `credit${Date.now()}@test.com`,
            phone: '9999999999',
            creditLimit: 500,
            notes: 'Test Notes'
        };
        const customerRes = await axios.post(`${API_URL}/customers`, customerData, config);
        const customer = customerRes.data;
        console.log(`✅ Customer Created: ${customer.name}, Limit: ${customer.creditLimit}, Balance: ${customer.outstandingBalance}`);

        if (customer.creditLimit !== 500) throw new Error('Credit Limit not set correctly');

        // 2. Create Invoice within limit
        console.log('\n--- Test 2: Create Invoice (300) - Should Succeed ---');
        const invoiceData1 = {
            customerId: customer._id,
            items: [{ productId: 'PRODUCT_ID_PLACEHOLDER', quantity: 1, price: 300 }], // Will need a product, but let's see if we can mock or must create
            subtotal: 300,
            tax: 0,
            total: 300
        };

        // Need a product for invoice items usually, let's create one quickly
        const productRes = await axios.post(`${API_URL}/products`, {
            name: 'Test Item', price: 300, taxRate: 0
        }, config);
        invoiceData1.items[0].productId = productRes.data._id;

        const invoiceRes1 = await axios.post(`${API_URL}/invoices`, invoiceData1, config);
        console.log(`✅ Invoice Created: ${invoiceRes1.data._id}, Total: ${invoiceRes1.data.total}`);

        // Check Customer Balance
        const updatedCustomer1 = await axios.get(`${API_URL}/customers/${customer._id}`, config);
        console.log(`✅ Customer Balance Updated: ${updatedCustomer1.data.outstandingBalance}`);
        if (updatedCustomer1.data.outstandingBalance !== 300) throw new Error('Balance not updated correctly');

        // 3. Create Invoice exceeding limit (Current: 300, Limit: 500, New: 300 -> Total 600)
        console.log('\n--- Test 3: Create Invoice (300) - Should Fail (Limit Exceeded) ---');
        try {
            await axios.post(`${API_URL}/invoices`, invoiceData1, config);
            throw new Error('❌ Invoice should have failed but succeeded');
        } catch (error) {
            if (error.response && error.response.status === 400 && error.response.data.message.includes('Credit limit exceeded')) {
                console.log('✅ Invoice Failed as expected: Credit limit exceeded');
            } else {
                throw error; // Rethrow if it's a different error
            }
        }

        // 4. Create Payment to reduce balance
        console.log('\n--- Test 4: Create Payment (300) ---');
        const paymentData = {
            invoiceId: invoiceRes1.data._id,
            amount: 300,
            paymentMode: 'Cash'
        };
        await axios.post(`${API_URL}/payments`, paymentData, config);
        console.log('✅ Payment Created');

        // Check Customer Balance (Should be 0 now ideally, but my Payment controller logic for Customer Balance update was optional/commented? Let's check logic I wrote/reviewed)
        // CHECK: In Phase 1 audit, I viewed paymentController.js.
        // It had: 
        /*
        const customer = await Customer.findById(invoice.customerId);
        if (customer) {
            customer.outstandingBalance = (customer.outstandingBalance || 0) - Number(amount);
            await customer.save();
        }
        */
        // Yes, it was there.
        const updatedCustomer2 = await axios.get(`${API_URL}/customers/${customer._id}`, config);
        console.log(`✅ Customer Balance After Payment: ${updatedCustomer2.data.outstandingBalance}`);
        if (updatedCustomer2.data.outstandingBalance !== 0) throw new Error('Balance not reduced correctly after payment');

        // 5. Get Ledger
        console.log('\n--- Test 5: Get Ledger ---');
        const ledgerRes = await axios.get(`${API_URL}/customers/${customer._id}/ledger`, config);
        const transactions = ledgerRes.data.transactions;
        console.log(`✅ Ledger Fetched. Transactions found: ${transactions.length}`);
        if (transactions.length < 2) throw new Error('Missing transactions in ledger');
        console.log('   Transactions:', transactions.map(t => `${t.type} - ${t.amount || t.total}`).join(', '));

        console.log('\n🎉 Verified: All Customer Features Working!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.response ? error.response.data : error.message);
    }
};

setTimeout(runTests, 2000);
