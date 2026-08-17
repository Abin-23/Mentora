"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveLearningEngine = void 0;
class AdaptiveLearningEngine {
    static generatePath(topics, knowledgeStates, prerequisites, limit = 5) {
        this.validateNoCircularDependencies(topics, prerequisites);
        const recommendedPath = [];
        const simulatedKnowledge = new Map(knowledgeStates);
        while (recommendedPath.length < limit) {
            const candidates = topics.filter((t) => {
                const state = simulatedKnowledge.get(t.topicId);
                if (!state)
                    return true;
                return ['BEGINNER', 'DEVELOPING', 'UNASSESSED'].includes(state.proficiency);
            });
            if (candidates.length === 0) {
                break;
            }
            const eligibleTopics = candidates.filter((t) => {
                const prereqs = prerequisites.get(t.topicId) || [];
                return prereqs.every((prereqId) => {
                    const pState = simulatedKnowledge.get(prereqId);
                    if (!pState)
                        return false;
                    return ['PROFICIENT', 'ADVANCED', 'SIMULATED_MASTERED'].includes(pState.proficiency);
                });
            });
            if (eligibleTopics.length === 0) {
                break;
            }
            const scoredTopics = eligibleTopics.map((t) => {
                const state = simulatedKnowledge.get(t.topicId) || {
                    score: 0,
                    proficiency: 'UNASSESSED',
                };
                const sequenceScore = Math.max(0, 1000 - t.sequenceNumber);
                const knowledgeNeedScore = (1 - state.score) * 100;
                const priorityScore = sequenceScore * 1000 + knowledgeNeedScore;
                let reason = 'New Topic';
                let extendedReason = 'Because you have not studied this topic yet.';
                if (state.proficiency === 'BEGINNER') {
                    reason = 'Needs foundational review';
                    extendedReason = 'Because your proficiency is BEGINNER and prerequisite topics need to be strengthened first.';
                }
                else if (state.proficiency === 'DEVELOPING') {
                    reason = 'Needs further practice';
                    const scorePerc = Math.round(state.score * 100);
                    extendedReason = `Because your score is ${scorePerc}% and further practice is required to reach proficiency.`;
                }
                return {
                    ...t,
                    knowledgeScore: state.score,
                    proficiency: state.proficiency,
                    priorityScore,
                    reason,
                    extendedReason,
                };
            });
            scoredTopics.sort((a, b) => b.priorityScore - a.priorityScore);
            const bestTopic = scoredTopics[0];
            if (recommendedPath.find(r => r.topicId === bestTopic.topicId)) {
                break;
            }
            recommendedPath.push(bestTopic);
            simulatedKnowledge.set(bestTopic.topicId, {
                score: 1.0,
                proficiency: 'SIMULATED_MASTERED',
            });
        }
        return recommendedPath;
    }
    static validateNoCircularDependencies(topics, prerequisites) {
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (node) => {
            visited.add(node);
            recursionStack.add(node);
            const neighbors = prerequisites.get(node) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor);
                }
                else if (recursionStack.has(neighbor)) {
                    throw new Error(`Circular dependency detected involving topic ${node} and ${neighbor}`);
                }
            }
            recursionStack.delete(node);
        };
        for (const t of topics) {
            if (!visited.has(t.topicId)) {
                dfs(t.topicId);
            }
        }
    }
}
exports.AdaptiveLearningEngine = AdaptiveLearningEngine;
//# sourceMappingURL=engine.js.map