import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const courseId = 3;
  const topics = await prisma.topic.findMany({
    where: { course_id: courseId }
  });
  console.log("Topics in course 3:");
  for (const t of topics) {
    console.log(`Topic ${t.topic_id}: ${t.topic_title}`);
  }
}
test().then(() => process.exit(0));
