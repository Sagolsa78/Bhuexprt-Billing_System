const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

const runTests = async () => {
    console.log('🔄 Starting Expense Module Verification...');

    try {
        // 1. Setup: Login
        // Reuse admin logic or just login
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/users/login`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            token = loginRes.data.token;
        } catch (e) {
            // Fallback if admin doesn't exist (unlikely if previous tests ran)
            const uniqueEmail = `admin_${Date.now()}@test.com`;
            const regRes = await axios.post(`${API_URL}/users`, {
                name: 'Admin User',
                email: uniqueEmail,
                password: 'password123'
            });
            token = regRes.data.token;
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Create Expense
        console.log('\n--- Test: Create Expense ---');
        const expenseData = {
            description: `Office Rent ${Date.now()}`,
            amount: 15000,
            category: 'Rent',
            vendor: 'Landlord',
            paymentMode: 'BANK',
            notes: 'Monthly Rent'
        };
        const createRes = await axios.post(`${API_URL}/expenses`, expenseData, config);
        const expenseId = createRes.data._id;
        console.log(`✅ Expense Created: ${createRes.data.description}, Amount: ${createRes.data.amount}`);

        // 3. Get All Expenses
        console.log('\n--- Test: Get All Expenses ---');
        const getRes = await axios.get(`${API_URL}/expenses`, config);
        const expenses = getRes.data.expenses;
        console.log(`✅ Fetched Expenses: ${expenses.length} found`);
        const found = expenses.find(e => e._id === expenseId);
        if (!found) throw new Error('Created expense not found in list');

        // 4. Get Expense Stats
        console.log('\n--- Test: Get Expense Stats ---');
        const statsRes = await axios.get(`${API_URL}/expenses/stats`, config);
        console.log('✅ Stats fetched:', JSON.stringify(statsRes.data, null, 2));
        if (statsRes.data.length === 0) throw new Error('Stats should not be empty');

        console.log('\n🎉 Expense Module Verification Successful!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
};

runTests();
