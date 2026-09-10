import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  const userId = 1; // Or whatever user id it is. Let's find the user id.
  const courseId = 3; // From the logs: Course: 3, Student: 7
  
  const resourceProgresses = await prisma.learningProgress.findMany({
    where: { student_id: 7, course_id: courseId }
  });
  console.log("Progresses:", resourceProgresses.length);
  
  const resources = await prisma.resource.findMany({
    where: { topic: { course_id: courseId } }
  });
  console.log("Resources:", resources.length);
  
  const resourcesByTopic = new Map<number, any[]>();
  for (const r of resources) {
    if (!resourcesByTopic.has(r.topic_id)) {
      resourcesByTopic.set(r.topic_id, []);
    }
    resourcesByTopic.get(r.topic_id)!.push(r);
  }

  for (const [topicId, topicResources] of resourcesByTopic.entries()) {
    let totalPercent = 0;
    for (const r of topicResources) {
      const p = resourceProgresses.find(pr => pr.resource_id === r.resource_id);
      if (p) totalPercent += p.progress_percent;
    }
    const avg = Math.round(totalPercent / topicResources.length);
    console.log(`Topic ${topicId} avg: ${avg}`);
  }
}
test().then(() => process.exit(0));
