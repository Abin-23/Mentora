const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const courseId = 1; // Assuming OpenStack course is 1
  const studentId = 1; // Assuming student is 1
  
  const topics = await prisma.topic.findMany({ 
    where: { course_id: courseId },
    include: { resources: true }
  });
  
  const resourceProgresses = await prisma.learningProgress.findMany({
    where: { student_id: studentId, course_id: courseId }
  });
  
  let hasCompletedAllResources = true;
  let totalResources = 0;
  for (const t of topics) {
    for (const r of t.resources) {
      totalResources++;
      const p = resourceProgresses.find(rp => rp.resource_id === r.resource_id);
      console.log(`Resource ${r.resource_id} in Topic ${t.topic_id}: Progress = ${p ? p.progress_percent : 'NONE'}`);
      if (!p || p.progress_percent < 100) {
        hasCompletedAllResources = false;
      }
    }
  }
  
  console.log("Total resources:", totalResources);
  console.log("Has completed all?", hasCompletedAllResources);
}

run().catch(console.error).finally(() => prisma.$disconnect());
