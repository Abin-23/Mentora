import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useLearningProgress(token: string | null) {
  const [progressId, setProgressId] = useState<number | null>(null);

  const startProgress = useCallback(async (courseId: number, topicId: number, resourceId: number) => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/learning-progress/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ course_id: courseId, topic_id: topicId, resource_id: resourceId })
      });
      if (response.ok) {
        const data = await response.json();
        setProgressId(data.progress_id);
        return data.progress_id;
      }
    } catch (err) {
      console.error('Failed to start progress', err);
    }
    return null;
  }, [token]);

  const updateProgress = useCallback(async (id: number, progressPercent: number, timeSpentSeconds: number) => {
    if (!token || !id) return;
    try {
      await fetch(`${API_URL}/learning-progress/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ progress_percent: progressPercent, time_spent_seconds: timeSpentSeconds })
      });
    } catch (err) {
      console.error('Failed to update progress', err);
    }
  }, [token]);

  const completeProgress = useCallback(async (id: number) => {
    if (!token || !id) return;
    try {
      await fetch(`${API_URL}/learning-progress/${id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Failed to complete progress', err);
    }
  }, [token]);

  const fetchTopicProgress = useCallback(async (topicId: number) => {
    if (!token) return 0;
    try {
      const res = await fetch(`${API_URL}/learning-progress/topics/${topicId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.text().then(t => parseInt(t) || 0);
      }
    } catch (err) {
      console.error('Failed to fetch topic progress', err);
    }
    return 0;
  }, [token]);

  const fetchResourceProgressForTopic = useCallback(async (topicId: number) => {
    if (!token) return [];
    try {
      const res = await fetch(`${API_URL}/learning-progress/topics/${topicId}/resources`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to fetch resource progress', err);
    }
    return [];
  }, [token]);

  return {
    progressId,
    startProgress,
    updateProgress,
    completeProgress,
    fetchTopicProgress,
    fetchResourceProgressForTopic
  };
}
