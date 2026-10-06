const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const courseId = 5;
  const studentId = 1; // Or find the student ID
  
  const resourceProgresses = await prisma.learningProgress.findMany({
    where: { course_id: courseId } // Let's check all students just in case
  });
  
  console.log(resourceProgresses);
}

run().finally(() => prisma.$disconnect());
