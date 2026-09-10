"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
//# sourceMappingURL=scratch4.js.map