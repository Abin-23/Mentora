import { PrismaClient, DifficultyLevel, CourseStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding topics for course_id: 1...');

  const courseId = 1;
  const course = await prisma.course.findUnique({
    where: { course_id: courseId },
  });

  if (!course) {
    console.log(`Course with ID ${courseId} not found!`);
    return;
  }

  const sampleTopics = [
    {
      topic_title: 'Introduction to React 18',
      topic_description:
        'An overview of the new features in React 18, including concurrent rendering and automatic batching.',
      learning_objectives:
        'Understand concurrent rendering. Learn about automatic batching.',
      difficulty_level: DifficultyLevel.Beginner,
      estimated_duration: 1.5,
      status: CourseStatus.Published,
    },
    {
      topic_title: 'Next.js App Router Fundamentals',
      topic_description:
        'Diving deep into the new App Router architecture in Next.js.',
      learning_objectives:
        'Understand server components vs client components. Learn file-based routing.',
      difficulty_level: DifficultyLevel.Intermediate,
      estimated_duration: 2.0,
      status: CourseStatus.Published,
    },
    {
      topic_title: 'Data Fetching & Caching Strategies',
      topic_description:
        'Applying advanced data fetching techniques and caching strategies in Next.js.',
      learning_objectives:
        'Implement ISR and SSR. Handle caching and revalidation.',
      difficulty_level: DifficultyLevel.Advanced,
      estimated_duration: 3.5,
      status: CourseStatus.Published,
    },
  ];

  console.log(`Seeding topics for course: ${course.title}`);

  const existingTopicsCount = await prisma.topic.count({
    where: { course_id: courseId },
  });

  if (existingTopicsCount > 0) {
    console.log(
      `- Course already has ${existingTopicsCount} topics. Deleting existing topics for a clean seed...`,
    );
    await prisma.topic.deleteMany({
      where: { course_id: courseId },
    });
  }

  let sequence = 1;
  for (const topicData of sampleTopics) {
    await prisma.topic.create({
      data: {
        ...topicData,
        course_id: courseId,
        sequence_number: sequence++,
      },
    });
  }
  console.log('- React & Next.js Topics added successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
