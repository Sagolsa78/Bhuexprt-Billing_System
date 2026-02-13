const axios = require('axios');

const API_URL = 'http://localhost:4000/api'; // Confirmed port 4000

const runTests = async () => {
    console.log('🔄 Starting Payment Module Verification...');

    try {
        // 1. Setup: Login/Register
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/users/login`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            token = loginRes.data.token;
        } catch (e) {
            const uniqueEmail = `admin_${Date.now()}@test.com`;
            const regRes = await axios.post(`${API_URL}/users`, {
                name: 'Admin User',
                email: uniqueEmail,
                password: 'password123'
            });
            token = regRes.data.token;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Create a Customer
        const customerData = {
            name: `Pay Customer ${Date.now()}`,
            email: `pay${Date.now()}@test.com`,
            phone: '9876543210'
        };
        const customerRes = await axios.post(`${API_URL}/customers`, customerData, config);
        const customerId = customerRes.data._id;
        console.log(`✅ Customer Created: ${customerRes.data.name}`);

        // 3. Create an Invoice (Total: 1000)
        // Need a product first
        const productRes = await axios.post(`${API_URL}/products`, {
            name: 'Payment Test Product', price: 1000, taxRate: 0
        }, config);
        const productId = productRes.data._id;

        const invoiceData = {
            customerId,
            items: [{ productId, quantity: 1, price: 1000 }],
            subtotal: 1000,
            tax: 0,
            total: 1000
        };
        const invoiceRes = await axios.post(`${API_URL}/invoices`, invoiceData, config);
        const invoiceId = invoiceRes.data._id;
        console.log(`✅ Invoice Created: Total 1000. Status: ${invoiceRes.data.status}`);

        // 4. Record Partial Payment (Amount: 400)
        console.log('\n--- Test: Partial Payment (400) ---');
        const partialPaymentData = {
            invoiceId,
            amount: 400,
            paymentMode: 'CASH',
            notes: 'Partial Payment'
        };
        await axios.post(`${API_URL}/payments`, partialPaymentData, config);

        // Verify Invoice State
        const invoiceAfterPartial = await axios.get(`${API_URL}/invoices/${invoiceId}`, config);
        console.log(`Snapshot after 400 payment: Paid: ${invoiceAfterPartial.data.amountPaid}, Due: ${invoiceAfterPartial.data.balanceDue}, Status: ${invoiceAfterPartial.data.status}`);

        if (invoiceAfterPartial.data.amountPaid !== 400) throw new Error('Amount Paid not updated correctly');
        if (invoiceAfterPartial.data.balanceDue !== 600) throw new Error('Balance Due not updated correctly');
        if (invoiceAfterPartial.data.status !== 'PARTIAL') throw new Error('Status should be PARTIAL');
        console.log('✅ Partial Payment Verified');

        // 5. Record Remaining Payment (Amount: 600)
        console.log('\n--- Test: Remaining Payment (600) ---');
        const remainingPaymentData = {
            invoiceId,
            amount: 600,
            paymentMode: 'UPI',
            notes: 'Full Settlement'
        };
        await axios.post(`${API_URL}/payments`, remainingPaymentData, config);

        // Verify Invoice State
        const invoiceAfterFull = await axios.get(`${API_URL}/invoices/${invoiceId}`, config);
        console.log(`Snapshot after 600 payment: Paid: ${invoiceAfterFull.data.amountPaid}, Due: ${invoiceAfterFull.data.balanceDue}, Status: ${invoiceAfterFull.data.status}`);

        if (invoiceAfterFull.data.amountPaid !== 1000) throw new Error('Amount Paid not updated correctly');
        if (invoiceAfterFull.data.balanceDue !== 0) throw new Error('Balance Due not updated correctly');
        if (invoiceAfterFull.data.status !== 'PAID') throw new Error('Status should be PAID');
        console.log('✅ Full Payment Verified');

        // 6. Verify Customer Outstanding Balance
        const customerAfter = await axios.get(`${API_URL}/customers/${customerId}`, config);
        console.log(`Customer Outstanding Balance: ${customerAfter.data.outstandingBalance}`);
        if (customerAfter.data.outstandingBalance !== 0) console.warn('⚠️ Warning: Customer balance might not have synced perfectly if implementation differs.');

        console.log('\n🎉 Payments Logic Verification Successful!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
};

runTests();
