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
exports.AdaptiveLearningService = void 0;
const common_1 = require("@nestjs/common");
const neo4j_service_1 = require("../neo4j/neo4j.service");
const prisma_service_1 = require("../prisma/prisma.service");
const resources_service_1 = require("../resources/resources.service");
const learning_progress_service_1 = require("../learning-progress/learning-progress.service");
const engine_1 = require("./engine");
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
function toNumberSafe(val) {
    if (val == null)
        return 0;
    if (typeof val.toNumber === 'function') {
        return val.toNumber();
    }
    return Number(val);
}
const visual_resources_service_1 = require("../visual-resources/visual-resources.service");
let AdaptiveLearningService = class AdaptiveLearningService {
    neo4jService;
    prisma;
    resourcesService;
    learningProgressService;
    visualResourcesService;
    constructor(neo4jService, prisma, resourcesService, learningProgressService, visualResourcesService) {
        this.neo4jService = neo4jService;
        this.prisma = prisma;
        this.resourcesService = resourcesService;
        this.learningProgressService = learningProgressService;
        this.visualResourcesService = visualResourcesService;
    }
    async generatePath(studentId, courseId, dto) {
        const limit = dto?.limit || 5;
        const topicsResult = await this.neo4jService.read(`
      MATCH (c:Course {courseId: toInteger($courseId)})-[:HAS_TOPIC]->(t:Topic)
      RETURN t.topicId AS topicId, t.title AS title, t.sequenceNumber AS sequenceNumber, t.difficulty AS difficulty
      ORDER BY t.sequenceNumber
      `, { courseId: neo4j_driver_1.default.int(courseId) });
        const topics = topicsResult.records.map((rec) => ({
            topicId: toNumberSafe(rec.get('topicId')),
            title: rec.get('title'),
            sequenceNumber: toNumberSafe(rec.get('sequenceNumber')),
            difficulty: rec.get('difficulty'),
        }));
        if (topics.length === 0) {
            throw new common_1.NotFoundException(`No topics found for course ${courseId}`);
        }
        const prereqResult = await this.neo4jService.read(`
      MATCH (c:Course {courseId: toInteger($courseId)})-[:HAS_TOPIC]->(t1:Topic)
      MATCH (t1)-[:PREREQUISITE_FOR]->(t2:Topic)<-[:HAS_TOPIC]-(c)
      RETURN t1.topicId AS prereqId, t2.topicId AS topicId
      `, { courseId: neo4j_driver_1.default.int(courseId) });
        const prerequisites = new Map();
        prereqResult.records.forEach((rec) => {
            const pId = toNumberSafe(rec.get('prereqId'));
            const tId = toNumberSafe(rec.get('topicId'));
            if (!prerequisites.has(tId))
                prerequisites.set(tId, []);
            prerequisites.get(tId).push(pId);
        });
        const stateResult = await this.neo4jService.read(`
      MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic)<-[:HAS_TOPIC]-(c:Course {courseId: toInteger($courseId)})
      RETURN t.topicId AS topicId, k.score AS score, k.proficiency AS proficiency
      `, { studentId: neo4j_driver_1.default.int(studentId), courseId: neo4j_driver_1.default.int(courseId) });
        const knowledgeStates = new Map();
        stateResult.records.forEach((rec) => {
            knowledgeStates.set(toNumberSafe(rec.get('topicId')), {
                score: rec.get('score'),
                proficiency: rec.get('proficiency'),
            });
        });
        const recommendedTopics = engine_1.AdaptiveLearningEngine.generatePath(topics, knowledgeStates, prerequisites, limit);
        console.log(`Adaptive Engine Debug:
Course: ${courseId}, Student: ${studentId}
Total Topics fetched: ${topics.length}
Knowledge States Count: ${knowledgeStates.size}
Prerequisites Count: ${prerequisites.size}
Recommended Topics Count: ${recommendedTopics.length}`);
        const hydratedTopics = await Promise.all(recommendedTopics.map(async (topic) => {
            const resources = await this.prisma.resource.findMany({
                where: { topic_id: topic.topicId, status: 'Published' },
                orderBy: { sequence_number: 'asc' },
            });
            let finalResources = resources.length > 0 ? resources : await this.prisma.resource.findMany({
                where: { topic_id: topic.topicId },
                orderBy: { sequence_number: 'asc' },
            });
            if (finalResources.length > 0) {
                finalResources = await this.resourcesService.signResources(finalResources);
            }
            return {
                ...topic,
                resources: finalResources,
            };
        }));
        return {
            studentId,
            courseId,
            generatedAt: new Date(),
            recommendedTopics: hydratedTopics,
            knowledgeStates: Object.fromEntries(knowledgeStates)
        };
    }
    async generatePersonalizedLesson(studentId, courseId, topicId) {
        const stateResult = await this.neo4jService.read(`
      MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic {topicId: toInteger($topicId)})
      RETURN k.proficiency AS proficiency
      `, { studentId: neo4j_driver_1.default.int(studentId), topicId: neo4j_driver_1.default.int(topicId) });
        let proficiencyLevel = 'BEGINNER';
        if (stateResult.records.length > 0) {
            proficiencyLevel = stateResult.records[0].get('proficiency') || 'BEGINNER';
        }
        const [topic, student] = await Promise.all([
            this.prisma.topic.findUnique({ where: { topic_id: topicId } }),
            this.prisma.user.findUnique({ where: { user_id: studentId } })
        ]);
        if (!topic || !student) {
            throw new common_1.NotFoundException(`Topic or Student not found`);
        }
        const teachingPreference = student.teaching_preference;
        const aiSources = await this.prisma.resource.findMany({
            where: { topic_id: topicId, is_ai_source: true }
        });
        if (aiSources.length === 0) {
            return {
                lesson: "AI learning content is not available for this topic because no AI Knowledge Source has been approved yet.",
                sources: [],
                noAiSources: true
            };
        }
        const aiSourceIds = aiSources.map(r => r.resource_id);
        const cachedLesson = await this.prisma.topicAILesson.findUnique({
            where: {
                topic_id_proficiency_level_teaching_preference: {
                    topic_id: topicId,
                    proficiency_level: proficiencyLevel,
                    teaching_preference: teachingPreference
                }
            }
        });
        if (cachedLesson) {
            return {
                lesson: cachedLesson.content,
                sources: cachedLesson.sources
            };
        }
        let targetedConcepts = [];
        try {
            const performance = await this.learningProgressService.getConceptPerformance(studentId, courseId, topicId);
            const weak = performance.concepts.filter(c => c.performance === 'WEAK').map(c => c.conceptTag);
            const developing = performance.concepts.filter(c => c.performance === 'DEVELOPING').map(c => c.conceptTag);
            targetedConcepts = [...weak, ...developing];
            if (targetedConcepts.length > 0) {
                console.log(`[Targeted Retrieval] Using concepts for topic ${topicId}:`, targetedConcepts);
            }
        }
        catch (err) {
            console.warn("Failed to retrieve concept performance", err);
        }
        let responseData;
        try {
            const axios = require('axios');
            const response = await axios.post('http://localhost:8000/api/generate_lesson', {
                course_id: courseId,
                topic_id: topicId,
                topic_title: topic.topic_title,
                proficiency_level: proficiencyLevel,
                teaching_preference: teachingPreference,
                targeted_concepts: targetedConcepts,
                valid_resource_ids: aiSourceIds
            });
            responseData = response.data;
        }
        catch (err) {
            console.error('Error calling RAG service for personalized lesson:', err.message);
            throw new Error('Failed to generate personalized lesson from AI service');
        }
        let { lesson, sources } = responseData;
        try {
            const parsedLesson = JSON.parse(lesson);
            if (parsedLesson && Array.isArray(parsedLesson.blocks)) {
                for (const block of parsedLesson.blocks) {
                    if (block.visual && block.visual.query && !block.visual.url) {
                        try {
                            const result = await this.visualResourcesService.search(block.visual.query);
                            if (result) {
                                block.visual = { ...block.visual, ...result };
                            }
                            else {
                                delete block.visual;
                            }
                        }
                        catch (err) {
                            console.warn("Visual search failed, removing visual", err);
                            delete block.visual;
                        }
                    }
                }
                lesson = JSON.stringify(parsedLesson);
            }
        }
        catch (err) {
            console.warn("Failed to process visual resources for lesson", err);
        }
        try {
            const isError = (() => {
                try {
                    return JSON.parse(lesson).is_error === true;
                }
                catch {
                    return false;
                }
            })();
            if (!isError) {
                await this.prisma.topicAILesson.create({
                    data: {
                        topic_id: topicId,
                        proficiency_level: proficiencyLevel,
                        teaching_preference: teachingPreference,
                        content: lesson,
                        sources: sources
                    }
                });
            }
            else {
                console.warn(`Lesson generation failed for topic ${topicId}, skipping cache.`);
            }
        }
        catch (err) {
            console.error('Error saving cached lesson to database:', err.message);
        }
        return { lesson, sources };
    }
    async getDiagnostics(studentId, courseId, topicId) {
        let proficiencyLevel = 'BEGINNER';
        let knowledgeScore = 0;
        try {
            const stateResult = await this.neo4jService.read(`
        MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic {topicId: toInteger($topicId)})
        RETURN k.proficiency AS proficiency, k.score AS score
        `, { studentId: neo4j_driver_1.default.int(studentId), topicId: neo4j_driver_1.default.int(topicId) });
            if (stateResult.records.length > 0) {
                proficiencyLevel = stateResult.records[0].get('proficiency') || 'BEGINNER';
                knowledgeScore = toNumberSafe(stateResult.records[0].get('score'));
            }
        }
        catch (e) { }
        let conceptPerformance = null;
        let weakConcepts = [];
        let developingConcepts = [];
        let targetedConcepts = [];
        try {
            conceptPerformance = await this.learningProgressService.getConceptPerformance(studentId, courseId, topicId);
            weakConcepts = conceptPerformance.concepts.filter((c) => c.performance === 'WEAK').map((c) => c.conceptTag);
            developingConcepts = conceptPerformance.concepts.filter((c) => c.performance === 'DEVELOPING').map((c) => c.conceptTag);
            targetedConcepts = [...weakConcepts, ...developingConcepts];
        }
        catch (e) { }
        let recentInteractions = [];
        try {
            const activities = await this.prisma.learningActivity.findMany({
                where: { student_id: studentId, topic_id: topicId, activity_type: 'AI_BLOCK_INTERACTION' },
                orderBy: { created_at: 'desc' },
                take: 10
            });
            recentInteractions = activities.map(a => {
                let meta = {};
                if (a.metadata) {
                    meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
                }
                return {
                    id: a.activity_id,
                    timestamp: a.created_at,
                    blockType: meta.blockType,
                    isCorrect: meta.isCorrect,
                    attemptNumber: meta.attemptNumber,
                    conceptTags: meta.conceptTags || []
                };
            });
        }
        catch (e) { }
        let currentStage = 'LEARN';
        const hasTried = recentInteractions.some(i => i.blockType === 'TRY');
        const hasPracticed = recentInteractions.some(i => i.blockType === 'PRACTICE');
        const hasChallenge = recentInteractions.some(i => i.blockType === 'CHALLENGE');
        if (proficiencyLevel === 'MASTER' || proficiencyLevel === 'ADVANCED')
            currentStage = 'MASTER';
        else if (proficiencyLevel === 'PROFICIENT')
            currentStage = 'CHECK';
        else if (hasChallenge)
            currentStage = 'CHECK';
        else if (hasPracticed)
            currentStage = 'PRACTICE';
        else if (hasTried)
            currentStage = 'TRY';
        else if (recentInteractions.length > 0)
            currentStage = 'UNDERSTAND';
        return {
            studentId,
            courseId,
            topicId,
            diagnostics: {
                topicProficiency: {
                    level: proficiencyLevel,
                    score: knowledgeScore
                },
                conceptPerformance: conceptPerformance ? conceptPerformance.concepts : [],
                targetedRetrieval: {
                    used: targetedConcepts.length > 0,
                    priorityConceptsPassedToLLM: targetedConcepts,
                    weakConcepts,
                    developingConcepts
                },
                recentInteractions,
                adaptiveRouting: {
                    inferredCurrentStage: currentStage,
                    lastInteractionResult: recentInteractions.length > 0 ? (recentInteractions[0].isCorrect ? 'SUCCESS' : 'FAILURE') : 'NONE',
                    retryRequired: recentInteractions.length > 0 && recentInteractions[0].isCorrect === false
                }
            }
        };
    }
    async getStudentDashboard(studentId, courseId) {
        const enrollment = await this.prisma.enrollment.findFirst({
            where: { user_id: studentId, course_id: courseId }
        });
        if (!enrollment) {
            throw new common_1.NotFoundException('Course must belong to an enrollment for that student');
        }
        const stateResult = await this.neo4jService.read(`
      MATCH (c:Course {courseId: toInteger($courseId)})-[:HAS_TOPIC]->(t:Topic)
      OPTIONAL MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t)
      RETURN t.topicId AS topicId, t.title AS title, 
             k.proficiency AS proficiency, k.score AS score, 
             k.attemptCount AS attemptCount, k.lastAssessmentAt AS lastAssessmentAt
      ORDER BY t.sequenceNumber
      `, { studentId: neo4j_driver_1.default.int(studentId), courseId: neo4j_driver_1.default.int(courseId) });
        const topicMastery = stateResult.records.map(rec => ({
            topic_id: toNumberSafe(rec.get('topicId')),
            title: rec.get('title'),
            proficiency: rec.get('proficiency') || 'UNASSESSED',
            score: rec.get('score') != null ? Math.round(Number(rec.get('score')) * 100) : null,
            attemptCount: toNumberSafe(rec.get('attemptCount')),
            lastAssessmentAt: rec.get('lastAssessmentAt') ? new Date(rec.get('lastAssessmentAt').toString()) : null
        }));
        const totalTopics = topicMastery.length;
        const completedTopics = topicMastery.filter(t => ['PROFICIENT', 'ADVANCED'].includes(t.proficiency)).length;
        const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
        const courseProgress = {
            enrolled: true,
            completedTopics,
            totalTopics,
            progressPercentage
        };
        const plp = await this.generatePath(studentId, courseId, { limit: 1 });
        const currentRecommendation = plp.recommendedTopics.length > 0 ? plp.recommendedTopics[0] : null;
        const strengths = [];
        const areasToImprove = [];
        topicMastery.forEach(t => {
            if (['PROFICIENT', 'ADVANCED'].includes(t.proficiency)) {
                strengths.push({ name: t.title, type: 'TOPIC', proficiency: t.proficiency });
            }
            else if (['DEVELOPING', 'BEGINNER'].includes(t.proficiency)) {
                let reason = '';
                if (currentRecommendation && currentRecommendation.topicId === t.topic_id) {
                    reason = currentRecommendation.reason;
                }
                areasToImprove.push({ name: t.title, type: 'TOPIC', proficiency: t.proficiency, reason });
            }
        });
        try {
            const perfMap = await this.learningProgressService.getConceptPerformance(studentId, courseId);
            if (perfMap && perfMap.concepts) {
                perfMap.concepts.forEach((c) => {
                    if (c.performance === 'STRONG')
                        strengths.push({ name: c.conceptTag, type: 'CONCEPT', proficiency: c.performance });
                    else if (c.performance === 'WEAK' || c.performance === 'DEVELOPING')
                        areasToImprove.push({ name: c.conceptTag, type: 'CONCEPT', proficiency: c.performance });
                });
            }
        }
        catch (e) {
            console.warn("Failed to get concept performance for dashboard", e);
        }
        const attempts = await this.prisma.assessmentAttempt.findMany({
            where: { student_id: studentId, assessment: { course_id: courseId }, status: 'SUBMITTED' },
            include: { assessment: true },
            orderBy: { submitted_at: 'asc' }
        });
        const assessmentHistory = attempts.map(a => ({
            date: a.submitted_at,
            score: a.percentage ? Number(a.percentage) : null,
            title: a.assessment.title || `Assessment ${a.assessment.assessment_id}`,
            type: a.assessment.assessment_type
        }));
        const activities = await this.prisma.learningActivity.findMany({
            where: { student_id: studentId, course_id: courseId },
            orderBy: { created_at: 'desc' },
            take: 20,
            include: { topic: true }
        });
        const learningActivity = activities.map(a => ({
            date: a.created_at,
            type: a.activity_type,
            description: `${a.activity_type.replace(/_/g, ' ')} ${a.topic ? 'in ' + a.topic.topic_title : ''}`
        }));
        const topicResults = await this.prisma.assessmentTopicResult.findMany({
            where: { attempt: { student_id: studentId, assessment: { course_id: courseId } } },
            include: { attempt: true, topic: true },
            orderBy: { attempt: { submitted_at: 'asc' } }
        });
        const knowledgeGrowth = topicResults.map(tr => ({
            date: tr.attempt.submitted_at,
            score: tr.percentage ? Number(tr.percentage) : 0,
            topic: tr.topic.topic_title
        }));
        const recentInsights = [];
        const topicTrends = new Map();
        topicResults.forEach(tr => {
            if (!topicTrends.has(tr.topic_id))
                topicTrends.set(tr.topic_id, []);
            topicTrends.get(tr.topic_id).push(tr);
        });
        const profOrder = { 'UNASSESSED': 0, 'BEGINNER': 1, 'DEVELOPING': 2, 'PROFICIENT': 3, 'ADVANCED': 4 };
        for (const [topicId, results] of topicTrends.entries()) {
            if (results.length >= 2) {
                const prev = results[results.length - 2];
                const curr = results[results.length - 1];
                const prevProf = prev.proficiency_level;
                const currProf = curr.proficiency_level;
                if (profOrder[currProf] > profOrder[prevProf]) {
                    recentInsights.push({
                        type: 'PROFICIENCY_IMPROVED',
                        title: 'Proficiency Improved',
                        message: `You improved from ${prevProf} to ${currProf} in ${curr.topic.topic_title}.`,
                        evidence: { topicId, proficiency: currProf, score: Number(curr.percentage) },
                        date: curr.attempt.submitted_at
                    });
                }
                else if (profOrder[currProf] < profOrder[prevProf]) {
                    recentInsights.push({
                        type: 'PROFICIENCY_DECLINED',
                        title: 'Needs Review',
                        message: `Your proficiency in ${curr.topic.topic_title} dropped to ${currProf}.`,
                        evidence: { topicId, proficiency: currProf, score: Number(curr.percentage) },
                        date: curr.attempt.submitted_at
                    });
                }
            }
        }
        try {
            const perfMap = await this.learningProgressService.getConceptPerformance(studentId, courseId);
            if (perfMap && perfMap.concepts) {
                const weakConcepts = perfMap.concepts.filter((c) => c.performance === 'WEAK');
                weakConcepts.forEach((c) => {
                    recentInsights.push({
                        type: 'CONCEPT_NEEDS_REVIEW',
                        title: 'Concept Needs Review',
                        message: `Recent activity shows the concept "${c.conceptTag}" needs more practice.`,
                        evidence: { conceptTag: c.conceptTag, performance: c.performance },
                        date: new Date()
                    });
                });
            }
        }
        catch (e) { }
        recentInsights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const topInsights = recentInsights.slice(0, 5);
        if (currentRecommendation) {
            let insightType = 'NEW_TOPIC_AVAILABLE';
            if (currentRecommendation.proficiency === 'BEGINNER')
                insightType = 'PREREQUISITE';
            else if (currentRecommendation.proficiency === 'DEVELOPING')
                insightType = 'NEEDS_PRACTICE';
            currentRecommendation.insight = {
                type: insightType,
                title: currentRecommendation.reason,
                message: currentRecommendation.extendedReason,
                evidence: {
                    topicId: currentRecommendation.topicId,
                    proficiency: currentRecommendation.proficiency,
                    score: currentRecommendation.knowledgeScore != null ? Math.round(currentRecommendation.knowledgeScore * 100) : 0
                }
            };
        }
        return {
            courseProgress,
            topicMastery,
            strengths,
            areasToImprove,
            assessmentHistory,
            learningActivity,
            knowledgeGrowth,
            currentRecommendation,
            recentInsights: topInsights
        };
    }
    async getStudentGoals(studentId, courseId) {
        const goals = await this.prisma.studentCourseGoal.findMany({
            where: { student_id: studentId, course_id: courseId },
            include: { target_topic: true },
            orderBy: { created_at: 'desc' }
        });
        if (goals.length === 0)
            return [];
        const stateResult = await this.neo4jService.read(`
      MATCH (c:Course {courseId: toInteger($courseId)})-[:HAS_TOPIC]->(t:Topic)
      OPTIONAL MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t)
      RETURN t.topicId AS topicId, k.proficiency AS proficiency
      `, { studentId: neo4j_driver_1.default.int(studentId), courseId: neo4j_driver_1.default.int(courseId) });
        let completedTopicsCount = 0;
        const topicProficiency = new Map();
        stateResult.records.forEach(rec => {
            const topicId = toNumberSafe(rec.get('topicId'));
            const proficiency = rec.get('proficiency') || 'UNASSESSED';
            topicProficiency.set(topicId, proficiency);
            if (['PROFICIENT', 'ADVANCED'].includes(proficiency)) {
                completedTopicsCount++;
            }
        });
        const totalTopics = stateResult.records.length;
        const attemptsCount = await this.prisma.assessmentAttempt.count({
            where: { student_id: studentId, assessment: { course_id: courseId }, status: 'SUBMITTED' }
        });
        const profOrder = { 'UNASSESSED': 0, 'BEGINNER': 1, 'DEVELOPING': 2, 'PROFICIENT': 3, 'ADVANCED': 4 };
        const enrichedGoals = [];
        for (const goal of goals) {
            let currentValue = 0;
            let targetValue = goal.target_value;
            let isCompleted = goal.status === 'COMPLETED';
            let progressMessage = '';
            let progressPercentage = 0;
            switch (goal.goal_type) {
                case 'COMPLETE_COURSE':
                    currentValue = completedTopicsCount;
                    targetValue = totalTopics;
                    if (currentValue >= targetValue && targetValue > 0)
                        isCompleted = true;
                    progressMessage = `${currentValue} / ${targetValue} topics mastered`;
                    progressPercentage = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
                    break;
                case 'MASTER_TOPICS':
                    currentValue = completedTopicsCount;
                    if (currentValue >= targetValue)
                        isCompleted = true;
                    progressMessage = `${currentValue} / ${targetValue} topics mastered`;
                    progressPercentage = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
                    break;
                case 'IMPROVE_TOPIC':
                    if (goal.target_topic_id) {
                        const currProf = topicProficiency.get(goal.target_topic_id) || 'UNASSESSED';
                        currentValue = currProf;
                        targetValue = goal.target_proficiency;
                        if (profOrder[currProf] >= profOrder[targetValue])
                            isCompleted = true;
                        progressMessage = `${currProf} → target ${targetValue}`;
                        progressPercentage = profOrder[currProf] >= profOrder[targetValue] ? 100 : Math.round((profOrder[currProf] / profOrder[targetValue]) * 100);
                    }
                    break;
                case 'COMPLETE_ASSESSMENTS':
                    currentValue = attemptsCount;
                    if (currentValue >= targetValue)
                        isCompleted = true;
                    progressMessage = `${currentValue} / ${targetValue} completed`;
                    progressPercentage = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0;
                    break;
            }
            if (isCompleted && goal.status !== 'COMPLETED') {
                await this.prisma.studentCourseGoal.update({
                    where: { goal_id: goal.goal_id },
                    data: { status: 'COMPLETED' }
                });
                goal.status = 'COMPLETED';
            }
            enrichedGoals.push({
                ...goal,
                currentValue,
                targetValue,
                progressMessage,
                progressPercentage,
                isCompleted
            });
        }
        return enrichedGoals;
    }
    async createStudentGoal(studentId, courseId, body) {
        const enrollment = await this.prisma.enrollment.findFirst({
            where: { user_id: studentId, course_id: courseId }
        });
        if (!enrollment) {
            throw new common_1.NotFoundException('Student is not enrolled in this course.');
        }
        if (body.target_topic_id) {
            const topic = await this.prisma.topic.findFirst({
                where: { topic_id: body.target_topic_id, course_id: courseId }
            });
            if (!topic)
                throw new common_1.NotFoundException('Topic does not belong to this course.');
        }
        return this.prisma.studentCourseGoal.create({
            data: {
                student_id: studentId,
                course_id: courseId,
                goal_type: body.goal_type,
                target_value: body.target_value,
                target_topic_id: body.target_topic_id,
                target_proficiency: body.target_proficiency,
                status: 'ACTIVE'
            }
        });
    }
    async askTutor(studentId, courseId, body) {
        const { topic_id, query } = body;
        if (!query)
            throw new Error('Query is required');
        const enrollment = await this.prisma.enrollment.findFirst({
            where: { user_id: studentId, course_id: courseId }
        });
        if (!enrollment)
            throw new common_1.NotFoundException('Student is not enrolled in this course.');
        if (topic_id) {
            const topic = await this.prisma.topic.findFirst({
                where: { topic_id: topic_id, course_id: courseId }
            });
            if (!topic)
                throw new common_1.NotFoundException('Topic does not belong to this course.');
        }
        const student = await this.prisma.user.findUnique({
            where: { user_id: studentId },
            select: { teaching_preference: true }
        });
        let proficiency = 'UNASSESSED';
        if (topic_id) {
            const stateResult = await this.neo4jService.read(`
         MATCH (s:Student {studentId: toInteger($studentId)})-[k:KNOWLEDGE_STATE]->(t:Topic {topicId: toInteger($topicId)})
         RETURN k.proficiency AS proficiency
         `, { studentId: neo4j_driver_1.default.int(studentId), topicId: neo4j_driver_1.default.int(topic_id) });
            if (stateResult.records.length > 0) {
                proficiency = stateResult.records[0].get('proficiency');
            }
        }
        let weakConcepts = [];
        try {
            const perfMap = await this.learningProgressService.getConceptPerformance(studentId, courseId);
            if (perfMap && perfMap.concepts) {
                weakConcepts = perfMap.concepts
                    .filter((c) => c.performance === 'WEAK' || c.performance === 'DEVELOPING')
                    .map((c) => c.conceptTag);
            }
        }
        catch (e) { }
        let tutorResult;
        try {
            const ragUrl = process.env.RAG_SERVICE_URL || 'http://localhost:8000';
            const ragResponse = await fetch(`${ragUrl}/api/tutor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    course_id: courseId,
                    topic_id: topic_id || null,
                    proficiency,
                    teaching_preference: student?.teaching_preference || 'DIRECT',
                    weak_concepts: weakConcepts
                })
            });
            if (!ragResponse.ok) {
                throw new Error(`RAG service unavailable: ${ragResponse.status} ${ragResponse.statusText}`);
            }
            tutorResult = await ragResponse.json();
        }
        catch (e) {
            throw new common_1.HttpException(`Tutor error: ${e.message}`, 500);
        }
        const validTopicId = topic_id || (await this.prisma.topic.findFirst({ where: { course_id: courseId } }))?.topic_id;
        if (validTopicId) {
            await this.prisma.learningActivity.create({
                data: {
                    student_id: studentId,
                    course_id: courseId,
                    topic_id: validTopicId,
                    activity_type: 'RESOURCE_PROGRESS',
                    metadata: {
                        type: 'TUTOR_INTERACTION',
                        query: query,
                        sources: tutorResult.sources?.length || 0
                    }
                }
            });
        }
        return tutorResult;
    }
};
exports.AdaptiveLearningService = AdaptiveLearningService;
exports.AdaptiveLearningService = AdaptiveLearningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [neo4j_service_1.Neo4jService,
        prisma_service_1.PrismaService,
        resources_service_1.ResourcesService,
        learning_progress_service_1.LearningProgressService,
        visual_resources_service_1.VisualResourcesService])
], AdaptiveLearningService);
//# sourceMappingURL=adaptive-learning.service.js.map