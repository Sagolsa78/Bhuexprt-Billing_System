const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

const runTests = async () => {
    console.log('🔄 Starting Reports Module Verification...');

    try {
        // 1. Setup: Login
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

        // 2. Get Dashboard Stats
        console.log('\n--- Test: Get Dashboard Stats ---');
        const statsRes = await axios.get(`${API_URL}/reports/dashboard`, config);
        const stats = statsRes.data;
        console.log('✅ Dashboard Stats:', JSON.stringify(stats, null, 2));

        if (stats.totalSales === undefined || stats.totalExpenses === undefined || stats.netProfit === undefined) {
            throw new Error('Dashboard stats missing required fields');
        }

        // 3. Get Sales Report
        console.log('\n--- Test: Get Sales Report ---');
        const salesRes = await axios.get(`${API_URL}/reports/sales`, config);
        console.log(`✅ Sales Report Data Points: ${salesRes.data.length}`);
        if (salesRes.data.length > 0) {
            console.log('   Sample:', salesRes.data[0]);
        }

        // 4. Get P&L Report
        console.log('\n--- Test: Get P&L Report ---');
        const pnlRes = await axios.get(`${API_URL}/reports/pnl`, config);
        console.log(`✅ P&L Report Data Points: ${pnlRes.data.length}`);
        if (pnlRes.data.length > 0) {
            console.log('   Sample:', pnlRes.data[0]);
        }

        console.log('\n🎉 Reports Module Verification Successful!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
};

runTests();
