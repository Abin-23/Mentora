export declare class GeneratePathDto {
    limit?: number;
}
export declare class LearningPathTopicDto {
    topicId: number;
    title: string;
    sequenceNumber: number;
    reason: string;
    knowledgeScore: number;
    proficiency: string;
    resources?: any[];
}
export declare class LearningPathResponseDto {
    studentId: number;
    courseId: number;
    recommendedTopics: LearningPathTopicDto[];
    generatedAt: Date;
}
