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
var AiGenerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiGenerationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const genai_1 = require("@google/genai");
let AiGenerationService = AiGenerationService_1 = class AiGenerationService {
    prisma;
    logger = new common_1.Logger(AiGenerationService_1.name);
    ai = null;
    constructor(prisma) {
        this.prisma = prisma;
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.ai = new genai_1.GoogleGenAI({ apiKey });
        }
        else {
            this.logger.warn('GEMINI_API_KEY is not set. AI Generation will fail if invoked.');
        }
    }
    async generateInitialAssessment(courseId) {
        if (!this.ai) {
            this.logger.error('Cannot generate initial assessment without GEMINI_API_KEY');
            return;
        }
        try {
            const course = await this.prisma.course.findUnique({
                where: { course_id: courseId },
                include: { topics: true },
            });
            if (!course) {
                this.logger.error(`Course #${courseId} not found`);
                return;
            }
            if (course.topics.length === 0) {
                this.logger.warn(`Course #${courseId} has no topics. Skipping initial assessment generation.`);
                return;
            }
            const existing = await this.prisma.assessment.findFirst({
                where: { course_id: courseId, assessment_type: 'INITIAL' },
            });
            if (existing) {
                this.logger.log(`Course #${courseId} already has an INITIAL assessment. Skipping.`);
                return;
            }
            this.logger.log(`Generating INITIAL assessment for Course #${courseId}`);
            const topicDetails = course.topics.map(t => ({
                id: t.topic_id,
                title: t.topic_title,
                description: t.topic_description,
            }));
            const prompt = `
        You are an expert educator. Create an initial assessment for a course titled "${course.title}".
        The course has the following topics:
        ${JSON.stringify(topicDetails, null, 2)}

        Generate exactly 2 high-quality Multiple Choice Questions (MCQs) for each topic. 
        Each question should assess foundational understanding to establish a baseline proficiency.
        
        Respond ONLY with a valid JSON array of objects. Do not wrap in markdown tags like \`\`\`json.
        Each object must follow this exact schema:
        {
          "topic_id": number,
          "question_text": "The question text",
          "difficulty_level": "EASY" | "MEDIUM" | "HARD",
          "explanation": "Why the correct answer is correct",
          "options": [
            { "option_text": "First option", "is_correct": boolean },
            { "option_text": "Second option", "is_correct": boolean },
            { "option_text": "Third option", "is_correct": boolean },
            { "option_text": "Fourth option", "is_correct": boolean }
          ]
        }
      `;
            const response = await this.ai.models.generateContent({
                model: 'gemini-flash-latest',
                contents: prompt,
            });
            const responseText = response.text;
            if (!responseText)
                throw new Error('Empty response from Gemini');
            let questions;
            try {
                const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                questions = JSON.parse(cleanedText);
            }
            catch (e) {
                this.logger.error('Failed to parse Gemini response as JSON', e);
                this.logger.debug('Response was:', responseText);
                return;
            }
            await this.prisma.$transaction(async (tx) => {
                const assessment = await tx.assessment.create({
                    data: {
                        course_id: course.course_id,
                        title: `${course.title} - Initial Assessment`,
                        description: 'This is a system-generated initial assessment to determine your baseline knowledge before starting the course. This assessment is not graded for a pass/fail.',
                        assessment_type: 'INITIAL',
                        is_system_generated: true,
                        total_questions: questions.length,
                        passing_percentage: null,
                        max_attempts: 1,
                        status: 'PUBLISHED',
                    },
                });
                const topicCounts = {};
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    topicCounts[q.topic_id] = (topicCounts[q.topic_id] || 0) + 1;
                    const createdQuestion = await tx.question.create({
                        data: {
                            topic_id: q.topic_id,
                            question_text: q.question_text,
                            question_type: 'MCQ',
                            difficulty_level: q.difficulty_level,
                            explanation: q.explanation,
                            generation_method: 'AI',
                            status: 'APPROVED',
                            options: {
                                create: q.options.map((o, idx) => ({
                                    option_text: o.option_text,
                                    is_correct: o.is_correct,
                                    sequence_number: idx + 1,
                                })),
                            },
                        },
                    });
                    await tx.assessmentQuestionMap.create({
                        data: {
                            assessment_id: assessment.assessment_id,
                            question_id: createdQuestion.question_id,
                            sequence_number: i + 1,
                            marks: 1.00,
                        },
                    });
                }
                for (const [tId, count] of Object.entries(topicCounts)) {
                    await tx.assessmentTopic.create({
                        data: {
                            assessment_id: assessment.assessment_id,
                            topic_id: Number(tId),
                            question_count: count,
                        },
                    });
                }
                this.logger.log(`Successfully created INITIAL assessment #${assessment.assessment_id} with ${questions.length} questions.`);
            });
        }
        catch (error) {
            this.logger.error('Error generating initial assessment', error);
        }
    }
    async generateTopicAssessment(courseId, topicId, studentId) {
        if (!this.ai) {
            this.logger.warn('AI Client not initialized. Cannot generate topic assessment.');
            return null;
        }
        try {
            const course = await this.prisma.course.findUnique({
                where: { course_id: courseId },
            });
            const topic = await this.prisma.topic.findUnique({
                where: { topic_id: topicId },
            });
            if (!course || !topic) {
                this.logger.error(`Course #${courseId} or Topic #${topicId} not found`);
                return null;
            }
            const existingAssessments = await this.prisma.assessment.findMany({
                where: {
                    course_id: courseId,
                    assessment_type: 'TOPIC',
                    topics: {
                        some: { topic_id: topicId }
                    }
                },
                include: {
                    attempts: {
                        where: {
                            student_id: studentId
                        }
                    }
                }
            });
            const unsubmittedAssessment = existingAssessments.find(a => !a.attempts.some(attempt => attempt.status === 'SUBMITTED'));
            if (unsubmittedAssessment) {
                this.logger.log(`Student #${studentId} has unsubmitted TOPIC assessment #${unsubmittedAssessment.assessment_id}. Returning existing.`);
                return unsubmittedAssessment;
            }
            this.logger.log(`Student #${studentId} submitted all previous assessments. Generating fresh TOPIC assessment for Course #${courseId}, Topic #${topicId}`);
            const prompt = `
        You are an expert educator. Create a topic assessment for a course titled "${course.title}".
        The specific topic being assessed is:
        Title: "${topic.topic_title}"
        Description: "${topic.topic_description || ''}"

        Generate exactly 5 high-quality Multiple Choice Questions (MCQs) for this topic.
        The questions should assess if the student has learned the material, ranging from basic understanding to application.
        
        Respond ONLY with a valid JSON array of objects. Do not wrap in markdown tags like \`\`\`json.
        Each object must follow this exact schema:
        {
          "question_text": "The question text",
          "difficulty_level": "MEDIUM",
          "explanation": "Why the correct answer is correct",
          "options": [
            { "option_text": "First option", "is_correct": boolean },
            { "option_text": "Second option", "is_correct": boolean },
            { "option_text": "Third option", "is_correct": boolean },
            { "option_text": "Fourth option", "is_correct": boolean }
          ]
        }
      `;
            let response;
            const fallbackModels = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.6-flash', 'gemini-2.5-flash'];
            let lastError;
            for (const modelName of fallbackModels) {
                try {
                    response = await this.ai.models.generateContent({
                        model: modelName,
                        contents: prompt,
                    });
                    this.logger.log(`Successfully generated assessment using model: ${modelName}`);
                    break;
                }
                catch (error) {
                    lastError = error;
                    this.logger.warn(`Model ${modelName} failed (${error.message}). Falling back to next model...`);
                }
            }
            if (!response) {
                throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
            }
            const responseText = response.text;
            if (!responseText)
                throw new Error('Empty response from Gemini');
            let questions;
            try {
                const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                questions = JSON.parse(cleanedText);
            }
            catch (e) {
                this.logger.error('Failed to parse Gemini response as JSON', e);
                this.logger.debug('Response was:', responseText);
                return null;
            }
            const assessment = await this.prisma.$transaction(async (tx) => {
                const createdAssessment = await tx.assessment.create({
                    data: {
                        course_id: course.course_id,
                        title: `${topic.topic_title} - Topic Assessment`,
                        description: 'This is a system-generated topic assessment to measure your learning after studying the recommended resources.',
                        assessment_type: 'TOPIC',
                        is_system_generated: true,
                        total_questions: questions.length,
                        passing_percentage: null,
                        max_attempts: 1,
                        status: 'PUBLISHED',
                    },
                });
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    const createdQuestion = await tx.question.create({
                        data: {
                            topic_id: topicId,
                            question_text: q.question_text,
                            question_type: 'MCQ',
                            difficulty_level: q.difficulty_level,
                            explanation: q.explanation,
                            generation_method: 'AI',
                            status: 'APPROVED',
                            options: {
                                create: q.options.map((o, idx) => ({
                                    option_text: o.option_text,
                                    is_correct: o.is_correct,
                                    sequence_number: idx + 1,
                                })),
                            },
                        },
                    });
                    await tx.assessmentQuestionMap.create({
                        data: {
                            assessment_id: createdAssessment.assessment_id,
                            question_id: createdQuestion.question_id,
                            sequence_number: i + 1,
                            marks: 1.00,
                        },
                    });
                }
                await tx.assessmentTopic.create({
                    data: {
                        assessment_id: createdAssessment.assessment_id,
                        topic_id: topicId,
                        question_count: questions.length,
                    },
                });
                this.logger.log(`Successfully created TOPIC assessment #${createdAssessment.assessment_id} with ${questions.length} questions.`);
                return createdAssessment;
            });
            return assessment;
        }
        catch (error) {
            this.logger.error('Error generating topic assessment', error);
            return null;
        }
    }
};
exports.AiGenerationService = AiGenerationService;
exports.AiGenerationService = AiGenerationService = AiGenerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiGenerationService);
//# sourceMappingURL=ai-generation.service.js.map