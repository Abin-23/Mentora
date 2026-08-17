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

export class AdaptiveLearningEngine {
  /**
   * Generates a personalized learning path based on the student's knowledge state and course prerequisites.
   * Uses a deterministic rule-based scoring algorithm.
   */
  public static generatePath(
    topics: TopicData[],
    knowledgeStates: Map<number, KnowledgeState>,
    prerequisites: Map<number, number[]>,
    limit: number = 5,
  ): RecommendedTopic[] {
    // 1. Detect Circular Dependencies
    this.validateNoCircularDependencies(topics, prerequisites);

    const recommendedPath: RecommendedTopic[] = [];
    const simulatedKnowledge = new Map<number, KnowledgeState>(knowledgeStates);

    while (recommendedPath.length < limit) {
      // 2. Identify BEGINNER, DEVELOPING, or UNASSESSED topics
      const candidates = topics.filter((t) => {
        const state = simulatedKnowledge.get(t.topicId);
        if (!state) return true; // Unassessed
        return ['BEGINNER', 'DEVELOPING', 'UNASSESSED'].includes(
          state.proficiency,
        );
      });

      if (candidates.length === 0) {
        break; // No more topics to learn
      }

      // 3. Verify Prerequisites are sufficiently mastered
      const eligibleTopics = candidates.filter((t) => {
        const prereqs = prerequisites.get(t.topicId) || [];
        return prereqs.every((prereqId) => {
          const pState = simulatedKnowledge.get(prereqId);
          if (!pState) return false;
          return ['PROFICIENT', 'ADVANCED', 'SIMULATED_MASTERED'].includes(
            pState.proficiency,
          );
        });
      });

      if (eligibleTopics.length === 0) {
        break; // Blocked by unmastered prerequisites that aren't in the candidate list?
        // Wait, if blocked, it means they need a prereq but the prereq itself might be blocked or not a candidate.
        // Actually, if we get here, no more eligible topics can be studied next.
      }

      // 4. Rank eligible topics using a deterministic scoring algorithm
      const scoredTopics: RecommendedTopic[] = eligibleTopics.map((t) => {
        const state = simulatedKnowledge.get(t.topicId) || {
          score: 0,
          proficiency: 'UNASSESSED',
        };

        // Priority Score Formula:
        // Heavily weight sequence number to maintain structured learning path.
        // Also factor in knowledge score (lower score = higher priority).
        const sequenceScore = Math.max(0, 1000 - t.sequenceNumber);
        const knowledgeNeedScore = (1 - state.score) * 100;

        const priorityScore = sequenceScore * 1000 + knowledgeNeedScore;

        let reason = 'New Topic';
        let extendedReason = 'Because you have not studied this topic yet.';
        if (state.proficiency === 'BEGINNER') {
          reason = 'Needs foundational review';
          extendedReason = 'Because your proficiency is BEGINNER and prerequisite topics need to be strengthened first.';
        } else if (state.proficiency === 'DEVELOPING') {
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

      // Sort descending by priority score
      scoredTopics.sort((a, b) => b.priorityScore - a.priorityScore);

      const bestTopic = scoredTopics[0];

      // Prevent infinite loops just in case
      if (recommendedPath.find(r => r.topicId === bestTopic.topicId)) {
          break;
      }

      recommendedPath.push(bestTopic);

      // Simulate mastery of this topic so subsequent topics can be unlocked in the path
      simulatedKnowledge.set(bestTopic.topicId, {
        score: 1.0,
        proficiency: 'SIMULATED_MASTERED',
      });
    }

    return recommendedPath;
  }

  /**
   * Validates that the prerequisite graph has no circular dependencies using DFS.
   */
  public static validateNoCircularDependencies(
    topics: TopicData[],
    prerequisites: Map<number, number[]>,
  ) {
    const visited = new Set<number>();
    const recursionStack = new Set<number>();

    const dfs = (node: number) => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = prerequisites.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          throw new Error(
            `Circular dependency detected involving topic ${node} and ${neighbor}`,
          );
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
