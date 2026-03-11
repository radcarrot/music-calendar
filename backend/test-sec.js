import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        failed++;
    }
}

async function runTests() {
    console.log('--- OWASP Security Mitigation Test Suite ---');

    const testEmail = `xss_tester_${Date.now()}@example.com`;

    // TEST 1: XSS Sanitization in Registration
    try {
        const xssPayload = {
            name: '<script>alert("xss")</script>BadGuy',
            email: testEmail,
            password: 'Password123!'
        };

        const res = await axios.post(`${API_URL}/auth/register`, xssPayload);
        assert(res.status === 201, 'Registration succeeded');
        assert(res.data.user.name.includes('&lt;script&gt;'), 'XSS tags were properly escaped in DB/Response');
        assert(!res.data.user.name.includes('<script>'), 'Raw XSS tags are not present');
    } catch (err) {
        console.error(err.response?.data || err.message);
        assert(false, 'XSS Registration Test crashed or failed');
    }

    // TEST 2: SQL Injection Prevention in Login
    try {
        const sqliPayload = {
            email: "admin@example.com' OR '1'='1",
            password: "Password123!"
        };
        await axios.post(`${API_URL}/auth/login`, sqliPayload);
        assert(false, 'SQL Injection payload should not allow login');
    } catch (err) {
        // We expect a 400 Validation Error because it's not a valid email, OR a 400 Invalid Credentials if it reached the DB
        assert(err.response?.status === 400, `SQL Injection blocked securely with status ${err.response?.status}`);
        assert(
            err.response?.data?.error === 'Validation failed' || err.response?.data?.error === 'Invalid credentials',
            'Reason is validation or invalid credentials vs internal server error'
        );
    }

    // TEST 3: Brute Force API Rate Limiting (OWASP Insecure Design)
    try {
        console.log('Testing login rate limiter (max 5 hits per IP window)...');
        for (let i = 0; i < 6; i++) {
            try {
                await axios.post(`${API_URL}/auth/login`, { email: 'fake@example.com', password: 'bad' });
            } catch (e) {
                if (e.response?.status === 429) {
                    assert(true, 'IP Rate Limiting triggered successfully at 6th attempt (HTTP 429)');
                    break;
                }
                if (i === 5) {
                    assert(false, `Expected 429 Rate Limit, got ${e.response?.status}`);
                }
            }
        }
    } catch (err) {
        assert(false, 'Limiter test crashed');
    }

    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
