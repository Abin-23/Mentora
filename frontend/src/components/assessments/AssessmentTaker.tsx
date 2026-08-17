import { useState, useEffect } from 'react';

interface AssessmentTakerProps {
  assessmentId: number;
  onClose: () => void;
}

export default function AssessmentTaker({ assessmentId, onClose }: AssessmentTakerProps) {
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionId -> optionId
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const startAttempt = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/assessments/${assessmentId}/attempts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start attempt');
      
      // Need to fetch full assessment questions. Wait, startAttempt doesn't return questions, 
      // but in the actual flow, startAttempt should return the assessment or we fetch it.
      // Let's just fetch the assessment details directly.
      const assessmentRes = await fetch(`${API_URL}/assessments/${assessmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assessmentData = await assessmentRes.json();
      
      setAttempt({ ...data, assessment: assessmentData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only set up security tracking if the assessment is actually running
    if (!hasStarted || isSubmitting) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && attempt?.attempt_id && !isSubmitting) {
        await logSecurityEvent('TAB_SWITCH', 'HIGH');
        setViolationMessage('Assessment automatically submitted due to a security violation (Tab switched).');
        await forceSubmitAssessment();
      }
    };
    
    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement && attempt?.attempt_id && !isSubmitting) {
        await logSecurityEvent('FULLSCREEN_EXIT', 'HIGH');
        setViolationMessage('Assessment automatically submitted due to a security violation (Exited fullscreen).');
        await forceSubmitAssessment();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, isSubmitting, attempt]);

  const startAssessmentUI = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request failed', e);
    }
    setHasStarted(true);
    startAttempt();
  };

  const logSecurityEvent = async (eventType: string, severity: string) => {
    if (!attempt?.attempt_id) return;
    try {
      await fetch(`${API_URL}/assessments/attempts/${attempt.attempt_id}/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ eventType, severity })
      });
    } catch (e) {
      console.error('Failed to log event', e);
    }
  };

  const handleSelectOption = async (questionId: number, optionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    
    try {
      await fetch(`${API_URL}/assessments/attempts/${attempt.attempt_id}/answers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ questionId, selectedOptionId: optionId })
      });
    } catch (e) {
      console.error('Failed to save answer', e);
    }
  };

  const forceSubmitAssessment = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`${API_URL}/assessments/attempts/${attempt.attempt_id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Do not call onClose immediately, let the violation message show
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAssessment = async () => {
    if (!window.confirm('Are you sure you want to submit your assessment?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/assessments/attempts/${attempt.attempt_id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit');
      
      alert(`Assessment Submitted! Score: ${data.percentage}%`);
      
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(e => console.warn(e));
      }
      
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>;
  }

  if (error) {
    return (
      <div className="p-10 text-center text-error">
        <span className="material-symbols-outlined text-5xl mb-4">error</span>
        <h3 className="text-xl font-bold">{error}</h3>
        <button onClick={onClose} className="mt-4 px-6 py-2 bg-white text-error rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  if (violationMessage) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-error/50 p-10 h-full flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-6xl text-error mb-4">gavel</span>
        <h2 className="text-2xl font-bold text-error mb-2">Security Violation</h2>
        <p className="text-text-secondary mb-6">{violationMessage}</p>
        <button onClick={() => {
           if (document.fullscreenElement) document.exitFullscreen().catch(e => console.warn(e));
           onClose();
        }} className="bg-error text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all">
          Exit Assessment
        </button>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-outline-variant/30 p-10 h-full flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-6xl text-primary mb-4">fullscreen</span>
        <h2 className="text-2xl font-bold mb-2">Ready to begin?</h2>
        <p className="text-text-secondary mb-8 max-w-md">This assessment requires fullscreen mode. Navigating away from this tab or exiting fullscreen will automatically submit your attempt.</p>
        <button onClick={startAssessmentUI} className="bg-primary text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined">play_arrow</span> Start Assessment
        </button>
      </div>
    );
  }

  if (!attempt || !attempt.assessment) return null;

  const questions = attempt.assessment.questions || [];

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-outline-variant/30 p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
        <div>
          <h2 className="text-2xl font-bold">{attempt.assessment.title}</h2>
          <p className="text-sm text-text-secondary">Attempt {attempt.attempt_number} of {attempt.assessment.max_attempts}</p>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-error transition-colors">
           <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8">
        {questions.map((qMap: any, index: number) => {
          const q = qMap.question;
          if (!q) return null; // safety check
          return (
            <div key={q.question_id} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30">
              <h3 className="font-bold text-lg mb-4 flex gap-3">
                <span className="text-primary">{index + 1}.</span> {q.question_text}
              </h3>
              <div className="space-y-3">
                {q.options?.map((opt: any) => (
                  <label key={opt.option_id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.question_id] === opt.option_id ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:bg-surface-container-low'}`}>
                    <input 
                      type="radio" 
                      name={`question-${q.question_id}`} 
                      value={opt.option_id}
                      checked={answers[q.question_id] === opt.option_id}
                      onChange={() => handleSelectOption(q.question_id, opt.option_id)}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-on-surface font-medium">{opt.option_text}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {questions.length === 0 && (
          <p className="text-center text-text-secondary">No questions loaded.</p>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-outline-variant/30 flex justify-end">
        <button onClick={submitAssessment} disabled={isSubmitting} className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-md">
          {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">done_all</span>}
          Submit Assessment
        </button>
      </div>
    </div>
  );
}
