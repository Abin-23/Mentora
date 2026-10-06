const fetch = require('node-fetch'); // or use global fetch
async function run() {
  const token = require('jsonwebtoken').sign({user_id: 1, role: 'Student'}, process.env.JWT_SECRET || 'your-secret');
  const res = await fetch('http://localhost:3000/adaptive-learning/students/1/courses/1/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ topic_id: 1, query: "what is flutter" })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
