const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { sub: 1, email: "john@example.com", role: "Student" },
  process.env.JWT_SECRET || 'mentora_super_secret_key'
);

async function run() {
  try {
    const res = await axios.get('http://localhost:3000/certificates/eligibility/5', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Eligibility:", res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
run();
