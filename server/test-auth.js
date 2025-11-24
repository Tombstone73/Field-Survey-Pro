// Simple test script for authentication endpoints
const testEmail = `testuser${Date.now()}@example.com`;
const testPassword = 'testpass123';
const testName = 'Test User';

console.log('Testing Field Survey Pro Authentication\n');
console.log('=========================================\n');

// Test 1: Signup
console.log('Test 1: User Signup');
console.log(`Email: ${testEmail}`);

fetch('http://localhost:5000/api/auth/signup', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
    }),
})
    .then(response => {
        console.log(`Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.user && data.token) {
            console.log('✅ Signup successful!\n');

            // Test 2: Login
            console.log('Test 2: User Login');
            return fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: testEmail,
                    password: testPassword,
                }),
            });
        } else {
            throw new Error('Signup failed - no user or token in response');
        }
    })
    .then(response => {
        console.log(`Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.user && data.token) {
            console.log('✅ Login successful!\n');
            console.log('=========================================');
            console.log('All authentication tests passed! ✅');
        } else {
            throw new Error('Login failed - no user or token in response');
        }
    })
    .catch(error => {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    });
