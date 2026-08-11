import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find a SystemAdmin to assign as the creator
  let admin = await prisma.user.findFirst({
    where: { role: 'SystemAdmin' },
  });

  if (!admin) {
    console.log('No SystemAdmin found. Creating a temporary one...');
    admin = await prisma.user.create({
      data: {
        full_name: 'Seed Admin',
        email: 'seed_admin_' + Date.now() + '@mentora.com',
        role: 'SystemAdmin',
      },
    });
  }

  const categories = [
    {
      category_name: 'Web Development',
      description:
        'Learn to build modern, responsive, and robust websites and web applications.',
      icon: 'code',
      status: 'Active' as const,
      created_by: admin.user_id,
    },
    {
      category_name: 'Data Science',
      description:
        'Master data analysis, machine learning, and statistical modeling.',
      icon: 'data_object',
      status: 'Active' as const,
      created_by: admin.user_id,
    },
    {
      category_name: 'UI/UX Design',
      description:
        'Design beautiful, intuitive interfaces and craft amazing user experiences.',
      icon: 'brush',
      status: 'Active' as const,
      created_by: admin.user_id,
    },
    {
      category_name: 'Mobile App Development',
      description:
        'Build native and cross-platform mobile applications for iOS and Android.',
      icon: 'smartphone',
      status: 'Active' as const,
      created_by: admin.user_id,
    },
    {
      category_name: 'Cybersecurity',
      description:
        'Learn to protect networks, devices, programs, and data from attacks.',
      icon: 'security',
      status: 'Active' as const,
      created_by: admin.user_id,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { category_name: cat.category_name },
      update: {},
      create: cat,
    });
  }

  console.log('5 Course Categories seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
