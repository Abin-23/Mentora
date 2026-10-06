"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios = require('axios');
const fs = require('fs');
async function main() {
    console.log('--- E2E TEST VIA HTTP ---');
    const loginRes = await axios.post('http://localhost:3000/auth/login', {
        email: 'abinsebastian564@gmail.com',
        password: 'password123'
    }).catch(() => null);
    console.log('Cannot easily simulate Google Auth from CLI.');
}
main();
//# sourceMappingURL=test-e2e-http.js.map