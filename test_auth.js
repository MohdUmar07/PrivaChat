const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth';

// Use random user to avoid conflicts
const randomId = Math.floor(Math.random() * 10000);
const testUser = {
    username: `TestUser${randomId}`,
    email: `test${randomId}@example.com`,
    password: 'password123',
    publicKey: 'dummyPublicKeyForTesting123=='
};

async function testAuth() {
    console.log("1. Testing Registration...");
    try {
        const regRes = await axios.post(`${API_URL}/register`, testUser);
        console.log("✅ Registration Successful:", regRes.data);
    } catch (err) {
        console.error("❌ Registration Failed:", err.response ? err.response.data : err.message);
        return; // Stop if registration fails
    }

    console.log("\n2. Testing Login...");
    try {
        const loginRes = await axios.post(`${API_URL}/login`, {
            username: testUser.username,
            password: testUser.password
        });
        console.log("✅ Login Successful:", loginRes.data);
    } catch (err) {
        console.error("❌ Login Failed:", err.response ? err.response.data : err.message);
    }
}

testAuth();
