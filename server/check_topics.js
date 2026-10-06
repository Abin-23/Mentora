const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const topics = await prisma.topic.findMany({ where: { course_id: 3 } });
  console.log(topics.map(t => t.topic_id));
}
run();
