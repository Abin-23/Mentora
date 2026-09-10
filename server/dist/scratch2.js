"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function test() {
    const userId = 7;
    const courseId = 3;
    const assessments = await prisma.assessment.findMany({
        where: { course_id: courseId },
        include: {
            topics: true,
            attempts: { where: { student_id: userId } }
        }
    });
    for (const a of assessments) {
        if (a.assessment_type === 'TOPIC') {
            const isSubmitted = a.attempts.some(att => att.status === 'SUBMITTED');
            console.log(`Assessment ${a.assessment_id} for Topic ${a.topics[0]?.topic_id}: Submitted=${isSubmitted}`);
        }
    }
}
test().then(() => process.exit(0));
//# sourceMappingURL=scratch2.js.map