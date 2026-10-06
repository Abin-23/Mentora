const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const courseId = 5;
  const studentId = 1;
  
  const topics = await prisma.topic.findMany({ 
    where: { course_id: courseId },
    include: { resources: true }
  });
  
  const resourceProgresses = await prisma.learningProgress.findMany({
    where: {
      student_id: studentId,
      course_id: courseId
    }
  });

  let hasCompletedAllResources = true;
  let totalResources = 0;
  for (const t of topics) {
    for (const r of t.resources) {
      totalResources++;
      const p = resourceProgresses.find(rp => rp.resource_id === r.resource_id);
      console.log(`Topic ${t.topic_title} | Resource ${r.resource_id} (${r.resource_title}) | Status: ${r.status} | Progress: ${p ? p.progress_percent : 'NONE'}`);
      if (!p || p.progress_percent < 100) {
        hasCompletedAllResources = false;
      }
    }
  }

  if (totalResources === 0) hasCompletedAllResources = false;

  console.log("hasCompletedAllResources:", hasCompletedAllResources);
}

run().finally(() => prisma.$disconnect());
