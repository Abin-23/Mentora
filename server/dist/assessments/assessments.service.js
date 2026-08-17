"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const neo4j_service_1 = require("../neo4j/neo4j.service");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
let AssessmentsService = class AssessmentsService {
    prisma;
    neo4jService;
    constructor(prisma, neo4jService) {
        this.prisma = prisma;
        this.neo4jService = neo4jService;
    }
    async getAssessmentsByCourse(courseId, user) {
        const isStudent = user.role === 'Student';
        return this.prisma.assessment.findMany({
            where: {
                course_id: courseId,
                ...(isStudent ? { status: 'PUBLISHED' } : {}),
            },
            orderBy: { created_at: 'asc' },
            include: {
                topics: {
                    include: { topic: { select: { topic_title: true } } },
                },
                attempts: {
                    where: { student_id: user.user_id },
                    select: { status: true, score: true, percentage: true, attempt_number: true },
                    orderBy: { created_at: 'desc' },
                },
            },
        });
    }
    async getAssessmentForStudent(assessmentId) {
        const assessment = await this.prisma.assessment.findUnique({
            where: { assessment_id: assessmentId },
            include: {
                questions: {
                    include: {
                        question: {
                            include: {
                                options: {
                                    select: { option_id: true, option_text: true, sequence_number: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!assessment)
            throw new common_1.NotFoundException('Assessment not found');
        assessment.questions.forEach(q => {
            if (q.question && q.question.options) {
                q.question.options.sort((a, b) => a.sequence_number - b.sequence_number);
            }
        });
        return assessment;
    }
    async startAttempt(assessmentId, studentId) {
        const assessment = await this.prisma.assessment.findUnique({
            where: { assessment_id: assessmentId },
        });
        if (!assessment)
            throw new common_1.NotFoundException('Assessment not found');
        if (assessment.status !== 'PUBLISHED')
            throw new common_1.BadRequestException('Assessment is not available');
        const attempts = await this.prisma.assessmentAttempt.findMany({
            where: { assessment_id: assessmentId, student_id: studentId },
            orderBy: { attempt_number: 'desc' },
        });
        const inProgress = attempts.find(a => a.status === 'IN_PROGRESS');
        if (inProgress) {
            if (inProgress.expires_at && new Date() > inProgress.expires_at) {
                await this.prisma.assessmentAttempt.update({
                    where: { attempt_id: inProgress.attempt_id },
                    data: { status: 'EXPIRED' },
                });
            }
            else {
                return inProgress;
            }
        }
        if (attempts.length >= assessment.max_attempts) {
            throw new common_1.ForbiddenException('Maximum attempts reached for this assessment');
        }
        const attemptNumber = attempts.length > 0 ? attempts[0].attempt_number + 1 : 1;
        let expiresAt = null;
        if (assessment.duration_minutes) {
            expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + assessment.duration_minutes);
        }
        return this.prisma.assessmentAttempt.create({
            data: {
                assessment_id: assessmentId,
                student_id: studentId,
                attempt_number: attemptNumber,
                started_at: new Date(),
                expires_at: expiresAt,
                status: 'IN_PROGRESS',
            },
        });
    }
    async submitAnswer(attemptId, studentId, questionId, selectedOptionId, answerText) {
        const attempt = await this.prisma.assessmentAttempt.findUnique({
            where: { attempt_id: attemptId },
        });
        if (!attempt || attempt.student_id !== studentId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (attempt.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('Attempt is not in progress');
        }
        if (attempt.expires_at && new Date() > attempt.expires_at) {
            await this.prisma.assessmentAttempt.update({
                where: { attempt_id: attemptId },
                data: { status: 'EXPIRED' },
            });
            throw new common_1.BadRequestException('Attempt has expired');
        }
        const existing = await this.prisma.studentAnswer.findFirst({
            where: { attempt_id: attemptId, question_id: questionId },
        });
        if (existing) {
            return this.prisma.studentAnswer.update({
                where: { answer_id: existing.answer_id },
                data: {
                    selected_option_id: selectedOptionId,
                    answer_text: answerText,
                    answered_at: new Date(),
                },
            });
        }
        return this.prisma.studentAnswer.create({
            data: {
                attempt_id: attemptId,
                question_id: questionId,
                selected_option_id: selectedOptionId,
                answer_text: answerText,
            },
        });
    }
    async logSecurityEvent(attemptId, studentId, eventType, severity, metadata) {
        const attempt = await this.prisma.assessmentAttempt.findUnique({
            where: { attempt_id: attemptId },
        });
        if (!attempt || attempt.student_id !== studentId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return this.prisma.assessmentSecurityEvent.create({
            data: {
                attempt_id: attemptId,
                event_type: eventType,
                severity: severity,
                event_metadata: metadata || {},
            },
        });
    }
    async getAssessmentProfileForStudent(assessmentId, studentId) {
        const attempt = await this.prisma.assessmentAttempt.findFirst({
            where: { assessment_id: assessmentId, student_id: studentId, status: 'SUBMITTED' },
            orderBy: { attempt_number: 'desc' },
            include: {
                topic_results: {
                    include: { topic: { select: { topic_title: true } } }
                },
                assessment: {
                    include: { course: { select: { title: true } } }
                },
                student: {
                    select: { full_name: true }
                }
            }
        });
        if (!attempt) {
            throw new common_1.NotFoundException('No completed attempts found for this assessment');
        }
        return attempt;
    }
    async submitAttempt(attemptId, studentId) {
        const attempt = await this.prisma.assessmentAttempt.findUnique({
            where: { attempt_id: attemptId },
            include: {
                answers: {
                    include: {
                        question: {
                            include: {
                                options: true
                            }
                        }
                    }
                },
                security_events: true,
                assessment: {
                    include: {
                        questions: {
                            include: { question: true }
                        }
                    }
                }
            },
        });
        if (!attempt || attempt.student_id !== studentId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (attempt.status !== 'IN_PROGRESS') {
            return attempt;
        }
        let totalMarksObtained = 0;
        let totalMaxMarks = 0;
        const topicScores = {};
        for (const qMap of attempt.assessment.questions) {
            totalMaxMarks += Number(qMap.marks);
            const answer = attempt.answers.find(a => a.question_id === qMap.question_id);
            const question = qMap.question;
            if (!topicScores[question.topic_id]) {
                topicScores[question.topic_id] = { attempted: 0, correct: 0, marks: 0, max: 0 };
            }
            topicScores[question.topic_id].max += Number(qMap.marks);
            if (answer) {
                topicScores[question.topic_id].attempted += 1;
                let isCorrect = false;
                const originalQuestionWithOptions = answer.question;
                if (question.question_type === 'MCQ' && answer.selected_option_id) {
                    const correctOption = originalQuestionWithOptions.options.find(o => o.is_correct);
                    if (correctOption && correctOption.option_id === answer.selected_option_id) {
                        isCorrect = true;
                    }
                }
                else if (question.question_type === 'TRUE_FALSE' && answer.selected_option_id) {
                    const correctOption = originalQuestionWithOptions.options.find(o => o.is_correct);
                    if (correctOption && correctOption.option_id === answer.selected_option_id) {
                        isCorrect = true;
                    }
                }
                if (isCorrect) {
                    totalMarksObtained += Number(qMap.marks);
                    topicScores[question.topic_id].correct += 1;
                    topicScores[question.topic_id].marks += Number(qMap.marks);
                    await this.prisma.studentAnswer.update({
                        where: { answer_id: answer.answer_id },
                        data: { is_correct: true, marks_obtained: qMap.marks },
                    });
                }
                else {
                    await this.prisma.studentAnswer.update({
                        where: { answer_id: answer.answer_id },
                        data: { is_correct: false, marks_obtained: 0 },
                    });
                }
            }
        }
        const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
        for (const [topicId, stats] of Object.entries(topicScores)) {
            const topicPerc = stats.max > 0 ? (stats.marks / stats.max) * 100 : 0;
            let proficiency = 'BEGINNER';
            if (topicPerc >= 85)
                proficiency = 'ADVANCED';
            else if (topicPerc >= 70)
                proficiency = 'PROFICIENT';
            else if (topicPerc >= 40)
                proficiency = 'DEVELOPING';
            await this.prisma.assessmentTopicResult.create({
                data: {
                    attempt_id: attempt.attempt_id,
                    topic_id: Number(topicId),
                    questions_attempted: stats.attempted,
                    correct_answers: stats.correct,
                    marks_obtained: stats.marks,
                    percentage: topicPerc,
                    proficiency_level: proficiency,
                }
            });
        }
        let tabSwitches = 0;
        let fullscreenExits = 0;
        let facesMissing = 0;
        let multipleFaces = 0;
        let riskScore = 0;
        for (const event of attempt.security_events) {
            if (event.event_type === 'TAB_SWITCH')
                tabSwitches++;
            if (event.event_type === 'FULLSCREEN_EXIT')
                fullscreenExits++;
            if (event.event_type === 'FACE_MISSING')
                facesMissing++;
            if (event.event_type === 'MULTIPLE_FACE')
                multipleFaces++;
            if (event.severity === 'HIGH')
                riskScore += 30;
            if (event.severity === 'MEDIUM')
                riskScore += 15;
            if (event.severity === 'LOW')
                riskScore += 5;
        }
        let riskLevel = 'NORMAL';
        if (riskScore >= 100)
            riskLevel = 'CRITICAL';
        else if (riskScore >= 70)
            riskLevel = 'HIGH';
        else if (riskScore >= 40)
            riskLevel = 'MEDIUM';
        else if (riskScore >= 15)
            riskLevel = 'LOW';
        await this.prisma.assessmentIntegrityReport.create({
            data: {
                attempt_id: attempt.attempt_id,
                integrity_score: Math.min(riskScore, 100),
                tab_switch_count: tabSwitches,
                fullscreen_exit_count: fullscreenExits,
                face_missing_count: facesMissing,
                multiple_face_count: multipleFaces,
                suspicious_event_count: attempt.security_events.length,
                risk_level: riskLevel,
            }
        });
        const updatedAttempt = await this.prisma.assessmentAttempt.update({
            where: { attempt_id: attemptId },
            data: {
                status: 'SUBMITTED',
                submitted_at: new Date(),
                score: totalMarksObtained,
                percentage: percentage,
            },
        });
        this.syncStudentKnowledgeToNeo4j(studentId, topicScores).catch(e => {
            console.error('Failed to sync student knowledge to Neo4j async', e);
        });
        return updatedAttempt;
    }
    async syncStudentKnowledgeToNeo4j(studentId, topicScores) {
        if (!this.neo4jService.isDatabaseConnected()) {
            console.warn('Neo4j is not connected. Skipping student knowledge sync.');
            return;
        }
        try {
            await this.neo4jService.write(`MERGE (s:Student {studentId: toInteger($studentId)})`, { studentId: neo4j_driver_1.default.int(studentId) });
            for (const [topicIdStr, stats] of Object.entries(topicScores)) {
                const topicId = Number(topicIdStr);
                const topicPerc = stats.max > 0 ? (stats.marks / stats.max) : 0;
                let proficiency = 'BEGINNER';
                if (topicPerc >= 0.85)
                    proficiency = 'ADVANCED';
                else if (topicPerc >= 0.70)
                    proficiency = 'PROFICIENT';
                else if (topicPerc >= 0.40)
                    proficiency = 'DEVELOPING';
                await this.neo4jService.write(`
          MATCH (s:Student {studentId: toInteger($studentId)})
          MATCH (t:Topic {topicId: toInteger($topicId)})
          MERGE (s)-[k:KNOWLEDGE_STATE]->(t)
          ON CREATE SET k.attemptCount = 1
          ON MATCH SET k.attemptCount = k.attemptCount + 1
          SET k.score = $score,
              k.proficiency = $proficiency,
              k.source = $source,
              k.lastAssessmentAt = datetime(),
              k.updatedAt = datetime()
          `, {
                    studentId: neo4j_driver_1.default.int(studentId),
                    topicId: neo4j_driver_1.default.int(topicId),
                    score: topicPerc,
                    proficiency: proficiency,
                    source: 'ASSESSMENT_ATTEMPT',
                });
            }
            console.log(`Successfully synced Knowledge State for Student #${studentId} to Neo4j`);
        }
        catch (error) {
            console.error('Error syncing student knowledge to Neo4j:', error);
        }
    }
};
exports.AssessmentsService = AssessmentsService;
exports.AssessmentsService = AssessmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        neo4j_service_1.Neo4jService])
], AssessmentsService);
//# sourceMappingURL=assessments.service.js.map