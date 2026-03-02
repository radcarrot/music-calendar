import axios from 'axios';

async function testOWASP() {
    console.log("--- Starting OWASP Verification ---");

    try {
        // 1. Test Helmet Headers
        console.log("\n1. Testing Helmet Security Headers on /api/health");
        const healthRes = await axios.get('http://localhost:5000/api/health');
        ['x-frame-options', 'content-security-policy', 'strict-transport-security', 'x-xss-protection', 'x-powered-by'].forEach(h => {
            console.log(`  ${h}: ${healthRes.headers[h] || 'Missing'}`);
        });

        // 2. Test Input Sanitization (XSS)
        console.log("\n2. Testing XSS Input Sanitization on /api/artists");
        try {
            const xssPayload = {
                name: "<script>alert('xss')</script> Malicious",
                spotify_id: "onload=alert(1)",
            };
            const xssRes = await axios.post('http://localhost:5000/api/artists', xssPayload);
            console.log(`  [FAIL] Payload passed validation. Name stored as: ${xssRes.data.name}`);
        } catch (err) {
            console.log("  [PASS] Payload intercepted by validator. Response:", err.response?.data || err.message);
        }

        // 3. Test Rate Limiting
        console.log("\n3. Testing API Rate Limiting (100 reqs / 15 min)...");
        let successCount = 0;
        let rateLimited = false;

        for (let i = 1; i <= 105; i++) {
            try {
                await axios.get('http://localhost:5000/api/health');
                successCount++;
            } catch (err) {
                if (err.response && err.response.status === 429) {
                    console.log(`  [PASS] Rate limit triggered brilliantly! Blocked request #${i}. Error: ${err.response.data.error}`);
                    rateLimited = true;
                    break;
                }
            }
        }

        if (!rateLimited) {
            console.log("  [FAIL] Rate limit was NOT triggered after 105 requests.");
        }

    } catch (e) {
        console.error("Test script failed:", e.message);
    }
}

testOWASP();
