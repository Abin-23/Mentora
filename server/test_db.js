const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const course = await prisma.course.findFirst({ where: { slug: 'openstack-cloud-computing-architecture-compute-storage-networking' } });
  console.log("Course:", course.course_id);
  
  const topics = await prisma.topic.findMany({ 
    where: { course_id: course.course_id },
    include: { resources: true }
  });
  
  for (const t of topics) {
    console.log(`Topic ${t.topic_id} - ${t.topic_title}`);
    for (const r of t.resources) {
      console.log(`  Resource ${r.resource_id} - ${r.resource_title} (Status: ${r.status})`);
    }
  }
}

run().finally(() => prisma.$disconnect());
