"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const topicId = 1;
    console.log(`Seeding resources for topic_id: ${topicId}...`);
    const topic = await prisma.topic.findUnique({
        where: { topic_id: topicId },
    });
    if (!topic) {
        console.log(`Topic with ID ${topicId} not found! Please run seed_topics.ts first.`);
        return;
    }
    const uploader = await prisma.user.findFirst();
    if (!uploader) {
        console.log('No user found to act as uploader. Please run seed_admin.ts first.');
        return;
    }
    const sampleResources = [
        {
            resource_title: 'Introduction to React 18 Video',
            description: 'A comprehensive video tutorial on React 18 new features.',
            resource_type: client_1.ResourceType.VIDEO,
            resource_key: 'videos/react18_intro.mp4',
            duration_seconds: 3600,
            is_preview: true,
            status: client_1.CourseStatus.Published,
        },
        {
            resource_title: 'React 18 Cheat Sheet',
            description: 'Quick reference guide for React 18.',
            resource_type: client_1.ResourceType.PDF,
            resource_key: 'documents/react18_cheatsheet.pdf',
            file_size: BigInt(1048576),
            is_preview: false,
            status: client_1.CourseStatus.Published,
        },
        {
            resource_title: 'Code Repository Link',
            description: 'Link to the GitHub repository for this course.',
            resource_type: client_1.ResourceType.LINK,
            resource_key: 'https://github.com/example/react18-course',
            is_preview: false,
            status: client_1.CourseStatus.Published,
        },
    ];
    const existingResourcesCount = await prisma.resource.count({
        where: { topic_id: topicId },
    });
    if (existingResourcesCount > 0) {
        console.log(`- Topic already has ${existingResourcesCount} resources. Deleting existing resources for a clean seed...`);
        await prisma.resource.deleteMany({
            where: { topic_id: topicId },
        });
    }
    let sequence = 1;
    for (const resourceData of sampleResources) {
        await prisma.resource.create({
            data: {
                ...resourceData,
                topic_id: topicId,
                sequence_number: sequence++,
                uploaded_by: uploader.user_id,
            },
        });
    }
    console.log(`- Resources for topic "${topic.topic_title}" added successfully!`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed_resources.js.map