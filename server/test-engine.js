const { AdaptiveLearningEngine } = require('./dist/adaptive-learning/engine.js');

const topics = [
  { topicId: 1, title: 'Intro', sequenceNumber: 1, difficulty: 'Beginner' },
  { topicId: 2, title: 'Functions', sequenceNumber: 2, difficulty: 'Intermediate' }
];

const knowledgeStates = new Map();
// Unassessed

const prerequisites = new Map();
prerequisites.set(2, [1]);

try {
  const result = AdaptiveLearningEngine.generatePath(topics, knowledgeStates, prerequisites, 5);
  console.log("Result:", result);
} catch (e) {
  console.error("Error:", e);
}
