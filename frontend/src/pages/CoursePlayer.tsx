import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import { useLearningProgress } from '../hooks/useLearningProgress';
import { useTopicAssessment } from '../hooks/useTopicAssessment';
import StudentLayout from '../components/layout/StudentLayout';
import CustomPdfViewer from '../components/CustomPdfViewer';
import AssessmentProfileViewer from '../components/assessments/AssessmentProfileViewer';
import { LessonVisual } from '../components/learning/LessonVisual';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';
import CoachFeedback from '../components/learning/CoachFeedback';

interface Resource {
  resource_id: number;
  resource_title: string;
  description: string | null;
  resource_type: string;
  resource_key: string;
  sequence_number: number;
  topic_id: number;
}

interface Topic {
  topic_id: number;
  topic_title: string;
  topic_description: string;
  sequence_number: number;
  resources: Resource[];
}

interface CoursePlayerContent {
  course_id: number;
  title: string;
  topics: Topic[];
  course_admin?: { full_name: string };
  assessments?: any[];
  initial_assessment_pending?: boolean;
  initial_assessment?: any;
}

const LEARNING_STAGES = ['Learn', 'Understand', 'Try', 'Practice', 'Check', 'Master'];

const getJourneyState = (proficiency: string) => {
  switch(proficiency?.toUpperCase()) {
    case 'DEVELOPING': return { index: 2, label: 'Applying Concepts' };
    case 'PROFICIENT': return { index: 4, label: 'Testing Knowledge' };
    case 'ADVANCED': return { index: 5, label: 'Mastery Achieved' };
    case 'BEGINNER':
    default: return { index: 0, label: 'Building Foundations' };
  }
};

export default function CoursePlayer() {
  const user = useAuthUser();
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CoursePlayerContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTopicId, setActiveTopicId] = useState<number | null>(() => {
    const saved = localStorage.getItem(`mentora_topic_${courseSlug}`);
    return saved ? parseInt(saved, 10) : null;
  });
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState<number | null>(null);
  
  // Assessments support
  const [assessments, setAssessments] = useState<any[]>([]);

  const [isAdaptiveMode, setIsAdaptiveMode] = useState(() => {
    const saved = localStorage.getItem(`mentora_adaptive_${courseSlug}`);
    return saved === 'true';
  });
  const [adaptivePath, setAdaptivePath] = useState<any[] | null>(null);
  const [knowledgeStates, setKnowledgeStates] = useState<Record<string, any>>({});
  const [loadingAdaptive, setLoadingAdaptive] = useState(false);

  // AI Personalized Lesson State
  const [aiLessonsData, setAiLessonsData] = useState<Record<number, { content: string; sources: any[]; noAiSources?: boolean }>>({});
  const [loadingAiLesson, setLoadingAiLesson] = useState<number | null>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [tryAnswers, setTryAnswers] = useState<Record<number, number>>({});
  const [submittedTryAnswers, setSubmittedTryAnswers] = useState<Record<number, number>>({});
  const [tryAttemptCounts, setTryAttemptCounts] = useState<Record<number, number>>({});
  
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [submittedPracticeAnswers, setSubmittedPracticeAnswers] = useState<Record<number, string>>({});
  const [practiceAttemptCounts, setPracticeAttemptCounts] = useState<Record<number, number>>({});
  
  const [coachMessages, setCoachMessages] = useState<Record<number, string>>({});
  const [conceptPerformance, setConceptPerformance] = useState<Record<string, string>>({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const { progressId, startProgress, updateProgress, completeProgress, fetchResourceProgressForTopic } = useLearningProgress(token);
  const { generateTopicAssessment, isGenerating } = useTopicAssessment(token);
  const [resourceProgressMap, setResourceProgressMap] = useState<Record<number, number>>({});
  const [generatingTopicId, setGeneratingTopicId] = useState<number | null>(null);

  // Certificate State
  const [certificateData, setCertificateData] = useState<any>(null);
  const [claimingCert, setClaimingCert] = useState(false);

  // AI Tutor State
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorResponse, setTutorResponse] = useState<any>(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorError, setTutorError] = useState('');

  const askTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorQuery.trim() || !course) return;
    
    setTutorLoading(true);
    setTutorError('');
    setTutorResponse(null);

    try {
      const res = await fetch(`${API_URL}/adaptive-learning/students/${user.user_id}/courses/${course.course_id}/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          topic_id: activeTopicId,
          query: tutorQuery
        })
      });

      if (!res.ok) {
        throw new Error('Tutor service unavailable.');
      }

      const data = await res.json();
      data.query = tutorQuery;
      setTutorResponse(data);
      setTutorQuery('');
    } catch(err: any) {
      setTutorError(err.message);
    } finally {
      setTutorLoading(false);
    }
  };

  const [aiCompletedTopics, setAiCompletedTopics] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem(`mentora_ai_completed_${courseSlug}`);
    return saved ? JSON.parse(saved) : {};
  });

  const markAILessonComplete = (topicId: number) => {
    setAiCompletedTopics(prev => {
      const next = { ...prev, [topicId]: true };
      localStorage.setItem(`mentora_ai_completed_${courseSlug}`, JSON.stringify(next));
      return next;
    });
  };

  const isLoadedRef = useRef<number | null>(null);

  // Load AI Journey state when topic changes
  useEffect(() => {
    if (activeTopicId && course?.course_id && token) {
      fetch(`${API_URL}/learning-progress/ai-journey?courseId=${course.course_id}&topicId=${activeTopicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(saved => {
        if (saved && Object.keys(saved).length > 0) {
          setReadProgress(saved.readProgress || 0);
          setActiveBlockIndex(saved.activeBlockIndex || 0);
          setTryAnswers(saved.tryAnswers || {});
          setSubmittedTryAnswers(saved.submittedTryAnswers || {});
          setTryAttemptCounts(saved.tryAttemptCounts || {});
          setPracticeAnswers(saved.practiceAnswers || {});
          setSubmittedPracticeAnswers(saved.submittedPracticeAnswers || {});
          setPracticeAttemptCounts(saved.practiceAttemptCounts || {});
          if (saved.isCompleted) {
            setAiCompletedTopics(prev => ({ ...prev, [activeTopicId]: true }));
          }
        } else {
          // Reset state for new topic
          setReadProgress(0);
          setActiveBlockIndex(0);
          setTryAnswers({});
          setSubmittedTryAnswers({});
          setTryAttemptCounts({});
          setPracticeAnswers({});
          setSubmittedPracticeAnswers({});
          setPracticeAttemptCounts({});
        }
        isLoadedRef.current = activeTopicId;
      })
      .catch(err => {
        console.error('Failed to load AI journey state', err);
        isLoadedRef.current = activeTopicId;
      });
    }
  }, [activeTopicId, course, token, API_URL]);

  // Save AI Journey state when it changes
  useEffect(() => {
    if (activeTopicId && course?.course_id && token && isLoadedRef.current === activeTopicId) {
      const stateToSave = {
        readProgress,
        activeBlockIndex,
        tryAnswers,
        submittedTryAnswers,
        tryAttemptCounts,
        practiceAnswers,
        submittedPracticeAnswers,
        practiceAttemptCounts,
        isCompleted: aiCompletedTopics[activeTopicId] || false
      };
      
      const timeoutId = setTimeout(() => {
        fetch(`${API_URL}/learning-progress/ai-journey?courseId=${course.course_id}&topicId=${activeTopicId}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(stateToSave)
        }).catch(err => console.error('Failed to save AI journey state', err));
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeTopicId, course, token, API_URL, readProgress, activeBlockIndex, tryAnswers, submittedTryAnswers, tryAttemptCounts, practiceAnswers, submittedPracticeAnswers, practiceAttemptCounts, aiCompletedTopics]);

  // Sync state to localStorage to persist across refreshes
  useEffect(() => {
    if (courseSlug) {
      localStorage.setItem(`mentora_adaptive_${courseSlug}`, isAdaptiveMode.toString());
    }
  }, [isAdaptiveMode, courseSlug]);

  useEffect(() => {
    if (courseSlug) {
      if (activeTopicId) {
        localStorage.setItem(`mentora_topic_${courseSlug}`, activeTopicId.toString());
      } else {
        localStorage.removeItem(`mentora_topic_${courseSlug}`);
      }
    }
  }, [activeTopicId, courseSlug]);

  useEffect(() => {
    if (activeTopicId && courseSlug) {
      if (activeAssessmentId) {
        localStorage.setItem(`mentora_resource_${courseSlug}_${activeTopicId}`, `assessment_${activeAssessmentId}`);
      } else if (activeResource) {
        localStorage.setItem(`mentora_resource_${courseSlug}_${activeTopicId}`, activeResource.resource_id.toString());
      } else {
        localStorage.setItem(`mentora_resource_${courseSlug}_${activeTopicId}`, 'ai-lesson');
      }
    }
  }, [activeTopicId, activeResource, activeAssessmentId, courseSlug]);

  const logBlockInteraction = async (blockType: string, isCorrect: boolean | undefined, attemptNumber: number, studentAnswer: any, conceptTags?: string[]) => {
    if (!user || !course || !activeTopicId || !token) return;
    try {
      await fetch(`${API_URL}/learning-progress/block-interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: course.course_id,
          topicId: activeTopicId,
          blockType,
          isCorrect,
          attemptNumber,
          studentAnswer,
          conceptTags
        })
      });
    } catch (err) {
      console.error('Failed to log block interaction:', err);
    }
  };

  let parsedAiLesson: any = null;
  if (activeTopicId && aiLessonsData[activeTopicId]) {
    try {
      const parsed = JSON.parse(aiLessonsData[activeTopicId].content);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        parsedAiLesson = parsed;
      }
    } catch (e) {
      // Fallback to legacy markdown if not JSON
    }
  }

  const safeBlockIndex = parsedAiLesson ? Math.min(activeBlockIndex, Math.max(0, parsedAiLesson.blocks.length - 1)) : activeBlockIndex;

  const renderBlock = (block: any, index: number) => {
    switch (block.type) {
      case 'CONCEPT':
        return (
          <div className="group bg-gradient-to-br from-surface-container-low to-surface-container-lowest border border-outline-variant/30 p-8 rounded-3xl mb-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
            <h3 className="font-bold text-xl text-primary mb-5 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">lightbulb</span>
              </div>
              {block.title}
            </h3>
            {block.visual && block.visual.url && <LessonVisual visual={block.visual} className="relative z-10" />}
            <div className="prose prose-lg max-w-none text-on-surface prose-p:leading-relaxed relative z-10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
            </div>
          </div>
        );
      case 'EXAMPLE':
        return (
          <div className="group bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden mb-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-surface-container-low to-surface-container-lowest px-6 py-4 border-b border-outline-variant/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-sm">code_blocks</span>
              </div>
              <h3 className="font-bold text-sm uppercase tracking-widest text-text-secondary group-hover:text-primary transition-colors">{block.title}</h3>
            </div>
            {block.visual && block.visual.url && (
              <div className="px-6 pt-6 pb-0">
                <LessonVisual visual={block.visual} />
              </div>
            )}
            <div className="p-6 relative">
              <div className="absolute top-0 right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500"></div>
              <div className="bg-surface-container-highest/80 text-on-surface p-5 rounded-2xl font-mono text-sm overflow-x-auto mb-6 border border-outline-variant/30 shadow-inner relative z-10">
                <pre><code>{block.code}</code></pre>
              </div>
              <div className="prose prose-base text-text-secondary prose-p:leading-relaxed relative z-10">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.explanation}</ReactMarkdown>
              </div>
            </div>
          </div>
        );
      case 'TRY':
        const isSubmitted = submittedTryAnswers[index] !== undefined;
        const isCorrect = submittedTryAnswers[index] === block.answer;
        const hasSelection = tryAnswers[index] !== undefined;
        
          const handleCheckAnswer = () => {
          if (!hasSelection || isSubmitted) return;
          const selectedOption = tryAnswers[index];
          const correct = selectedOption === block.answer;
          const attemptNum = (tryAttemptCounts[index] || 0) + 1;
          
          setTryAttemptCounts(prev => ({...prev, [index]: attemptNum}));
          setSubmittedTryAnswers(prev => ({...prev, [index]: selectedOption}));
          
          // Generate Coach Message
          const pref = (user as any)?.teaching_preference || 'DIRECT';
          let msg = '';
          if (correct) {
            msg = pref === 'PRACTICE_FIRST' ? "🔥 Nice! You got it. You're ready for the practice step." : "🔥 Nice! You got it. Let's build on that.";
          } else {
            if (attemptNum > 2) {
              msg = pref === 'STEP_BY_STEP' ? "💡 Let's break this down. Try reviewing the concept before continuing." : "💡 This seems tricky. Let's slow down and review the concept before continuing.";
            } else {
              msg = pref === 'EXAMPLE_FIRST' ? "Not quite. Take another look at the example and try again." : "Not quite. Give it another try.";
            }
          }
          setCoachMessages(prev => ({...prev, [index]: msg}));
          
          logBlockInteraction(
            'TRY',
            correct,
            attemptNum,
            block.options[selectedOption],
            block.conceptTags
          );
        };

        const handleRetry = () => {
          setSubmittedTryAnswers(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
          });
          setTryAnswers(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
          });
        };

        return (
          <div className="group bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] border border-primary/20 p-8 rounded-3xl mb-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/15 transition-all duration-700"></div>
            <h3 className="font-bold text-xl text-primary mb-5 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              {block.title}
            </h3>
            {block.visual && block.visual.url && <LessonVisual visual={block.visual} className="relative z-10" />}
            <div className="text-lg text-on-surface mb-8 font-medium leading-relaxed relative z-10">{block.question}</div>
            
            <div className="space-y-4 mb-8 relative z-10">
              {block.options.map((opt: string, oIdx: number) => {
                const isSelected = tryAnswers[index] === oIdx;
                let btnClass = "bg-white border-outline-variant/30 text-on-surface hover:bg-surface-container-lowest hover:border-primary/50 shadow-sm";
                
                if (isSubmitted) {
                  if (oIdx === block.answer) {
                    btnClass = "bg-green-50 border-green-500 text-green-900 shadow-sm";
                  } else if (isSelected) {
                    btnClass = "bg-red-50 border-red-500 text-red-900 shadow-sm";
                  } else {
                    btnClass = "bg-white border-outline-variant/10 text-text-secondary opacity-50";
                  }
                } else if (isSelected) {
                  btnClass = "bg-primary/5 border-primary text-primary shadow-md ring-2 ring-primary/20";
                }

                return (
                  <button 
                    key={oIdx}
                    disabled={isSubmitted}
                    onClick={() => setTryAnswers(prev => ({...prev, [index]: oIdx}))}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-medium flex items-center gap-4 ${btnClass}`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected || (isSubmitted && oIdx === block.answer) ? 'border-primary' : 'border-outline-variant/50'}`}>
                      {(isSelected || (isSubmitted && oIdx === block.answer)) && <div className={`w-3 h-3 rounded-full ${isSubmitted && oIdx === block.answer ? 'bg-green-500' : isSelected && isSubmitted ? 'bg-red-500' : 'bg-primary'}`} />}
                    </div>
                    <span className="leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {!isSubmitted && (
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleCheckAnswer}
                  disabled={!hasSelection}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Check Answer
                </button>
              </div>
            )}

            {isSubmitted && (
              <div className={`p-5 rounded-xl border animate-fade-in-up ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`font-bold flex items-center gap-2 mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                      <span className="material-symbols-outlined">
                        {isCorrect ? 'check_circle' : 'cancel'}
                      </span>
                      {isCorrect ? 'Correct!' : 'Incorrect'}
                    </div>
                    <div className="text-sm text-on-surface leading-relaxed">{block.explanation}</div>
                  </div>
                  
                  {!isCorrect && (
                    <button 
                      onClick={handleRetry}
                      className="shrink-0 px-4 py-2 bg-white border border-outline-variant/30 text-text-secondary hover:bg-surface-container-lowest rounded-lg font-bold text-sm transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <CoachFeedback message={coachMessages[index]} />
          </div>
        );
      case 'PRACTICE':
      case 'CHALLENGE':
        const isPracSubmitted = submittedPracticeAnswers[index] !== undefined;
        const currentAnswer = practiceAnswers[index] || '';
        
          const handlePracticeSubmit = () => {
          if (!currentAnswer.trim() || isPracSubmitted) return;
          const attemptNum = (practiceAttemptCounts[index] || 0) + 1;
          
          setPracticeAttemptCounts(prev => ({...prev, [index]: attemptNum}));
          setSubmittedPracticeAnswers(prev => ({...prev, [index]: currentAnswer}));
          
          // Generate Coach Message
          const pref = (user as any)?.teaching_preference || 'DIRECT';
          let msg = '';
          if (block.type === 'PRACTICE') {
            msg = pref === 'DIRECT' ? "Great work practicing! You're ready for the next challenge." : "✓ Nice progress. You've completed the Practice stage. Keep it up!";
          } else {
            msg = "🚀 You're doing well. Great effort on this challenge!";
          }
          setCoachMessages(prev => ({...prev, [index]: msg}));

          // isCorrect is undefined because we can't reliably grade arbitrary text answers without an AI call
          logBlockInteraction(
            block.type,
            undefined,
            attemptNum,
            currentAnswer,
            block.conceptTags
          );
        };

        const handlePracticeRetry = () => {
          setSubmittedPracticeAnswers(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
          });
        };

        return (
          <div className="group bg-gradient-to-br from-accent-neon/[0.08] to-accent-neon/[0.02] border border-accent-neon/30 p-8 rounded-3xl mb-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-neon/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-accent-neon/20 transition-all duration-700"></div>
            <h3 className="font-bold text-xl text-primary mb-5 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-accent-neon/20 text-accent-neon flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">{block.type === 'CHALLENGE' ? 'emoji_events' : 'fitness_center'}</span>
              </div>
              {block.title}
            </h3>
            {block.visual && block.visual.url && <LessonVisual visual={block.visual} className="relative z-10" />}
            <div className="prose prose-lg text-on-surface prose-p:leading-relaxed mb-8 relative z-10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.instruction}</ReactMarkdown>
            </div>
            
            <div className="bg-white rounded-2xl border-2 border-outline-variant/30 overflow-hidden focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-inner mb-8 relative z-10">
              <textarea 
                className="w-full h-40 p-4 bg-transparent outline-none resize-none text-on-surface font-mono text-sm placeholder:text-text-secondary/50 placeholder:font-sans"
                placeholder={`Type your ${block.type === 'CHALLENGE' ? 'solution' : 'code or answer'} here...`}
                value={currentAnswer}
                onChange={(e) => setPracticeAnswers(prev => ({...prev, [index]: e.target.value}))}
                disabled={isPracSubmitted}
                spellCheck={false}
              ></textarea>
            </div>
            
            {!isPracSubmitted && (
              <div className="flex justify-end">
                <button
                  onClick={handlePracticeSubmit}
                  disabled={!currentAnswer.trim()}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">send</span> Submit {block.type === 'CHALLENGE' ? 'Challenge' : 'Practice'}
                </button>
              </div>
            )}
            
            {isPracSubmitted && (
              <div className="p-5 rounded-xl border bg-surface-container-highest border-outline-variant/50 animate-fade-in-up">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-bold flex items-center gap-2 mb-2 text-primary">
                      <span className="material-symbols-outlined">assignment_turned_in</span>
                      Submission Recorded!
                    </div>
                    <div className="text-sm text-text-secondary leading-relaxed">
                      Great job completing this {block.type.toLowerCase()}! Your answer has been saved to your learning journey.
                    </div>
                  </div>
                  
                  <button 
                    onClick={handlePracticeRetry}
                    className="shrink-0 px-4 py-2 bg-white border border-outline-variant/30 text-text-secondary hover:bg-surface-container-lowest rounded-lg font-bold text-sm transition-colors"
                  >
                    Revise Answer
                  </button>
                </div>
              </div>
            )}
            
            <CoachFeedback message={coachMessages[index]} />
          </div>
        );
      case 'RECAP':
        return (
          <div className="group bg-gradient-to-br from-surface-container-highest to-surface-container-low border border-outline-variant/50 p-8 rounded-3xl mb-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
            <h3 className="font-bold text-xl text-primary mb-6 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-surface-container-highest border border-outline-variant/50 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">summarize</span>
              </div>
              {block.title}
            </h3>
            {block.visual && block.visual.url && <LessonVisual visual={block.visual} className="relative z-10" />}
            <ul className="space-y-4 relative z-10">
              {block.points.map((pt: string, pIdx: number) => (
                <li key={pIdx} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/50 transition-colors border border-transparent hover:border-outline-variant/30">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-[14px]">check</span>
                  </div>
                  <span className="text-on-surface leading-relaxed text-lg">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  const handleAdaptiveNext = () => {
    if (!parsedAiLesson) return;
    
    const currentBlock = parsedAiLesson.blocks[activeBlockIndex];
    
    if (currentBlock.type === 'TRY') {
      const attempts = tryAttemptCounts[activeBlockIndex] || 1;
      const isCorrect = submittedTryAnswers[activeBlockIndex] === currentBlock.answer;
      
      if (isCorrect && attempts === 1) {
        if (activeBlockIndex + 2 < parsedAiLesson.blocks.length && 
            parsedAiLesson.blocks[activeBlockIndex + 1].type === 'PRACTICE' && 
            parsedAiLesson.blocks[activeBlockIndex + 2].type === 'CHALLENGE') {
          
          setActiveBlockIndex(activeBlockIndex + 2);
          setCoachMessages(prev => ({...prev, [activeBlockIndex + 2]: "🔥 You got that quickly. Let's try something a little harder."}));
          return;
        }
      } else if (!isCorrect && attempts >= 2) {
        for (let i = activeBlockIndex - 1; i >= 0; i--) {
          if (parsedAiLesson.blocks[i].type === 'EXAMPLE') {
            setActiveBlockIndex(i);
            setCoachMessages(prev => ({...prev, [i]: "💡 Let's take one step back. Review this example, then try again."}));
            setSubmittedTryAnswers(prev => {
              const next = {...prev};
              delete next[activeBlockIndex];
              return next;
            });
            return;
          }
        }
      } else if (!isCorrect && attempts === 1) {
        if (activeBlockIndex + 1 < parsedAiLesson.blocks.length && parsedAiLesson.blocks[activeBlockIndex + 1].type === 'PRACTICE') {
          setActiveBlockIndex(activeBlockIndex + 1);
          setCoachMessages(prev => ({...prev, [activeBlockIndex + 1]: "Let's practice this concept to make sure you've got it."}));
          return;
        }
      }
    }
    
    setActiveBlockIndex(prev => Math.min(parsedAiLesson.blocks.length - 1, prev + 1));
  };

  useEffect(() => {
    if (token && activeTopicId && course) {
      fetch(`${API_URL}/learning-progress/concept-performance?courseId=${course.course_id}&topicId=${activeTopicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.concepts) {
          const perfMap: Record<string, string> = {};
          data.concepts.forEach((c: any) => {
            perfMap[c.conceptTag] = c.performance;
          });
          setConceptPerformance(perfMap);
        }
      })
      .catch(err => console.error('Failed to fetch concept performance', err));
    }
  }, [activeTopicId, course, token]);

  useEffect(() => {
    if (token) {
      const topicsToFetch = [...(course?.topics || []), ...(adaptivePath || [])];
      
      // Deduplicate topics
      const uniqueTopics = Array.from(new Map(topicsToFetch.map(t => [t.topic_id || t.topicId, t])).values());

      uniqueTopics.forEach((topic: any) => {
        const tId = topic.topic_id || topic.topicId;
        fetchResourceProgressForTopic(tId).then((records: any[]) => {
          if (records && records.length > 0) {
            setResourceProgressMap(prev => {
              const newMap = { ...prev };
              records.forEach(r => {
                newMap[r.resource_id] = r.progress_percent;
              });
              return newMap;
            });
          }
        });
      });
    }
  }, [course, adaptivePath, token, fetchResourceProgressForTopic]);

  const handleRealtimeProgress = (resourceId: number, _topicId: number, percent: number) => {
    setResourceProgressMap(prevMap => ({ ...prevMap, [resourceId]: percent }));
  };

  const getTopicProgress = (topic: any) => {
    const tId = topic.topic_id || topic.topicId;
    
    if (hasPassedTopicAssessment(topic)) return 100;

    let resourcesProgress = 0;
    if (isAdaptiveMode && aiCompletedTopics[tId]) {
      resourcesProgress = 100;
    } else if (topic.resources && topic.resources.length > 0) {
      const total = topic.resources.reduce((sum: number, r: any) => sum + (resourceProgressMap[r.resource_id] || 0), 0);
      resourcesProgress = Math.round(total / topic.resources.length);
    }

    const topicAssessment = assessments.find(a => a.assessment_type === 'TOPIC' && a.topics?.some((t: any) => t.topic_id === tId));
    
    if (isAdaptiveMode && (topicAssessment || true)) {
      // In adaptive mode, an assessment is always required to master a topic.
      // Resources/AI Lesson accounts for 80% of progress
      return Math.round(resourcesProgress * 0.8);
    }

    // In Standard mode, topic progress strictly reflects resource consumption
    return resourcesProgress;
  };

  const hasPassedTopicAssessment = (topic: any) => {
    const tId = topic.topic_id || topic.topicId;
    const proficiency = topic.proficiency || knowledgeStates[tId]?.proficiency;
    
    if (['ADVANCED', 'MASTER', 'PROFICIENT'].includes(proficiency)) {
      return true;
    }

    const topicAssessment = assessments.find(a => a.assessment_type === 'TOPIC' && a.topics?.some((t: any) => t.topic_id === tId));
    if (topicAssessment) {
      return topicAssessment.attempts?.some((att: any) => {
        if (att.status !== 'SUBMITTED') return false;
        const requiredScore = topicAssessment.passing_percentage !== null ? parseFloat(topicAssessment.passing_percentage) : 60; // default to 60 if not set
        return parseFloat(att.percentage) >= requiredScore;
      });
    }
    return false;
  };

  const getDisplayedTopics = () => {
    if (!course?.topics) return [];
    if (!isAdaptiveMode) return course.topics;
    
    // In Adaptive Mode, show Adaptive Path + any 100% Completed topics
    const adaptiveTopicIds = (adaptivePath || []).map(ap => ap.topicId);
    
    const mappedAdaptive = (adaptivePath || []).map(ap => {
      const courseTopic = course.topics.find((t: any) => t.topic_id === ap.topicId);
      return { ...courseTopic, ...ap, isAdaptiveRecommended: true };
    });

    const completedTopics = course.topics
      .filter((t: any) => getTopicProgress(t) === 100 && !adaptiveTopicIds.includes(t.topic_id))
      .map((t: any) => {
        const kState = knowledgeStates[t.topic_id];
        return { 
          ...t, 
          isAdaptiveRecommended: false,
          proficiency: kState?.proficiency,
          knowledgeScore: kState?.score
        };
      });
      
    return [...completedTopics, ...mappedAdaptive].sort((a: any, b: any) => a.sequence_number - b.sequence_number);
  };

  const getCourseProgress = () => {
    if (!course?.topics || course.topics.length === 0) return 0;
    
    if (isAdaptiveMode) {
      if (course.initial_assessment_pending) return 0;
      
      const displayed = getDisplayedTopics();
      if (displayed.length === 0) return 0;
      
      let totalProgress = 0;
      displayed.forEach((t: any) => {
        totalProgress += getTopicProgress(t);
      });
      return Math.round(totalProgress / displayed.length);
    } else {
      let totalProgress = 0;
      course.topics.forEach((t: any) => {
        totalProgress += getTopicProgress(t);
      });
      return Math.round(totalProgress / course.topics.length);
    }
  };

  useEffect(() => {
    const progress = getCourseProgress();
    if (progress === 100 && course && user && token && !certificateData) {
      const fetchCert = async () => {
        try {
          const certsRes = await fetch(`${API_URL}/certificates/my-certificates`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (certsRes.ok) {
            const certs = await certsRes.json();
            const courseCert = certs.find((c: any) => c.course_id === course.course_id);
            if (courseCert) {
              setCertificateData({ issued: true, certificate: courseCert });
            } else {
              const eligRes = await fetch(`${API_URL}/certificates/eligibility/${course.course_id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (eligRes.ok) {
                const eligData = await eligRes.json();
                setCertificateData({ issued: false, eligible: eligData.eligible });
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchCert();
    }
  }, [course, assessments, resourceProgressMap, user, token, API_URL, certificateData]);

  const handleClaimCertificate = async () => {
    if (!course || !user) return;
    setClaimingCert(true);
    try {
      const res = await fetch(`${API_URL}/certificates/issue/${course.course_id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to claim certificate');
      const cert = await res.json();
      setCertificateData({ issued: true, certificate: cert });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setClaimingCert(false);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API_URL}/courses/${courseSlug}/player`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error('You must be enrolled to view this course');
          throw new Error('Course not found');
        }
        const data = await res.json();
        setCourse(data);
        
        if (data.initial_assessment_pending && data.initial_assessment) {
          setActiveTopicId(null);
          setActiveResource(null);
        } else if (data.topics && data.topics.length > 0) {
          // Preserve localStorage topic if valid, otherwise use first topic
          const savedId = localStorage.getItem(`mentora_topic_${courseSlug}`);
          const validSavedId = savedId && data.topics.some((t: any) => t.topic_id === parseInt(savedId, 10)) 
            ? parseInt(savedId, 10) 
            : data.topics[0].topic_id;
            
          setActiveTopicId(validSavedId);
          const activeT = data.topics.find((t: any) => t.topic_id === validSavedId) || data.topics[0];
          
          const savedResId = localStorage.getItem(`mentora_resource_${courseSlug}_${validSavedId}`);
          if (savedResId === 'ai-lesson') {
            setActiveResource(null);
            setActiveAssessmentId(null);
          } else if (savedResId && savedResId.startsWith('assessment_')) {
            setActiveResource(null);
            setActiveAssessmentId(parseInt(savedResId.replace('assessment_', ''), 10));
          } else if (savedResId && activeT.resources) {
            const res = activeT.resources.find((r: any) => r.resource_id === parseInt(savedResId, 10));
            if (res) setActiveResource(res);
            else setActiveResource(null);
          } else if (activeT.resources && activeT.resources.length > 0) {
            // Default if nothing saved
            setActiveResource(activeT.resources[0]);
          } else {
            setActiveResource(null);
          }
        }
        // Fetch Assessments separately
        try {
          const assessRes = await fetch(`${API_URL}/assessments/course/${data.course_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (assessRes.ok) {
             const assessData = await assessRes.json();
             setAssessments(assessData);
          }
        } catch (e) {
          console.error('Failed to load assessments', e);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (courseSlug) fetchCourse();
  }, [courseSlug, API_URL, token]);

  const fetchAdaptivePath = async () => {
    if (!course || adaptivePath) return;
      setLoadingAdaptive(true);
      try {
        const res = await fetch(`${API_URL}/adaptive-learning/students/${user?.user_id}/courses/${course.course_id}/path`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate learning path');
      const data = await res.json();
      const newPath = data.recommendedTopics || [];
      setAdaptivePath(newPath);
      if (data.knowledgeStates) {
        setKnowledgeStates(data.knowledgeStates);
      }
      
      if (newPath.length > 0) {
         setActiveTopicId(current => {
             // If we are in adaptive mode and the current topic was mastered (not in new path anymore)
             if (current && !newPath.find((t: any) => (t.topicId || t.topic_id) === current)) {
                 return newPath[0].topicId || newPath[0].topic_id;
             }
             return current;
         });
      }
    } catch (err) {
      console.error('Error fetching adaptive path:', err);
    } finally {
      setLoadingAdaptive(false);
    }
  };

  const generateAiLesson = async (topicId: number) => {
    if (!user?.user_id || !course?.course_id) return;
    
    // Check if we already have it cached locally in the component state
    if (aiLessonsData[topicId]) return;

    setLoadingAiLesson(topicId);
    try {
      const response = await fetch(`${API_URL}/adaptive-learning/students/${user.user_id}/courses/${course.course_id}/topics/${topicId}/lesson`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch personalized lesson');
      const data = await response.json();
      setAiLessonsData(prev => ({
        ...prev,
        [topicId]: {
          content: data.lesson,
          sources: data.sources || [],
          noAiSources: data.noAiSources
        }
      }));
    } catch (err) {
      console.error('Error generating AI lesson:', err);
      // Fallback state on error
      setAiLessonsData(prev => ({
        ...prev,
        [topicId]: {
          content: "Oops! We couldn't generate the AI lesson at this moment. Please try again later.",
          sources: []
        }
      }));
    } finally {
      setLoadingAiLesson(null);
    }
  };

  useEffect(() => {
    if (isAdaptiveMode && activeTopicId) {
      generateAiLesson(activeTopicId);
    }
  }, [isAdaptiveMode, activeTopicId]);

  useEffect(() => {
    if (isAdaptiveMode && !adaptivePath) {
      fetchAdaptivePath();
    }
  }, [isAdaptiveMode, adaptivePath, course, user?.user_id, token, API_URL]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return 'play_circle';
      case 'PDF':
      case 'DOC':
      case 'DOCX':
      case 'PPT':
      case 'PPTX': return 'description';
      case 'LINK': return 'link';
      default: return 'article';
    }
  };

  const renderResourceContent = (resource: Resource) => {
    if (resource.resource_type === 'VIDEO') {
      if (resource.resource_key.includes('youtube') || resource.resource_key.includes('vimeo')) {
        // Embed for YouTube/Vimeo is complex, assume direct link or simplify for now
        return (
          <div className="aspect-video bg-black rounded-2xl flex items-center justify-center text-white">
             <div className="text-center p-8">
               <span className="material-symbols-outlined text-6xl mb-4 opacity-50">play_circle</span>
               <p>Video streaming is configured for URL: <a href={resource.resource_key} target="_blank" rel="noreferrer" className="text-accent-neon hover:underline break-all">{resource.resource_key}</a></p>
             </div>
          </div>
        );
      }
      return (
        <video 
          controls 
          className="w-full aspect-video rounded-2xl bg-black shadow-xl" 
          src={resource.resource_key}
          onPlay={() => {
            if (token) startProgress(course!.course_id, resource.topic_id, resource.resource_id);
          }}
          onTimeUpdate={(e) => {
            const target = e.target as HTMLVideoElement;
            if (target.duration > 0) {
              const p = Math.min(100, Math.round((target.currentTime / target.duration) * 100));
              handleRealtimeProgress(resource.resource_id, resource.topic_id, p);
            }
          }}
          onEnded={() => {
            if (progressId) completeProgress(progressId);
            handleRealtimeProgress(resource.resource_id, resource.topic_id, 100);
          }}
        >
          Your browser does not support the video tag.
        </video>
      );
    }
    
    if (resource.resource_type === 'PDF') {
      return (
        <CustomPdfViewer 
          url={resource.resource_key} 
          title={resource.resource_title} 
          courseTitle={course?.title} 
          token={token || undefined}
          apiUrl={API_URL}
          onProgressStart={() => startProgress(course!.course_id, resource.topic_id, resource.resource_id)}
          onRealtimeProgress={(percent) => handleRealtimeProgress(resource.resource_id, resource.topic_id, percent)}
          onProgressUpdate={(percent, timeSpent) => {
            if (progressId) updateProgress(progressId, percent, timeSpent);
          }}
          onProgressComplete={() => {
            if (progressId) completeProgress(progressId);
          }}
        />
      );
    }

    if (['DOC', 'DOCX', 'PPT', 'PPTX'].includes(resource.resource_type)) {
      return (
        <div className="p-10 bg-white rounded-2xl shadow-xl shadow-black/5 border border-outline-variant/30 text-center">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">description</span>
          <h3 className="text-2xl font-bold mb-4">Document Resource</h3>
          <p className="text-text-secondary mb-8">{resource.description || 'View the attached document to continue learning.'}</p>
          <a 
            href={resource.resource_key} 
            target="_blank" 
            rel="noreferrer" 
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all inline-block"
            onClick={() => {
               if (token) {
                 startProgress(course!.course_id, resource.topic_id, resource.resource_id).then(id => {
                    if (id) completeProgress(id);
                 });
               }
               handleRealtimeProgress(resource.resource_id, resource.topic_id, 100);
            }}
          >
            Download Document
          </a>
        </div>
      );
    }

    if (resource.resource_type === 'LINK') {
      return (
        <div className="p-10 bg-white rounded-2xl shadow-xl shadow-black/5 border border-outline-variant/30 text-center">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">link</span>
          <h3 className="text-2xl font-bold mb-4">External Resource</h3>
          <p className="text-text-secondary mb-8">{resource.description || 'This topic references an external link.'}</p>
          <a 
            href={resource.resource_key} 
            target="_blank" 
            rel="noreferrer" 
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all inline-block"
            onClick={() => {
               if (token) {
                 startProgress(course!.course_id, resource.topic_id, resource.resource_id).then(id => {
                    if (id) completeProgress(id);
                 });
               }
               handleRealtimeProgress(resource.resource_id, resource.topic_id, 100);
            }}
          >
            Visit Link
          </a>
        </div>
      );
    }

    return (
      <div className="p-10 bg-white rounded-2xl shadow-xl shadow-black/5 border border-outline-variant/30">
        <h3 className="text-2xl font-bold mb-4">Content</h3>
        <p className="text-text-secondary">{resource.description || 'No additional details available.'}</p>
      </div>
    );
  };

  const handleStartTopicAssessment = async (topicId: number) => {
    if (!course) return;
    setGeneratingTopicId(topicId);
    const assessment = await generateTopicAssessment(course.course_id, topicId);
    setGeneratingTopicId(null);
    if (assessment) {
      navigate(`/assessments/${assessment.assessment_id}/take`, { state: { returnUrl: `/learn/${courseSlug}` } });
    } else {
      alert("Failed to start topic assessment. Please try again.");
    }
  };

  if (!user) return null;

  return (
    <StudentLayout user={user}>
      {loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>
      ) : error ? (
        <div className="text-error bg-error/10 p-4 rounded-xl max-w-2xl mx-auto mt-10">
          <div className="flex items-center gap-2 font-bold mb-2"><span className="material-symbols-outlined">block</span> Access Denied</div>
          {error}
          <div className="mt-4">
            <button onClick={() => navigate(-1)} className="bg-white/50 text-error px-4 py-2 rounded-lg font-medium text-sm">Go Back</button>
          </div>
        </div>
      ) : course ? (
        <div className="flex flex-col lg:flex-row gap-6 -mx-4 md:-mx-10 px-4 md:px-10 pb-6 h-auto lg:h-[calc(100vh-140px)] lg:overflow-hidden">
          {/* Main Viewer Area */}
          <div className="flex-1 flex flex-col min-h-[60vh] lg:min-h-0 lg:h-full lg:overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <button onClick={() => navigate('/my-learning')} className="flex items-center text-text-secondary hover:text-primary transition-colors font-bold text-sm">
                <span className="material-symbols-outlined mr-1">arrow_back</span> Back to My Learning
              </button>
              <button onClick={() => navigate(`/learn/${courseSlug}/progress`)} className="flex items-center text-primary hover:text-primary/80 transition-colors font-bold text-sm bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 shadow-sm">
                <span className="material-symbols-outlined mr-1 text-[18px]">insights</span> Mastery Dashboard
              </button>
            </div>
            <h1 className="font-display-md text-2xl md:text-3xl tracking-tight leading-tight mb-6 shrink-0">{course.title}</h1>
            
            {activeAssessmentId ? (
              <div className="flex-1 overflow-hidden pb-4">
                <AssessmentProfileViewer assessmentId={activeAssessmentId} courseSlug={courseSlug || ''} />
              </div>
            ) : activeResource ? (
              <div className="flex flex-col gap-6">
                {renderResourceContent(activeResource)}
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 shrink-0">
                  <h2 className="font-bold text-xl mb-2">{activeResource.resource_title}</h2>
                  {activeResource.description && (
                    <p className="text-text-secondary leading-relaxed">{activeResource.description}</p>
                  )}
                </div>
              </div>
            ) : isAdaptiveMode && activeTopicId ? (
              <div className="flex-1 flex flex-col h-full bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden mb-6">
                {loadingAiLesson === activeTopicId ? (
                  <div className="flex flex-col items-center justify-center p-20 text-text-secondary h-full">
                    <span className="material-symbols-outlined text-5xl animate-spin text-primary mb-4">refresh</span>
                    <p className="text-lg">Mentora is preparing your personalized lesson...</p>
                  </div>
                ) : aiLessonsData[activeTopicId] ? (
                  aiLessonsData[activeTopicId].noAiSources ? (
                    <div className="p-8 text-text-secondary text-center flex flex-col items-center justify-center h-full">
                      <span className="material-symbols-outlined text-5xl mb-4 opacity-50">info</span>
                      <p className="text-lg">{aiLessonsData[activeTopicId].content}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full relative group">
                      <div className="p-6 border-b border-outline-variant/30 bg-gradient-to-r from-primary/10 via-accent-neon/10 to-primary/5 flex flex-col justify-between shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-1 bg-primary transition-all duration-300 ease-out" style={{ width: `${readProgress}%` }}></div>
                        <div className="flex justify-between items-start z-10 relative">
                          <div>
                            <h5 className="font-bold text-2xl text-primary flex items-center gap-2 mb-1">
                              ✨ Personalized AI Lesson
                            </h5>
                            <p className="text-xs uppercase tracking-widest text-primary/80 font-bold">
                              Personalized for: {(course.topics.find((t: any) => t.topic_id === activeTopicId) || (adaptivePath||[]).find(t => t.topicId === activeTopicId))?.proficiency || 'BEGINNER'} • {(user as any)?.teaching_preference || 'DIRECT'}
                            </p>
                          </div>
                          <div className="bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/40 flex items-center gap-2 shadow-sm">
                            <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                            <span className="text-xs font-bold text-primary">{Math.max(1, Math.ceil(aiLessonsData[activeTopicId].content.split(' ').length / 200))} min read</span>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className="p-6 md:p-8 text-base text-on-surface overflow-y-auto custom-scrollbar flex-1 relative animate-fade-in-up"
                        onScroll={(e) => {
                          const target = e.target as HTMLElement;
                          const scrolled = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
                          setReadProgress(Math.min(100, Math.max(0, scrolled)));
                        }}
                      >
                        {parsedAiLesson ? (
                          <div className="max-w-4xl mx-auto">
                            {parsedAiLesson.blocks[safeBlockIndex]?.subTopicTitle && (
                                <div className="mb-4 inline-flex items-center gap-2 bg-accent-neon/10 text-primary px-3 py-1.5 rounded-lg border border-accent-neon/20 text-sm font-bold shadow-sm">
                                  <span className="material-symbols-outlined text-[18px]">account_tree</span>
                                  {parsedAiLesson.blocks[safeBlockIndex].subTopicTitle}
                                </div>
                            )}
                            {renderBlock(parsedAiLesson.blocks[safeBlockIndex], safeBlockIndex)}
                            
                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-outline-variant/30">
                              <button 
                                onClick={() => setActiveBlockIndex(prev => Math.max(0, prev - 1))}
                                disabled={safeBlockIndex === 0}
                                className="px-4 py-2 bg-surface-container-low text-text-secondary hover:bg-surface-container-highest transition-colors rounded-lg font-bold disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-sm">arrow_back</span> Previous
                              </button>
                              
                              <div className="text-sm font-bold text-text-secondary flex gap-1">
                                {parsedAiLesson.blocks.map((_: any, idx: number) => (
                                  <div key={idx} className={`w-2 h-2 rounded-full ${idx === safeBlockIndex ? 'bg-primary' : idx < safeBlockIndex ? 'bg-primary/30' : 'bg-outline-variant/30'}`}></div>
                                ))}
                              </div>

                              <button 
                                onClick={handleAdaptiveNext}
                                disabled={safeBlockIndex === parsedAiLesson.blocks.length - 1 || (parsedAiLesson.blocks[safeBlockIndex].type === 'TRY' && submittedTryAnswers[safeBlockIndex] === undefined) || ((parsedAiLesson.blocks[safeBlockIndex].type === 'PRACTICE' || parsedAiLesson.blocks[safeBlockIndex].type === 'CHALLENGE') && submittedPracticeAnswers[safeBlockIndex] === undefined)}
                                className="px-4 py-2 bg-primary text-white rounded-lg font-bold disabled:opacity-30 disabled:bg-surface-container-highest disabled:text-text-secondary flex items-center gap-2 transition-colors hover:bg-primary/90"
                              >
                                Next <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-lg max-w-none prose-headings:text-primary prose-a:text-accent-neon prose-strong:text-on-surface prose-p:leading-relaxed prose-p:mb-6 prose-li:mb-3 prose-td:p-4 prose-td:border prose-td:border-outline-variant/20 prose-th:p-4 prose-th:bg-surface-container-lowest prose-th:border prose-th:border-outline-variant/20 prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:shadow-sm prose-table:rounded-lg">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                blockquote: ({node, ...props}) => (
                                  <div className="bg-surface-container-highest/30 border-l-4 border-primary p-5 rounded-r-2xl my-8 flex gap-4 items-start shadow-sm transition-all hover:bg-surface-container-highest/50">
                                    <span className="material-symbols-outlined text-primary mt-1 shrink-0 text-2xl">lightbulb</span>
                                    <blockquote className="text-on-surface/90 italic font-medium m-0" {...props} />
                                  </div>
                                ),
                                strong: ({node, ...props}) => (
                                  <strong className="font-bold bg-accent-neon/20 px-1.5 py-0.5 rounded text-primary" {...props} />
                                )
                              }}
                            >
                              {aiLessonsData[activeTopicId].content}
                            </ReactMarkdown>
                          </div>
                        )}
                        
                        {(!parsedAiLesson || safeBlockIndex === parsedAiLesson.blocks.length - 1) && (
                          <div className="mt-12 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up">
                          <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-surface-container-highest transition-colors rounded-xl border border-outline-variant/30 text-sm font-bold text-text-secondary">
                              <span className="material-symbols-outlined text-[18px]">psychology_alt</span> Explain Simpler
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-surface-container-highest transition-colors rounded-xl border border-outline-variant/30 text-sm font-bold text-text-secondary">
                              <span className="material-symbols-outlined text-[18px]">quiz</span> Test Me
                            </button>
                          </div>
                          
                          {!aiCompletedTopics[activeTopicId] ? (
                            <button 
                              onClick={(e) => {
                                markAILessonComplete(activeTopicId);
                                const rect = e.currentTarget.getBoundingClientRect();
                                confetti({
                                  particleCount: 100,
                                  spread: 70,
                                  origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
                                  colors: ['#E8FF66', '#000000', '#ffffff']
                                });
                              }}
                              className="flex items-center gap-2 px-6 py-3 bg-primary text-white hover:bg-primary/90 transition-all rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                            >
                              <span className="material-symbols-outlined">verified</span> Mark Lesson Complete
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 px-6 py-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-xl font-bold">
                              <span className="material-symbols-outlined text-[20px]">check_circle</span> Topic Completed
                            </div>
                          )}
                        </div>
                        )}
                        {aiLessonsData[activeTopicId].sources && aiLessonsData[activeTopicId].sources.length > 0 && (
                          <div className="mt-12 pt-6 border-t border-outline-variant/10">
                            <h6 className="font-bold text-xs uppercase tracking-widest text-text-secondary mb-3">Sources Used</h6>
                            <ul className="flex flex-wrap gap-2">
                              {aiLessonsData[activeTopicId].sources.map((src: any, idx: number) => (
                                <li key={idx} className="text-xs text-text-secondary flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/20 shadow-sm transition-transform hover:-translate-y-0.5">
                                  <span className="material-symbols-outlined text-[14px] text-primary">menu_book</span>
                                  <span className="font-medium">{src.resourceName}</span>
                                  {src.pageNumber && src.pageNumber !== '?' && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-surface-container-highest rounded-md opacity-80">Pg {src.pageNumber}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex-1 flex items-center justify-center text-text-secondary p-10 text-center">
                    <div>
                      <span className="material-symbols-outlined text-6xl mb-4 opacity-50">auto_awesome</span>
                      <p className="text-lg">Select a topic from the sidebar to generate a personalized AI lesson.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-text-secondary p-10 text-center">
                <div>
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-50">menu_book</span>
                  <p className="text-lg">Select a topic and resource or an assessment from the sidebar to start.</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Topics Sidebar */}
          <div className="w-full lg:w-80 xl:w-[320px] 2xl:w-[360px] shrink-0 h-[600px] lg:h-full flex flex-col bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-lg shadow-black/5">
            <div className="p-6 border-b border-outline-variant/30 shrink-0 bg-white">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">format_list_bulleted</span> Course Content
              </h3>
              
              {/* Course Progress Bar */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Overall Progress</span>
                  <span className="text-lg font-bold text-primary">{getCourseProgress()}%</span>
                </div>
                <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden border border-outline-variant/10">
                  <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${getCourseProgress()}%` }}></div>
                </div>
                {/* Certificate Action below Progress Bar */}
                {certificateData?.issued ? (
                   <button onClick={() => navigate(`/certificate/${certificateData.certificate.credential_id}`)} className="mt-3 w-full bg-green-600 text-white py-2.5 rounded-xl font-bold shadow-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                     <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                     View Certificate
                   </button>
                ) : certificateData?.eligible ? (
                   <button onClick={handleClaimCertificate} disabled={claimingCert} className="mt-3 w-full bg-primary text-white py-2.5 rounded-xl font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                     <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                     {claimingCert ? 'Claiming...' : 'Claim Certificate'}
                   </button>
                ) : certificateData && !certificateData.eligible ? (
                   <button disabled className="mt-3 w-full bg-surface-container-highest text-text-secondary py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 cursor-not-allowed">
                     <span className="material-symbols-outlined text-[18px]">lock</span>
                     Not Eligible Yet
                   </button>
                ) : getCourseProgress() === 100 ? (
                   <button disabled className="mt-3 w-full bg-surface-container-highest text-text-secondary py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 cursor-not-allowed">
                     <span className="material-symbols-outlined text-[18px] animate-pulse">more_horiz</span>
                     Checking Eligibility...
                   </button>
                ) : null}
              </div>
            </div>
            
            <div className="p-4 border-b border-outline-variant/30 shrink-0 bg-surface-container-low flex gap-2">
              <button 
                onClick={() => setIsAdaptiveMode(false)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${!isAdaptiveMode ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-surface-container-lowest border border-outline-variant/30'}`}
              >
                Standard
              </button>
              <button 
                onClick={() => setIsAdaptiveMode(true)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-1 ${isAdaptiveMode ? 'bg-accent-neon text-slate-900 shadow-md' : 'bg-white text-text-secondary hover:bg-surface-container-lowest border border-outline-variant/30'}`}
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                Adaptive
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              
              {/* Assessments Section (Moved to top) */}
              {assessments.filter(a => a.assessment_type !== 'TOPIC').length > 0 && (
                <div className="border-b border-outline-variant/30 bg-surface-container-low">
                  <div className="p-4 border-b border-outline-variant/30">
                     <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-widest text-text-secondary">
                        <span className="material-symbols-outlined text-sm">quiz</span> Assessments
                     </h3>
                  </div>
                  <ul className="divide-y divide-outline-variant/10">
                    {assessments.filter(a => a.assessment_type !== 'TOPIC').map(a => {
                      const isCompleted = a.attempts?.some((attempt: any) => attempt.status === 'SUBMITTED');
                      return (
                      <li key={a.assessment_id}>
                        <button 
                          onClick={() => {
                            if (course.initial_assessment_pending && a.assessment_id !== course.initial_assessment.assessment_id) {
                              alert("Please complete the Initial Assessment first.");
                              return;
                            }
                            setActiveTopicId(null);
                            setActiveResource(null);
                            setActiveAssessmentId(a.assessment_id);
                          }}
                          className="w-full text-left p-4 hover:bg-white transition-colors flex items-center justify-between"
                        >
                          <div>
                             <div className="flex items-center gap-2">
                               <h4 className="font-bold text-sm text-on-surface">{a.title}</h4>
                               {isCompleted && <span className="material-symbols-outlined text-[14px] text-green-500">check_circle</span>}
                             </div>
                             <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-0.5">{a.assessment_type} - {a.total_questions} Qs</p>
                          </div>
                          <span className="material-symbols-outlined text-sm opacity-50">chevron_right</span>
                        </button>
                      </li>
                    )})}
                  </ul>
                </div>
              )}

              {/* Course Topics */}
              {course.initial_assessment_pending ? (
                <div className="p-6 text-center">
                  <div className="bg-primary/10 text-primary p-4 rounded-xl border border-primary/20 mb-4">
                    <span className="material-symbols-outlined text-4xl mb-2">lock</span>
                    <h4 className="font-bold mb-1">Course Locked</h4>
                    <p className="text-sm mb-4">You must complete the Initial Assessment above to unlock the course modules.</p>
                    <button 
                      onClick={() => navigate(`/assessments/${course.initial_assessment.assessment_id}/take`, { state: { returnUrl: `/learn/${courseSlug}` } })}
                      className="bg-primary text-white font-bold py-2 px-6 rounded-lg w-full"
                    >
                      Take Initial Assessment
                    </button>
                  </div>
                </div>
              ) : isAdaptiveMode && loadingAdaptive ? (
                <div className="p-10 flex justify-center"><span className="material-symbols-outlined animate-spin text-3xl text-primary">refresh</span></div>
              ) : getDisplayedTopics().length === 0 ? (
                <div className="p-6 text-center text-text-secondary text-sm">
                  {isAdaptiveMode ? 'You have mastered all topics!' : 'No content available for this course yet.'}
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/30">
                  {getDisplayedTopics().map((topic: any, index: number) => (
                    <div key={topic.topic_id || topic.topicId} className="bg-white">
                      <button 
                        onClick={() => {
                          const newTopicId = activeTopicId === (topic.topic_id || topic.topicId) ? null : (topic.topic_id || topic.topicId);
                          setActiveTopicId(newTopicId);
                          setActiveBlockIndex(0);
                          setTryAnswers({});
                          if (isAdaptiveMode) {
                            setActiveResource(null);
                            setActiveAssessmentId(null);
                          }
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest transition-colors text-left"
                      >
                        <div className="flex items-start gap-3 flex-1 overflow-hidden">
                          <span className="text-primary font-bold text-sm mt-0.5 shrink-0">{(index + 1).toString().padStart(2, '0')}</span>
                          <div className="flex-1 pr-2">
                            <h4 className={`font-bold text-sm ${activeTopicId === (topic.topic_id || topic.topicId) ? 'text-primary' : 'text-on-surface'}`}>{topic.topic_title || topic.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {isAdaptiveMode && topic.proficiency ? (
                                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                                  {Math.round((topic.knowledgeScore || 0) * 100)}% • {topic.proficiency}
                                </span>
                              ) : (
                                <span className="text-[10px] text-text-secondary uppercase tracking-widest">
                                  {topic.resources ? topic.resources.length : 0} items
                                </span>
                              )}
                            </div>
                            
                            {/* Topic Progress Bar */}
                            <div className="flex items-center gap-3 mt-3">
                              <div className="flex-1 bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                                <div className="bg-accent-neon h-full rounded-full transition-all duration-300" style={{ width: `${getTopicProgress(topic)}%` }}></div>
                              </div>
                              <span className="text-[10px] font-bold text-text-secondary w-8 text-right">{getTopicProgress(topic)}%</span>
                            </div>
                            
                            {isAdaptiveMode && topic.reason && (
                               <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/30 mt-3 text-left">
                                  <div className="text-xs font-bold text-on-surface mb-1">{topic.reason}</div>
                                  {topic.extendedReason && (
                                    <div className="text-xs text-text-secondary">{topic.extendedReason}</div>
                                  )}
                               </div>
                            )}
                          </div>
                        </div>
                        <span className={`material-symbols-outlined shrink-0 text-text-secondary transition-transform duration-300 ${activeTopicId === (topic.topic_id || topic.topicId) ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>
                      
                      {activeTopicId === (topic.topic_id || topic.topicId) && (
                        <div className="bg-surface-container-lowest/50 border-t border-outline-variant/10 p-2">
                          
                          {/* Personalized AI Lesson Section (Moved to Main Viewer) */}
                          
                          {/* Learning Journey UI */}
                          {isAdaptiveMode && (
                            <div className="mb-4 bg-surface-container-low rounded-xl border border-outline-variant/30 p-4">
                              <h6 className="font-bold text-[11px] uppercase tracking-widest text-text-secondary mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[14px]">route</span>
                                Learning Journey
                              </h6>
                              
                              {(() => {
                                // 1. Determine base state from proficiency
                                const isMaster = topic.proficiency === 'ADVANCED' || topic.proficiency === 'MASTER';
                                const isProficient = topic.proficiency === 'PROFICIENT' || isMaster;
                                
                                let highestCompleted = -1;
                                
                                if (isMaster) highestCompleted = 5;
                                else if (isProficient) highestCompleted = 4;
                                else {
                                  // Look at lesson interactions
                                  const hasTried = Object.keys(submittedTryAnswers).length > 0;
                                  const hasPracticed = Object.keys(submittedPracticeAnswers).length > 0;
                                  
                                  let passedConcept = false;
                                  let passedExample = false;
                                  
                                  if (parsedAiLesson && parsedAiLesson.blocks) {
                                    for (let i = 0; i < activeBlockIndex; i++) {
                                      if (parsedAiLesson.blocks[i].type === 'CONCEPT') passedConcept = true;
                                      if (parsedAiLesson.blocks[i].type === 'EXAMPLE') passedExample = true;
                                    }
                                  }
                                  
                                  if (hasPracticed) highestCompleted = 3;
                                  else if (hasTried) highestCompleted = 2;
                                  else if (passedExample) highestCompleted = 1;
                                  else if (passedConcept || activeBlockIndex > 0) highestCompleted = 0;
                                }

                                const currentIndex = Math.min(5, highestCompleted + 1);
                                
                                let currentLabel = 'Learning Concept';
                                if (parsedAiLesson && parsedAiLesson.blocks[activeBlockIndex]) {
                                  const currentBlockType = parsedAiLesson.blocks[activeBlockIndex].type;
                                  switch(currentBlockType) {
                                    case 'CONCEPT': currentLabel = 'Learning Concept'; break;
                                    case 'EXAMPLE': currentLabel = 'Understanding Example'; break;
                                    case 'TRY': currentLabel = 'Trying it Out'; break;
                                    case 'PRACTICE': currentLabel = 'Practicing Skills'; break;
                                    case 'CHALLENGE': currentLabel = 'Checking Knowledge'; break;
                                    case 'RECAP': currentLabel = isMaster ? 'Mastery Achieved' : 'Reviewing'; break;
                                  }
                                } else if (isMaster) {
                                  currentLabel = 'Mastery Achieved';
                                } else if (isProficient) {
                                  currentLabel = 'Testing Knowledge';
                                }

                                let nextLabel = '';
                                if (!isMaster) {
                                  if (currentIndex === 0) nextLabel = 'Read concept explanation';
                                  else if (currentIndex === 1) nextLabel = 'Review the example';
                                  else if (currentIndex === 2) nextLabel = 'Complete a Try activity';
                                  else if (currentIndex === 3) nextLabel = 'Submit Practice activity';
                                  else if (currentIndex === 4) nextLabel = 'Pass topic assessment';
                                  else if (currentIndex === 5) nextLabel = 'Achieve mastery';
                                }
                                
                                return (
                                  <div>
                                    <div className="relative pl-3 mb-2 border-l-2 border-outline-variant/20 ml-1.5 space-y-2">
                                      {LEARNING_STAGES.map((stage, sIdx) => {
                                        const isActive = sIdx === currentIndex;
                                        const isPast = sIdx <= highestCompleted;
                                        return (
                                          <div key={stage} className="flex items-center gap-2 relative">
                                            {/* Journey Node */}
                                            <div className={`absolute -left-[17px] w-2 h-2 rounded-full border bg-white flex items-center justify-center ${isActive ? 'border-primary ring-2 ring-primary/10 w-2.5 h-2.5 -left-[18px]' : isPast ? 'border-primary bg-primary' : 'border-outline-variant/50'}`}>
                                              {isActive && <div className="w-1 h-1 bg-primary rounded-full"></div>}
                                            </div>
                                            <span className={`text-xs flex items-center gap-1 ${isActive ? 'text-primary font-bold' : isPast ? 'text-on-surface font-medium' : 'text-text-secondary'}`}>
                                              {isPast && <span className="material-symbols-outlined text-[10px]">check</span>}
                                              {stage}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="bg-surface-container-lowest rounded-md p-3 border border-outline-variant/30 mt-4 shadow-sm">
                                      <div className="mb-2">
                                        <div className="text-[9px] uppercase tracking-widest text-text-secondary font-bold mb-0.5">Current Stage</div>
                                        <div className="text-sm font-bold text-primary">{currentLabel}</div>
                                      </div>
                                      
                                      {nextLabel && (
                                        <div className="pt-2 border-t border-outline-variant/30">
                                          <div className="text-[9px] uppercase tracking-widest text-text-secondary font-bold mb-0.5">Next</div>
                                          <div className="text-xs font-medium text-on-surface flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px] text-text-secondary">arrow_forward</span>
                                            {nextLabel}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Concept Focus Indicator */}
                                      {(() => {
                                        if (parsedAiLesson && parsedAiLesson.blocks && parsedAiLesson.blocks[activeBlockIndex]) {
                                          const currentBlock = parsedAiLesson.blocks[activeBlockIndex];
                                          if (currentBlock.conceptTags && Array.isArray(currentBlock.conceptTags) && currentBlock.conceptTags.length > 0) {
                                            for (const tag of currentBlock.conceptTags) {
                                              if (conceptPerformance[tag]) {
                                                const perf = conceptPerformance[tag];
                                                let msg = '';
                                                let icon = 'psychology';
                                                let colorClass = 'text-primary';
                                                
                                                if (perf === 'WEAK') {
                                                  msg = 'This concept needs a little more practice.';
                                                  icon = 'psychology_alt';
                                                  colorClass = 'text-orange-500';
                                                }
                                                else if (perf === 'DEVELOPING') {
                                                  msg = "You're building confidence with this concept.";
                                                  icon = 'model_training';
                                                  colorClass = 'text-blue-500';
                                                }
                                                else if (perf === 'STRONG') {
                                                  msg = "You're doing well with this concept.";
                                                  icon = 'workspace_premium';
                                                  colorClass = 'text-green-500';
                                                }
                                                
                                                return (
                                                  <div className="pt-2 mt-2 border-t border-outline-variant/30">
                                                    <div className="text-[9px] uppercase tracking-widest text-text-secondary font-bold mb-1">Current Focus</div>
                                                    <div className="bg-white rounded p-2 flex gap-2 items-start shadow-sm border border-outline-variant/20">
                                                      <span className={`material-symbols-outlined text-[16px] ${colorClass}`}>{icon}</span>
                                                      <div>
                                                        <div className="text-xs font-bold text-on-surface">{tag}</div>
                                                        <div className="text-[10px] text-text-secondary leading-tight mt-0.5">{msg}</div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              }
                                            }
                                          }
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}


                          {/* Original Resources */}
                          <details className="group" open={!isAdaptiveMode}>
                            <summary className="list-none flex items-center gap-2 cursor-pointer p-3 bg-surface-container-low rounded-lg font-bold text-sm text-text-secondary hover:bg-surface-container-lowest transition-colors select-none mb-2">
                              <span className="material-symbols-outlined transition-transform group-open:rotate-90">chevron_right</span>
                              📚 Original Course Resources
                            </summary>
                            <div className="pt-2 pl-2">
                              {!topic.resources || topic.resources.length === 0 ? (
                                <div className="text-xs text-text-secondary p-2 italic pl-8">No resources available</div>
                              ) : (
                                <ul className="space-y-1">
                                  {topic.resources.map((res: any) => {
                                    const isActive = activeResource?.resource_id === res.resource_id;
                                    return (
                                      <li key={res.resource_id}>
                                        <button 
                                          onClick={() => {
                                            setActiveAssessmentId(null);
                                            setActiveResource(res);
                                          }}
                                          className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-white text-text-secondary hover:text-on-surface'}`}
                                        >
                                          <span className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${isActive ? 'text-primary' : 'opacity-60'}`}>
                                            {getResourceIcon(res.resource_type)}
                                          </span>
                                          <div>
                                            <div className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{res.resource_title}</div>
                                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest mt-1">
                                              <span className="opacity-70">{res.resource_type}</span>
                                              {resourceProgressMap[res.resource_id] !== undefined && (
                                                <span className={`font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${resourceProgressMap[res.resource_id] === 100 ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'}`}>
                                                  {resourceProgressMap[res.resource_id] === 100 && <span className="material-symbols-outlined text-[10px]">check_circle</span>}
                                                  {resourceProgressMap[res.resource_id]}%
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          </details>
                          
                          {/* Topic Assessment Button */}
                          {isAdaptiveMode && getTopicProgress(topic) >= 80 && !hasPassedTopicAssessment(topic) && (
                            <div className="mt-4 p-3 border-t border-outline-variant/10">
                              <button
                                onClick={() => handleStartTopicAssessment(topic.topic_id || topic.topicId)}
                                disabled={isGenerating && generatingTopicId === (topic.topic_id || topic.topicId)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 font-bold text-sm transition-all"
                              >
                                {isGenerating && generatingTopicId === (topic.topic_id || topic.topicId) ? (
                                  <>
                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                    Generating Assessment...
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                                    Take Topic Assessment
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                          
                          {isAdaptiveMode && hasPassedTopicAssessment(topic) && (
                             <div className="mt-4 p-4 border-t border-outline-variant/10 bg-green-500/5 text-center rounded-b-xl">
                               <div className="text-green-600 font-bold flex items-center justify-center gap-2">
                                 <span className="material-symbols-outlined">verified</span>
                                 Topic Mastered
                               </div>
                               <div className="text-[11px] text-text-secondary mt-1">
                                 You have already passed the assessment for this topic.
                               </div>
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Floating AI Tutor Button */}
      {!tutorOpen && !activeAssessmentId && (
        <button
          onClick={() => setTutorOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
        >
          <span className="material-symbols-outlined text-3xl group-hover:animate-pulse">support_agent</span>
        </button>
      )}

      {/* AI Tutor Panel */}
      {tutorOpen && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-surface shadow-2xl shadow-black/10 z-50 flex flex-col border-l border-outline-variant/30 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 bg-surface border-b border-outline-variant/30 text-text">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
              <h2 className="font-black tracking-wide text-lg text-text">MENTORA TUTOR</h2>
            </div>
            <button onClick={() => setTutorOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-text-secondary">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-surface-container-lowest">
            <div className="bg-surface-container-highest/20 rounded-xl p-3 border border-outline-variant/20">
              <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Current Context</p>
              <p className="text-sm font-medium line-clamp-1">{activeTopicId ? course?.topics.find((t: any) => (t.topic_id || t.topicId) === activeTopicId)?.topic_title : course?.title}</p>
            </div>

            {tutorResponse && (
              <div className="flex flex-col gap-2 mb-4">
                <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-sm self-end max-w-[85%] shadow-sm">
                  <p className="text-sm">{tutorResponse.query || tutorQuery}</p>
                </div>
                
                <div className="bg-white border border-outline-variant/30 p-4 rounded-2xl rounded-tl-sm self-start w-full shadow-sm">
                  <div className="prose prose-sm prose-primary max-w-none prose-p:leading-relaxed prose-p:mb-2 prose-strong:text-primary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{tutorResponse.answer}</ReactMarkdown>
                  </div>
                  
                  {tutorResponse.keyPoints && tutorResponse.keyPoints.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-outline-variant/30">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Key Points</p>
                      <ul className="list-disc pl-4 text-sm text-text-secondary space-y-1">
                        {tutorResponse.keyPoints.map((kp: string, i: number) => <li key={i}>{kp}</li>)}
                      </ul>
                    </div>
                  )}

                  {tutorResponse.example && (
                    <div className="mt-4 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                      <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">lightbulb</span> Example
                      </p>
                      <p className="text-sm italic">{tutorResponse.example}</p>
                    </div>
                  )}

                  {tutorResponse.practicePrompt && (
                    <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/20">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">psychology</span> Practice Prompt
                      </p>
                      <p className="text-sm">{tutorResponse.practicePrompt}</p>
                    </div>
                  )}

                  {tutorResponse.sources && tutorResponse.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-outline-variant/30">
                      <p className="text-xs font-bold text-text-secondary mb-2 flex items-center gap-1">
                         <span className="material-symbols-outlined text-[14px]">menu_book</span> Sources
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {tutorResponse.sources.map((s: any, i: number) => (
                           <span key={i} className="text-[10px] bg-surface-container-highest px-2 py-1 rounded-md text-text-secondary truncate max-w-full">
                             {s.resourceName} (p. {s.pageNumber})
                           </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-1 text-[10px] text-text-secondary/60">
                    <span className="material-symbols-outlined text-[12px]">info</span>
                    Adapted to your proficiency and teaching preference
                  </div>
                </div>
              </div>
            )}

            {tutorLoading && (
              <div className="flex flex-col gap-2 mb-4">
                <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-sm self-end max-w-[85%] shadow-sm">
                  <p className="text-sm">{tutorQuery}</p>
                </div>
                <div className="bg-white border border-outline-variant/30 p-4 rounded-2xl rounded-tl-sm self-start shadow-sm flex items-center gap-3">
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                  <span className="text-sm text-text-secondary animate-pulse">Analyzing course material...</span>
                </div>
              </div>
            )}

            {tutorError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-200">
                <span className="font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">error</span> Error</span>
                <p>{tutorError}</p>
              </div>
            )}
            
            {!tutorResponse && !tutorLoading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-60">
                <span className="material-symbols-outlined text-5xl mb-3 text-text-secondary">chat_bubble</span>
                <p className="font-medium text-text-secondary">Ask Mentora Tutor a question based on your current course topic.</p>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={askTutor} className="p-4 bg-white border-t border-outline-variant/30">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask about this topic..."
                value={tutorQuery}
                onChange={(e) => setTutorQuery(e.target.value)}
                disabled={tutorLoading}
                className="w-full pl-4 pr-12 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button 
                type="submit" 
                disabled={!tutorQuery.trim() || tutorLoading}
                className="absolute right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </StudentLayout>
  );
}
