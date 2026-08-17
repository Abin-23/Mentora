import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useTopicAssessment(token: string | null) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTopicAssessment = useCallback(async (courseId: number, topicId: number) => {
    if (!token) {
      setError('Not authenticated');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/assessments/course/${courseId}/topic/${topicId}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate topic assessment');
      }

      const assessment = await response.json();
      setIsGenerating(false);
      return assessment;
    } catch (err: any) {
      console.error('Error generating topic assessment:', err);
      setError(err.message || 'An error occurred');
      setIsGenerating(false);
      return null;
    }
  }, [token]);

  return {
    generateTopicAssessment,
    isGenerating,
    error
  };
}
