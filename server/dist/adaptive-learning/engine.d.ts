export interface TopicData {
    topicId: number;
    title: string;
    sequenceNumber: number;
    difficulty?: string;
}
export interface KnowledgeState {
    score: number;
    proficiency: string;
}
export interface RecommendedTopic extends TopicData {
    reason: string;
    extendedReason?: string;
    knowledgeScore: number;
    proficiency: string;
    priorityScore: number;
}
export declare class AdaptiveLearningEngine {
    static generatePath(topics: TopicData[], knowledgeStates: Map<number, KnowledgeState>, prerequisites: Map<number, number[]>, limit?: number): RecommendedTopic[];
    static validateNoCircularDependencies(topics: TopicData[], prerequisites: Map<number, number[]>): void;
}
