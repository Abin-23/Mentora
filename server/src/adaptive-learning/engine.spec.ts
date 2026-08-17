import { AdaptiveLearningEngine, TopicData, KnowledgeState } from './engine';

describe('AdaptiveLearningEngine', () => {
  let topics: TopicData[];
  let knowledgeStates: Map<number, KnowledgeState>;
  let prerequisites: Map<number, number[]>;

  beforeEach(() => {
    topics = [
      { topicId: 1, title: 'Basics', sequenceNumber: 1 },
      { topicId: 2, title: 'Intermediate 1', sequenceNumber: 2 },
      { topicId: 3, title: 'Intermediate 2', sequenceNumber: 3 },
      { topicId: 4, title: 'Advanced', sequenceNumber: 4 },
    ];
    knowledgeStates = new Map();
    prerequisites = new Map();
  });

  it('should identify and select weak or unassessed topics (weak-topic selection)', () => {
    knowledgeStates.set(1, { score: 0.9, proficiency: 'ADVANCED' });
    knowledgeStates.set(2, { score: 0.4, proficiency: 'DEVELOPING' });
    // 3 is unassessed
    knowledgeStates.set(4, { score: 0.8, proficiency: 'PROFICIENT' });

    const path = AdaptiveLearningEngine.generatePath(topics, knowledgeStates, prerequisites, 5);

    expect(path.length).toBe(2);
    expect(path.map((t) => t.topicId)).toEqual(expect.arrayContaining([2, 3]));
  });

  it('should enforce prerequisite readiness', () => {
    prerequisites.set(2, [1]);
    prerequisites.set(3, [2]);
    
    // Topic 1 is BEGINNER, so Topic 2 shouldn't be eligible yet.
    knowledgeStates.set(1, { score: 0.3, proficiency: 'BEGINNER' });

    // Topic 2 is unassessed
    
    // With limit 1, we should only get Topic 1
    const path = AdaptiveLearningEngine.generatePath(topics, knowledgeStates, prerequisites, 1);
    
    expect(path.length).toBe(1);
    expect(path[0].topicId).toBe(1);
  });

  it('should generate a sequence simulating mastery (learning-path generation)', () => {
    prerequisites.set(2, [1]);
    prerequisites.set(3, [2]);
    prerequisites.set(4, [3]);

    // All topics unassessed
    const path = AdaptiveLearningEngine.generatePath(topics, knowledgeStates, prerequisites, 3);
    
    expect(path.length).toBe(3);
    expect(path[0].topicId).toBe(1);
    expect(path[1].topicId).toBe(2);
    expect(path[2].topicId).toBe(3);
  });

  it('should rank topics based on sequence and knowledge score (ranking)', () => {
    // Both 1 and 2 are eligible (no prereqs).
    // Topic 1 has sequence 1, Topic 2 has sequence 2.
    // Topic 1 is BEGINNER (score 0.1), Topic 2 is DEVELOPING (score 0.4)
    knowledgeStates.set(1, { score: 0.1, proficiency: 'BEGINNER' });
    knowledgeStates.set(2, { score: 0.4, proficiency: 'DEVELOPING' });

    const path = AdaptiveLearningEngine.generatePath(topics, knowledgeStates, prerequisites, 2);
    
    expect(path.length).toBe(2);
    expect(path[0].topicId).toBe(1); // sequence 1 + lower score makes it higher priority
    expect(path[1].topicId).toBe(2);
  });

  it('should detect circular dependencies and throw error', () => {
    prerequisites.set(1, [2]);
    prerequisites.set(2, [1]);

    expect(() => {
      AdaptiveLearningEngine.generatePath(topics, knowledgeStates, prerequisites, 5);
    }).toThrow(/Circular dependency detected/);
  });
});
