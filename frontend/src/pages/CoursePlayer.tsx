import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import AdaptiveJourneyStepper from '../components/learning/AdaptiveJourneyStepper';
import PrerequisiteGraphModal from '../components/learning/PrerequisiteGraphModal';

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

interface TutorSessionMessage {
  id: string;
  query: string;
  response?: {
    answer: string;
    keyPoints?: string[];
    example?: string;
    practicePrompt?: string;
    sources?: Array<{ resourceName: string; pageNumber: number }>;
  };
  error?: string;
  loading?: boolean;
}

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
  
  interface PracticeEvaluation {
    isCorrect: boolean;
    score: number;
    status: 'CORRECT' | 'PARTIALLY_CORRECT' | 'NEEDS_WORK';
    feedback: string;
    hints?: string[];
  }
  const [practiceEvaluations, setPracticeEvaluations] = useState<Record<number, PracticeEvaluation>>({});
  const [evaluatingPractice, setEvaluatingPractice] = useState<Record<number, boolean>>({});
  
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

  // AI Tutor State (in-memory session chat thread)
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorMessages, setTutorMessages] = useState<TutorSessionMessage[]>([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const tutorScrollRef = useRef<HTMLDivElement>(null);
  const lessonScrollRef = useRef<HTMLDivElement>(null);
  const mainViewerRef = useRef<HTMLDivElement>(null);
  const zenScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll tutor chat to bottom when new messages arrive
  useEffect(() => {
    if (tutorScrollRef.current) {
      tutorScrollRef.current.scrollTo({
        top: tutorScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [tutorMessages, tutorLoading, tutorOpen]);

  // Neo4j Knowledge Graph & Zen Focus Mode State
  const [showGraphModal, setShowGraphModal] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [zenTheme, setZenTheme] = useState<'midnight' | 'slate' | 'warm'>('midnight');

  const handleSelectTopicFromGraph = (topicId: number) => {
    setActiveTopicId(topicId);
    setActiveBlockIndex(0);
    setTryAnswers({});
    if (isAdaptiveMode) {
      setActiveResource(null);
      setActiveAssessmentId(null);
    }
  };

  const askTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = tutorQuery.trim();
    if (!queryText || !course || tutorLoading) return;

    const messageId = `msg-${Date.now()}`;
    const newMsg: TutorSessionMessage = {
      id: messageId,
      query: queryText,
      loading: true,
    };

    setTutorMessages((prev) => [...prev, newMsg]);
    setTutorQuery('');
    setTutorLoading(true);

    try {
      const res = await fetch(`${API_URL}/adaptive-learning/students/${user.user_id}/courses/${course.course_id}/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          topic_id: activeTopicId,
          query: queryText
        })
      });

      if (!res.ok) {
        throw new Error('Tutor service unavailable.');
      }

      const data = await res.json();
      setTutorMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                loading: false,
                response: {
                  answer: data.answer,
                  keyPoints: data.keyPoints,
                  example: data.example,
                  practicePrompt: data.practicePrompt,
                  sources: data.sources,
                },
              }
            : msg
        )
      );
    } catch (err: any) {
      setTutorMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                loading: false,
                error: err.message || 'Failed to get an answer.',
              }
            : msg
        )
      );
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
          setPracticeEvaluations(saved.practiceEvaluations || {});
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
          setPracticeEvaluations({});
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
        practiceEvaluations,
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
  }, [activeTopicId, course, token, API_URL, readProgress, activeBlockIndex, tryAnswers, submittedTryAnswers, tryAttemptCounts, practiceAnswers, submittedPracticeAnswers, practiceAttemptCounts, practiceEvaluations, aiCompletedTopics]);

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

  const refreshConceptPerformance = useCallback(() => {
    if (token && activeTopicId && course?.course_id) {
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
  }, [API_URL, activeTopicId, course, token]);

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

  // Active topic object for Adaptive Journey & Radar
  const activeTopicObj = course?.topics.find((t: any) => t.topic_id === activeTopicId) 
    || (adaptivePath || []).find((t: any) => (t.topicId || t.topic_id) === activeTopicId);

  const topicProficiency = activeTopicObj?.proficiency 
    || (activeTopicId ? knowledgeStates[activeTopicId]?.proficiency : undefined)
    || 'UNASSESSED';

  const topicKnowledgeScore = activeTopicId ? knowledgeStates[activeTopicId]?.score : undefined;

  const isMasterTopic = topicProficiency === 'ADVANCED' || topicProficiency === 'MASTER';
  const isProficientTopic = topicProficiency === 'PROFICIENT' || isMasterTopic;

  let highestCompletedStage = -1;
  if (isMasterTopic) {
    highestCompletedStage = 5;
  } else if (isProficientTopic) {
    highestCompletedStage = 4;
  } else {
    const hasTried = Object.keys(submittedTryAnswers).length > 0;
    const hasPracticed = Object.keys(submittedPracticeAnswers).length > 0;
    let passedConcept = false;
    let passedExample = false;

    if (parsedAiLesson && parsedAiLesson.blocks) {
      for (let i = 0; i < safeBlockIndex; i++) {
        if (parsedAiLesson.blocks[i]?.type === 'CONCEPT') passedConcept = true;
        if (parsedAiLesson.blocks[i]?.type === 'EXAMPLE') passedExample = true;
      }
    }

    if (hasPracticed) highestCompletedStage = 3;
    else if (hasTried) highestCompletedStage = 2;
    else if (passedExample) highestCompletedStage = 1;
    else if (passedConcept || safeBlockIndex > 0) highestCompletedStage = 0;
  }

  let currentStageIndex = Math.min(5, highestCompletedStage + 1);
  if (parsedAiLesson && parsedAiLesson.blocks && parsedAiLesson.blocks[safeBlockIndex]) {
    const blockType = parsedAiLesson.blocks[safeBlockIndex].type;
    if (blockType === 'CONCEPT') currentStageIndex = 0;
    else if (blockType === 'EXAMPLE') currentStageIndex = 1;
    else if (blockType === 'TRY') currentStageIndex = 2;
    else if (blockType === 'PRACTICE' || blockType === 'CHALLENGE') currentStageIndex = 3;
    else if (blockType === 'RECAP') currentStageIndex = isMasterTopic ? 5 : 4;
  }

  let stageCurrentLabel = 'Learning Concept';
  if (parsedAiLesson && parsedAiLesson.blocks && parsedAiLesson.blocks[safeBlockIndex]) {
    const currentBlockType = parsedAiLesson.blocks[safeBlockIndex].type;
    switch(currentBlockType) {
      case 'CONCEPT': stageCurrentLabel = 'Learning Concept'; break;
      case 'EXAMPLE': stageCurrentLabel = 'Understanding Example'; break;
      case 'TRY': stageCurrentLabel = 'Trying it Out'; break;
      case 'PRACTICE': stageCurrentLabel = 'Practicing Skills'; break;
      case 'CHALLENGE': stageCurrentLabel = 'Checking Knowledge'; break;
      case 'RECAP': stageCurrentLabel = isMasterTopic ? 'Mastery Achieved' : 'Reviewing'; break;
    }
  } else if (isMasterTopic) {
    stageCurrentLabel = 'Mastery Achieved';
  } else if (isProficientTopic) {
    stageCurrentLabel = 'Testing Knowledge';
  }

  let stageNextLabel = '';
  if (!isMasterTopic) {
    if (currentStageIndex === 0) stageNextLabel = 'Review the real-world example';
    else if (currentStageIndex === 1) stageNextLabel = 'Complete interactive Try quiz';
    else if (currentStageIndex === 2) stageNextLabel = 'Submit hands-on Practice challenge';
    else if (currentStageIndex === 3) stageNextLabel = 'Take topic check assessment';
    else if (currentStageIndex === 4) stageNextLabel = 'Pass assessment to achieve mastery';
  }

  const weakConceptsList = Object.entries(conceptPerformance)
    .filter(([_, perf]) => perf === 'WEAK' || perf === 'DEVELOPING')
    .map(([tag]) => tag);

  const handleStageNavigation = (stageIdx: number) => {
    if (stageIdx === 4 || stageIdx === 5) {
      if (activeTopicId) {
        handleStartTopicAssessment(activeTopicId);
      }
      return;
    }

    if (!parsedAiLesson || !parsedAiLesson.blocks) return;

    const targetTypes: Record<number, string[]> = {
      0: ['CONCEPT'],
      1: ['EXAMPLE'],
      2: ['TRY'],
      3: ['PRACTICE', 'CHALLENGE'],
    };

    const allowed = targetTypes[stageIdx];
    if (allowed) {
      const foundIdx = parsedAiLesson.blocks.findIndex((b: any) => allowed.includes(b.type));
      if (foundIdx !== -1) {
        setActiveBlockIndex(foundIdx);
        lessonScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        mainViewerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Scroll to top of lesson content on block or topic change
  useEffect(() => {
    if (lessonScrollRef.current) {
      lessonScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (mainViewerRef.current) {
      mainViewerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [safeBlockIndex, activeTopicId]);

  const renderBlock = (block: any, index: number, isZen: boolean = isZenMode) => {
    // Theme-sensitive helpers for Zen Focus Mode
    const isWarm = isZen && zenTheme === 'warm';
    const isSlate = isZen && zenTheme === 'slate';

    const getBlockCardClass = (defaultNormalClass: string) => {
      if (!isZen) return defaultNormalClass;
      if (isWarm) return 'bg-[#1b1512]/90 border border-amber-900/40 text-amber-50 shadow-2xl backdrop-blur-xl';
      if (isSlate) return 'bg-slate-900/75 border border-slate-700/60 text-slate-100 shadow-2xl backdrop-blur-xl';
      return 'bg-white/[0.04] border border-white/10 text-slate-100 shadow-2xl backdrop-blur-xl';
    };

    const getTitleClass = () => {
      if (!isZen) return 'text-primary';
      if (isWarm) return 'text-amber-100';
      return 'text-white';
    };

    const getProseClass = () => {
      if (!isZen) return 'text-on-surface prose-p:leading-relaxed';
      if (isWarm) {
        return 'prose-invert text-amber-100/90 prose-headings:text-amber-100 prose-headings:font-bold prose-strong:text-amber-300 prose-code:text-amber-300 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-ul:text-amber-100/90 prose-li:text-amber-100/90';
      }
      return 'prose-invert text-slate-200 prose-headings:text-white prose-headings:font-bold prose-strong:text-accent-neon prose-code:text-accent-neon prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-ul:text-slate-200 prose-li:text-slate-200';
    };

    switch (block.type) {
      case 'CONCEPT':
        return (
          <div className={`group p-8 rounded-3xl mb-8 transition-all relative overflow-hidden ${getBlockCardClass('bg-gradient-to-br from-surface-container-low to-surface-container-lowest border border-outline-variant/30 shadow-sm hover:shadow-md')}`}>
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl transition-all duration-500 ${
              isZen ? (isWarm ? 'bg-amber-600/10' : 'bg-accent-neon/15 group-hover:bg-accent-neon/25') : 'bg-primary/10 group-hover:bg-primary/20'
            }`}></div>
            <h3 className={`font-bold text-xl mb-5 flex items-center gap-3 relative z-10 ${getTitleClass()}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${
                isZen ? 'bg-accent-neon/20 text-accent-neon border border-accent-neon/30' : 'bg-primary/10 text-primary'
              }`}>
                <span className="material-symbols-outlined">lightbulb</span>
              </div>
              {block.title}
            </h3>
            {block.visual && block.visual.url && (
              <LessonVisual visual={block.visual} className="relative z-10 mb-6" isDark={isZen} />
            )}
            <div className={`prose prose-lg max-w-none relative z-10 ${getProseClass()}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
            </div>
          </div>
        );
      case 'EXAMPLE':
        return (
          <div className={`group rounded-3xl overflow-hidden mb-8 transition-all ${getBlockCardClass('bg-surface-container-lowest border border-outline-variant/30 shadow-sm hover:shadow-md')}`}>
            <div className={`px-6 py-4 flex items-center justify-between ${
              isZen
                ? (isWarm ? 'bg-amber-950/20 border-b border-amber-900/40 text-amber-200' : 'bg-white/[0.03] border-b border-white/10 text-slate-200')
                : 'bg-gradient-to-r from-surface-container-low to-surface-container-lowest border-b border-outline-variant/30 text-text-secondary'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                  isZen ? 'bg-accent-neon/20 text-accent-neon border border-accent-neon/30' : 'bg-primary/10 text-primary'
                }`}>
                  <span className="material-symbols-outlined text-sm">code_blocks</span>
                </div>
                <h3 className={`font-bold text-sm uppercase tracking-widest transition-colors ${
                  isZen ? (isWarm ? 'text-amber-100' : 'text-white') : 'text-text-secondary group-hover:text-primary'
                }`}>
                  {block.title}
                </h3>
              </div>
              {isZen && (
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent-neon bg-accent-neon/10 px-2 py-0.5 rounded-full border border-accent-neon/20">
                  Code Example
                </span>
              )}
            </div>
            {block.visual && block.visual.url && (
              <div className="px-6 pt-6 pb-0">
                <LessonVisual visual={block.visual} isDark={isZen} />
              </div>
            )}
            <div className="p-6 relative">
              <div className={`absolute top-0 right-10 w-24 h-24 rounded-full blur-2xl transition-all duration-500 ${
                isZen ? (isWarm ? 'bg-amber-600/10' : 'bg-accent-neon/10 group-hover:bg-accent-neon/20') : 'bg-primary/5 group-hover:bg-primary/10'
              }`}></div>
              <div className={`p-5 rounded-2xl font-mono text-sm overflow-x-auto mb-6 border shadow-inner relative z-10 ${
                isZen
                  ? 'bg-black/75 border-white/15 text-emerald-300'
                  : 'bg-surface-container-highest/80 text-on-surface border-outline-variant/30'
              }`}>
                <pre><code>{block.code}</code></pre>
              </div>
              <div className={`prose max-w-none relative z-10 ${getProseClass()}`}>
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
          <div className={`group p-8 rounded-3xl mb-8 relative overflow-hidden transition-all ${getBlockCardClass('bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] border border-primary/20 shadow-sm')}`}>
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 transition-all duration-700 ${
              isZen ? (isWarm ? 'bg-amber-600/10' : 'bg-accent-neon/10 group-hover:bg-accent-neon/20') : 'bg-primary/10 group-hover:bg-primary/15'
            }`}></div>
            <h3 className={`font-bold text-xl mb-5 flex items-center gap-3 relative z-10 ${getTitleClass()}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${
                isZen ? 'bg-accent-neon text-black font-extrabold shadow-accent-neon/20' : 'bg-primary text-white'
              }`}>
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <span>{block.title}</span>
            </h3>
            {block.visual && block.visual.url && (
              <LessonVisual visual={block.visual} className="relative z-10 mb-6" isDark={isZen} />
            )}
            <div className={`text-xl mb-8 leading-relaxed relative z-10 ${
              isZen ? (isWarm ? 'text-amber-50 font-semibold' : 'text-white font-semibold') : 'text-lg text-on-surface font-medium'
            }`}>
              {block.question}
            </div>
            
            <div className="space-y-4 mb-8 relative z-10">
              {block.options.map((opt: string, oIdx: number) => {
                const isSelected = tryAnswers[index] === oIdx;
                let btnClass = isZen
                  ? (isWarm
                      ? 'bg-white/[0.04] border-amber-900/40 text-amber-50 hover:bg-white/[0.08] hover:border-amber-400/50 shadow-sm'
                      : 'bg-white/[0.05] border-white/15 text-slate-100 hover:bg-white/[0.1] hover:border-accent-neon/50 shadow-sm')
                  : 'bg-white border-outline-variant/30 text-on-surface hover:bg-surface-container-lowest hover:border-primary/50 shadow-sm';
                
                if (isSubmitted) {
                  if (oIdx === block.answer) {
                    btnClass = isZen
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 shadow-md ring-1 ring-emerald-400/40'
                      : 'bg-green-50 border-green-500 text-green-900 shadow-sm';
                  } else if (isSelected) {
                    btnClass = isZen
                      ? 'bg-rose-500/20 border-rose-400 text-rose-100 shadow-md ring-1 ring-rose-400/40'
                      : 'bg-red-50 border-red-500 text-red-900 shadow-sm';
                  } else {
                    btnClass = isZen
                      ? 'bg-white/[0.02] border-white/5 text-slate-500 opacity-40'
                      : 'bg-white border-outline-variant/10 text-text-secondary opacity-50';
                  }
                } else if (isSelected) {
                  btnClass = isZen
                    ? 'bg-accent-neon/15 border-accent-neon text-accent-neon shadow-lg ring-2 ring-accent-neon/30'
                    : 'bg-primary/5 border-primary text-primary shadow-md ring-2 ring-primary/20';
                }

                // Radio circle styling
                let radioBorderClass = isZen ? 'border-white/30' : 'border-outline-variant/50';
                if (isSelected || (isSubmitted && oIdx === block.answer)) {
                  if (isSubmitted) {
                    radioBorderClass = oIdx === block.answer ? 'border-emerald-400' : 'border-rose-400';
                  } else {
                    radioBorderClass = isZen ? 'border-accent-neon' : 'border-primary';
                  }
                }

                let dotClass = isZen ? 'bg-accent-neon' : 'bg-primary';
                if (isSubmitted) {
                  dotClass = oIdx === block.answer ? (isZen ? 'bg-emerald-400' : 'bg-green-500') : (isZen ? 'bg-rose-400' : 'bg-red-500');
                }

                return (
                  <button 
                    key={oIdx}
                    disabled={isSubmitted}
                    onClick={() => setTryAnswers(prev => ({...prev, [index]: oIdx}))}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-medium flex items-center gap-4 ${btnClass}`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${radioBorderClass}`}>
                      {(isSelected || (isSubmitted && oIdx === block.answer)) && (
                        <div className={`w-3 h-3 rounded-full ${dotClass}`} />
                      )}
                    </div>
                    <span className="leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            {!isSubmitted && (
              <div className="flex justify-end mb-6 relative z-10">
                <button
                  onClick={handleCheckAnswer}
                  disabled={!hasSelection}
                  className={`px-7 py-3 rounded-xl font-bold disabled:opacity-40 transition-all flex items-center gap-2 shadow-md active:scale-95 ${
                    isZen
                      ? 'bg-accent-neon text-black font-extrabold hover:bg-accent-neon/90 shadow-accent-neon/20'
                      : 'px-6 py-2.5 bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  <span>Check Answer</span>
                </button>
              </div>
            )}

            {isSubmitted && (
              <div className={`p-6 rounded-2xl border animate-fade-in-up relative z-10 ${
                isZen
                  ? (isCorrect
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100 shadow-xl backdrop-blur-md'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-100 shadow-xl backdrop-blur-md')
                  : (isCorrect ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900')
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`font-bold flex items-center gap-2 mb-2 text-base ${
                      isZen
                        ? (isCorrect ? 'text-emerald-300' : 'text-rose-300')
                        : (isCorrect ? 'text-green-700' : 'text-red-700')
                    }`}>
                      <span className="material-symbols-outlined">
                        {isCorrect ? 'check_circle' : 'cancel'}
                      </span>
                      <span>{isCorrect ? 'Correct!' : 'Incorrect'}</span>
                    </div>
                    <div className={`text-sm leading-relaxed ${
                      isZen ? 'text-slate-200 font-normal' : 'text-on-surface'
                    }`}>
                      {block.explanation}
                    </div>
                  </div>
                  
                  {!isCorrect && (
                    <button 
                      onClick={handleRetry}
                      className={`shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-1.5 ${
                        isZen
                          ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                          : 'bg-white border border-outline-variant/30 text-text-secondary hover:bg-surface-container-lowest'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">refresh</span>
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            
            <CoachFeedback message={coachMessages[index]} isDark={isZen} />
          </div>
        );
      case 'PRACTICE':
      case 'CHALLENGE':
        const isPracSubmitted = submittedPracticeAnswers[index] !== undefined;
        const currentAnswer = practiceAnswers[index] || '';
        const isEvaluating = !!evaluatingPractice[index];
        const evaluation = practiceEvaluations[index];
        
        const handlePracticeSubmit = async () => {
          if (!currentAnswer.trim() || isPracSubmitted || isEvaluating || !course) return;
          const attemptNum = (practiceAttemptCounts[index] || 0) + 1;
          
          setEvaluatingPractice(prev => ({ ...prev, [index]: true }));
          setPracticeAttemptCounts(prev => ({ ...prev, [index]: attemptNum }));

          try {
            const res = await fetch(`${API_URL}/learning-progress/evaluate-practice`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                courseId: course.course_id,
                topicId: activeTopicId,
                instruction: block.instruction || block.title,
                studentAnswer: currentAnswer,
                blockType: block.type,
                attemptNumber: attemptNum,
                topicTitle: activeTopicObj?.topic_title || '',
                conceptTags: block.conceptTags || []
              })
            });

            if (!res.ok) {
              throw new Error(`Evaluation failed with status ${res.status}`);
            }

            const evalData: PracticeEvaluation = await res.json();
            setPracticeEvaluations(prev => ({ ...prev, [index]: evalData }));
            setSubmittedPracticeAnswers(prev => ({ ...prev, [index]: currentAnswer }));

            // Coaching message tailored to AI score
            let coachMsg = '';
            if (evalData.status === 'CORRECT') {
              coachMsg = "🌟 Brilliant solution! You've mastered this exercise.";
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
            } else if (evalData.status === 'PARTIALLY_CORRECT') {
              coachMsg = "⚡ Great attempt! You're very close—review the hints to reach 100%.";
            } else {
              coachMsg = "💡 Keep going! Check the guidance below and try revising your answer.";
            }
            setCoachMessages(prev => ({ ...prev, [index]: coachMsg }));

            // Refresh Concept Performance so Mastery Radar updates live
            refreshConceptPerformance();
          } catch (err) {
            console.error('Failed to evaluate practice answer', err);
            // Fallback: record submission without breaking flow
            setSubmittedPracticeAnswers(prev => ({ ...prev, [index]: currentAnswer }));
            logBlockInteraction(
              block.type,
              true,
              attemptNum,
              currentAnswer,
              block.conceptTags
            );
            refreshConceptPerformance();
          } finally {
            setEvaluatingPractice(prev => ({ ...prev, [index]: false }));
          }
        };

        const handlePracticeRetry = () => {
          setSubmittedPracticeAnswers(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
          });
        };

        return (
          <div className={`group p-8 rounded-3xl mb-8 relative overflow-hidden transition-all ${getBlockCardClass('bg-gradient-to-br from-accent-neon/[0.08] to-accent-neon/[0.02] border border-accent-neon/30 shadow-sm')}`}>
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 transition-all duration-700 ${
              isZen ? (isWarm ? 'bg-amber-600/15' : 'bg-accent-neon/15 group-hover:bg-accent-neon/25') : 'bg-accent-neon/10 group-hover:bg-accent-neon/20'
            }`}></div>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5 relative z-10">
              <h3 className={`font-bold text-xl flex items-center gap-3 ${getTitleClass()}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
                  isZen ? 'bg-accent-neon/20 text-accent-neon border border-accent-neon/30' : 'bg-accent-neon/20 text-accent-neon'
                }`}>
                  <span className="material-symbols-outlined">{block.type === 'CHALLENGE' ? 'emoji_events' : 'fitness_center'}</span>
                </div>
                <span>{block.title}</span>
              </h3>

              {isPracSubmitted && evaluation && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${
                  evaluation.status === 'CORRECT'
                    ? (isZen ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300')
                    : evaluation.status === 'PARTIALLY_CORRECT'
                    ? (isZen ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300')
                    : (isZen ? 'bg-rose-500/20 border-rose-400 text-rose-300' : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300')
                }`}>
                  <span className="material-symbols-outlined text-[15px]">
                    {evaluation.status === 'CORRECT' ? 'verified' : evaluation.status === 'PARTIALLY_CORRECT' ? 'published_with_changes' : 'help'}
                  </span>
                  <span>{evaluation.status === 'CORRECT' ? 'Verified Solution' : evaluation.status === 'PARTIALLY_CORRECT' ? 'Partially Correct' : 'Needs Work'}</span>
                  <span className="opacity-60">•</span>
                  <span>{evaluation.score}/100</span>
                </div>
              )}
            </div>

            {block.visual && block.visual.url && (
              <LessonVisual visual={block.visual} className="relative z-10 mb-6" isDark={isZen} />
            )}
            
            <div className={`prose prose-lg mb-6 relative z-10 max-w-none ${getProseClass()}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.instruction}</ReactMarkdown>
            </div>
            
            <div className="relative mb-6 z-10">
              <div className={`flex items-center justify-between text-xs font-semibold mb-2 px-1 ${
                isZen ? (isWarm ? 'text-amber-200/80' : 'text-slate-300') : 'text-text-secondary'
              }`}>
                <span className="flex items-center gap-1.5">
                  <span className={`material-symbols-outlined text-[15px] ${isZen ? 'text-accent-neon' : 'text-primary'}`}>code</span>
                  Your {block.type === 'CHALLENGE' ? 'Challenge Solution' : 'Practice Code / Answer'}
                </span>
                {practiceAttemptCounts[index] ? (
                  <span className={isZen ? 'text-slate-400' : 'opacity-75'}>Attempt #{practiceAttemptCounts[index]}</span>
                ) : null}
              </div>

              <div className={`rounded-2xl border-2 overflow-hidden transition-all shadow-inner ${
                isZen
                  ? 'bg-black/60 border-white/20 focus-within:border-accent-neon focus-within:ring-4 focus-within:ring-accent-neon/20'
                  : 'bg-white border-outline-variant/30 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10'
              }`}>
                <textarea 
                  className={`w-full h-44 p-4 bg-transparent outline-none resize-none font-mono text-sm disabled:opacity-85 ${
                    isZen
                      ? 'text-slate-100 placeholder:text-slate-500 placeholder:font-sans'
                      : 'text-on-surface placeholder:text-text-secondary/50 placeholder:font-sans'
                  }`}
                  placeholder={`Type your ${block.type === 'CHALLENGE' ? 'solution' : 'code or answer'} here...`}
                  value={currentAnswer}
                  onChange={(e) => setPracticeAnswers(prev => ({...prev, [index]: e.target.value}))}
                  disabled={isPracSubmitted || isEvaluating}
                  spellCheck={false}
                ></textarea>
              </div>
            </div>
            
            {!isPracSubmitted && (
              <div className="flex justify-end relative z-10 mb-2">
                <button
                  onClick={handlePracticeSubmit}
                  disabled={!currentAnswer.trim() || isEvaluating}
                  className={`px-7 py-3 rounded-xl font-bold disabled:opacity-40 transition-all flex items-center gap-2 shadow-md active:scale-95 ${
                    isZen
                      ? 'bg-accent-neon text-black font-extrabold hover:bg-accent-neon/90 shadow-accent-neon/20'
                      : 'px-6 py-2.5 bg-primary text-white hover:bg-primary/90 hover:shadow-primary/20'
                  }`}
                >
                  {isEvaluating ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      <span>Evaluating with AI Tutor...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      <span>Submit for AI Grading</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            {isPracSubmitted && (
              <div className={`p-6 rounded-2xl border transition-all animate-fade-in-up relative z-10 mb-2 ${
                isZen
                  ? (evaluation?.status === 'CORRECT'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100 shadow-xl backdrop-blur-md'
                      : evaluation?.status === 'PARTIALLY_CORRECT'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-100 shadow-xl backdrop-blur-md'
                      : evaluation?.status === 'NEEDS_WORK'
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-100 shadow-xl backdrop-blur-md'
                      : 'bg-white/10 border-white/20 text-slate-100 shadow-xl')
                  : (evaluation?.status === 'CORRECT'
                      ? 'bg-emerald-500/[0.06] border-emerald-500/30'
                      : evaluation?.status === 'PARTIALLY_CORRECT'
                      ? 'bg-amber-500/[0.06] border-amber-500/30'
                      : evaluation?.status === 'NEEDS_WORK'
                      ? 'bg-rose-500/[0.06] border-rose-500/30'
                      : 'bg-surface-container-highest border-outline-variant/50')
              }`}>
                <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b mb-4 ${
                  isZen ? 'border-white/10' : 'border-outline-variant/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${
                      evaluation?.status === 'CORRECT'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : evaluation?.status === 'PARTIALLY_CORRECT'
                        ? 'bg-amber-500/20 text-amber-400'
                        : evaluation?.status === 'NEEDS_WORK'
                        ? 'bg-rose-500/20 text-rose-400'
                        : (isZen ? 'bg-accent-neon/20 text-accent-neon' : 'bg-primary/10 text-primary')
                    }`}>
                      <span className="material-symbols-outlined">
                        {evaluation?.status === 'CORRECT' 
                          ? 'verified' 
                          : evaluation?.status === 'PARTIALLY_CORRECT' 
                          ? 'published_with_changes' 
                          : evaluation?.status === 'NEEDS_WORK'
                          ? 'help'
                          : 'assignment_turned_in'}
                      </span>
                    </div>
                    <div>
                      <div className={`font-bold text-base flex items-center gap-2 ${
                        isZen ? 'text-white' : 'text-on-surface'
                      }`}>
                        {evaluation?.status === 'CORRECT' 
                          ? 'Mastered / Correct Solution!' 
                          : evaluation?.status === 'PARTIALLY_CORRECT' 
                          ? 'Partially Correct Solution' 
                          : evaluation?.status === 'NEEDS_WORK'
                          ? 'Needs Refinement'
                          : 'Submission Recorded!'}
                      </div>
                      <div className={`text-xs font-medium ${
                        isZen ? 'text-slate-400' : 'text-text-secondary'
                      }`}>
                        {evaluation 
                          ? `Graded in real-time by Mentora AI • Attempt #${practiceAttemptCounts[index] || 1}` 
                          : 'Saved to your learning journey'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {evaluation?.score !== undefined && (
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                        evaluation.score >= 75
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : evaluation.score >= 45
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">scoreboard</span>
                        <span>Score: {evaluation.score}/100</span>
                      </div>
                    )}

                    <button 
                      onClick={handlePracticeRetry}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm ${
                        isZen
                          ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                          : 'bg-white border border-outline-variant/30 text-on-surface hover:bg-surface-container-lowest'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Revise Answer</span>
                    </button>
                  </div>
                </div>

                {/* AI Tutor Feedback formatted in Markdown */}
                <div className={`prose prose-sm max-w-none leading-relaxed mb-3 ${
                  isZen ? 'prose-invert text-slate-200 prose-strong:text-accent-neon' : 'text-on-surface/90'
                }`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {evaluation?.feedback || 'Great job completing this practice! Your answer has been saved to your learning journey.'}
                  </ReactMarkdown>
                </div>

                {/* Targeted Actionable Hints */}
                {evaluation?.hints && evaluation.hints.length > 0 && (
                  <div className={`mt-4 pt-3 border-t ${
                    isZen ? 'border-white/10' : 'border-outline-variant/20'
                  }`}>
                    <div className={`font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                      isZen ? 'text-slate-300' : 'text-text-secondary'
                    }`}>
                      <span className="material-symbols-outlined text-amber-400 text-[16px]">lightbulb</span>
                      <span>Tutor Insights & Suggestions</span>
                    </div>
                    <ul className="space-y-1.5">
                      {evaluation.hints.map((hint: string, hIdx: number) => (
                        <li key={hIdx} className={`text-xs flex items-start gap-2 ${
                          isZen ? 'text-slate-200' : 'text-on-surface/85'
                        }`}>
                          <span className={`material-symbols-outlined text-[14px] mt-0.5 shrink-0 ${
                            isZen ? 'text-accent-neon' : 'text-primary'
                          }`}>arrow_right</span>
                          <span>{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <CoachFeedback message={coachMessages[index]} isDark={isZen} />
          </div>
        );
      case 'RECAP':
        return (
          <div className={`group p-8 rounded-3xl mb-8 shadow-sm transition-all relative overflow-hidden ${getBlockCardClass('bg-gradient-to-br from-surface-container-highest to-surface-container-low border border-outline-variant/50 hover:shadow-md')}`}>
            <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl transition-all duration-500 ${
              isZen ? (isWarm ? 'bg-amber-600/10' : 'bg-primary/30 group-hover:bg-primary/50') : 'bg-primary/10 group-hover:bg-primary/20'
            }`}></div>
            <h3 className={`font-bold text-xl mb-6 flex items-center gap-3 relative z-10 ${getTitleClass()}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
                isZen
                  ? 'bg-accent-neon/20 border border-accent-neon/30 text-accent-neon'
                  : 'bg-surface-container-highest border border-outline-variant/50 text-primary'
              }`}>
                <span className="material-symbols-outlined">summarize</span>
              </div>
              <span>{block.title}</span>
            </h3>
            {block.visual && block.visual.url && (
              <LessonVisual visual={block.visual} className="relative z-10 mb-6" isDark={isZen} />
            )}
            <ul className="space-y-4 relative z-10">
              {block.points.map((pt: string, pIdx: number) => (
                <li key={pIdx} className={`flex items-start gap-4 p-4 rounded-2xl transition-all border ${
                  isZen
                    ? (isWarm
                        ? 'bg-white/[0.04] border-amber-900/30 hover:bg-white/[0.08] text-amber-50'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-slate-100')
                    : 'hover:bg-white/50 border-transparent hover:border-outline-variant/30 text-on-surface'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isZen ? 'bg-accent-neon/20 text-accent-neon border border-accent-neon/30' : 'bg-primary/10 text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </div>
                  <span className={`leading-relaxed text-lg ${
                    isZen ? (isWarm ? 'text-amber-50 font-medium' : 'text-slate-100 font-medium') : 'text-on-surface'
                  }`}>{pt}</span>
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
    
    lessonScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    mainViewerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    
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
    refreshConceptPerformance();
  }, [refreshConceptPerformance]);

  // Global Keyboard shortcuts for Zen Mode and Graph Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        if (showGraphModal) {
          setShowGraphModal(false);
          e.preventDefault();
        } else if (isZenMode) {
          setIsZenMode(false);
          e.preventDefault();
        }
      } else if (!isInput && (e.key === 'z' || e.key === 'Z')) {
        setIsZenMode(prev => !prev);
        e.preventDefault();
      } else if (!isInput && isZenMode && parsedAiLesson?.blocks) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          if (safeBlockIndex < parsedAiLesson.blocks.length - 1) {
            handleAdaptiveNext();
            e.preventDefault();
          }
        } else if (e.key === 'ArrowLeft') {
          if (safeBlockIndex > 0) {
            setActiveBlockIndex(prev => Math.max(0, prev - 1));
            zenScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGraphModal, isZenMode, parsedAiLesson, safeBlockIndex]);

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
          <div ref={mainViewerRef} className="flex-1 flex flex-col min-h-[60vh] lg:min-h-0 lg:h-full lg:overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
              <button onClick={() => navigate('/my-learning')} className="flex items-center text-text-secondary hover:text-primary transition-colors font-bold text-sm">
                <span className="material-symbols-outlined mr-1">arrow_back</span> Back to My Learning
              </button>
              
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => setShowGraphModal(true)} 
                  className="flex items-center gap-1.5 text-on-surface hover:text-primary transition-all font-bold text-xs sm:text-sm bg-surface-container-highest/80 hover:bg-surface-container-highest px-3 py-1.5 rounded-xl border border-outline-variant/30 shadow-sm"
                  title="Interactive Neo4j Knowledge & Prerequisite Graph"
                >
                  <span className="material-symbols-outlined text-[18px] text-accent-neon">hub</span>
                  <span>Knowledge Graph</span>
                </button>

                {isAdaptiveMode && parsedAiLesson && (
                  <button 
                    onClick={() => setIsZenMode(true)} 
                    className="flex items-center gap-1.5 text-primary hover:text-primary/90 transition-all font-bold text-xs sm:text-sm bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-xl border border-primary/20 shadow-sm"
                    title="Distraction-Free Zen Focus Mode (Press Z)"
                  >
                    <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
                    <span>Zen Mode</span>
                    <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-white/70 dark:bg-black/30 rounded text-[10px] text-text-secondary border border-outline-variant/30 font-mono">Z</kbd>
                  </button>
                )}

                <button onClick={() => navigate(`/learn/${courseSlug}/progress`)} className="flex items-center text-primary hover:text-primary/80 transition-colors font-bold text-xs sm:text-sm bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 shadow-sm">
                  <span className="material-symbols-outlined mr-1 text-[18px]">insights</span> Mastery Dashboard
                </button>
              </div>
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
              <div className="flex-1 flex flex-col min-h-0 gap-6 mb-6">
                {/* 1. Personalized AI Lesson (On top, full visibility) */}
                <div className="flex-1 flex flex-col min-h-[520px] bg-white rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden">
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsZenMode(true)}
                              className="bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-outline-variant/30 text-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                              title="Enter Zen Focus Mode (Distraction-Free) [Z]"
                            >
                              <span className="material-symbols-outlined text-[16px]">center_focus_strong</span>
                              <span>Zen Mode</span>
                            </button>
                            <div className="bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/40 flex items-center gap-2 shadow-sm">
                              <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                              <span className="text-xs font-bold text-primary">{Math.max(1, Math.ceil(aiLessonsData[activeTopicId].content.split(' ').length / 200))} min read</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        ref={lessonScrollRef}
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
                                onClick={() => {
                                  setActiveBlockIndex(prev => Math.max(0, prev - 1));
                                  lessonScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                  mainViewerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
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
                        
                        {/* Visual Adaptive Journey Stepper & Real-Time Mastery Radar (Inside lesson scroll stream, below AI content) */}
                        <div className="max-w-4xl mx-auto mt-8 mb-4">
                          <AdaptiveJourneyStepper
                            stages={LEARNING_STAGES}
                            currentStageIndex={currentStageIndex}
                            highestCompletedIndex={highestCompletedStage}
                            currentLabel={stageCurrentLabel}
                            nextLabel={stageNextLabel}
                            proficiency={topicProficiency}
                            knowledgeScore={topicKnowledgeScore}
                            weakConcepts={weakConceptsList}
                            topicTitle={activeTopicObj?.topic_title}
                            isGeneratingAssessment={generatingTopicId === activeTopicId}
                            onStageClick={handleStageNavigation}
                            onAskTutor={(prompt) => {
                              setTutorQuery(prompt);
                              setTutorOpen(true);
                            }}
                            onStartAssessment={() => {
                              if (activeTopicId) handleStartTopicAssessment(activeTopicId);
                            }}
                          />
                        </div>

                        {(!parsedAiLesson || safeBlockIndex === parsedAiLesson.blocks.length - 1) && (
                          <div className="mt-12 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up">
                          <div className="flex gap-3">
                            <button 
                              onClick={() => {
                                setTutorQuery(`Could you explain "${activeTopicObj?.topic_title || 'this topic'}" in simpler terms with an everyday analogy?`);
                                setTutorOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-surface-container-highest transition-colors rounded-xl border border-outline-variant/30 text-sm font-bold text-text-secondary hover:text-primary shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[18px]">psychology_alt</span> Explain Simpler
                            </button>
                            <button 
                              onClick={() => {
                                if (activeTopicId) {
                                  handleStartTopicAssessment(activeTopicId);
                                }
                              }}
                              disabled={generatingTopicId === activeTopicId}
                              className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-surface-container-highest transition-colors rounded-xl border border-outline-variant/30 text-sm font-bold text-text-secondary hover:text-primary shadow-sm disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[18px]">quiz</span>
                              {generatingTopicId === activeTopicId ? 'Preparing Quiz...' : 'Test Me'}
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
        <div className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-surface shadow-2xl shadow-black/15 z-50 flex flex-col border-l border-outline-variant/30 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 bg-surface border-b border-outline-variant/30 text-text shrink-0">
            <div className="flex items-center gap-2.5 text-primary">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">support_agent</span>
              </div>
              <div>
                <h2 className="font-black tracking-wide text-base text-text leading-tight">MENTORA TUTOR</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-text-secondary font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Session Chat • {tutorMessages.length} {tutorMessages.length === 1 ? 'question' : 'questions'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {tutorMessages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTutorMessages([])}
                  className="px-2.5 py-1 text-xs text-text-secondary hover:text-red-500 rounded-lg hover:bg-surface-container-highest transition-colors font-semibold flex items-center gap-1"
                  title="Clear questions from this session"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
              <button 
                type="button"
                onClick={() => setTutorOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-text-secondary"
                title="Close Tutor"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
          
          {/* Content Area */}
          <div ref={tutorScrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-surface-container-lowest">
            {/* Context Badge */}
            <div className="bg-surface-container-highest/20 rounded-xl p-3 border border-outline-variant/20 shrink-0">
              <p className="text-[11px] text-text-secondary font-bold uppercase tracking-wider mb-0.5">Current Context</p>
              <p className="text-sm font-semibold text-primary line-clamp-1">
                {activeTopicId ? course?.topics.find((t: any) => (t.topic_id || t.topicId) === activeTopicId)?.topic_title : course?.title}
              </p>
            </div>

            {/* Empty State */}
            {tutorMessages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto opacity-75">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                </div>
                <h4 className="font-bold text-base text-primary mb-1">Ask Any Question</h4>
                <p className="text-xs text-text-secondary max-w-[260px] leading-relaxed">
                  Ask Mentora Tutor anything about this topic. All questions and answers will remain visible throughout this session.
                </p>
              </div>
            )}

            {/* Session Messages Thread */}
            {tutorMessages.map((msg, idx) => (
              <div key={msg.id || idx} className="flex flex-col gap-2 mb-2 animate-fade-in-up">
                {/* Student Query Bubble */}
                <div className="bg-primary text-white p-3.5 rounded-2xl rounded-tr-xs self-end max-w-[85%] shadow-sm">
                  <p className="text-sm font-medium leading-relaxed">{msg.query}</p>
                </div>

                {/* Loading state for this specific question */}
                {msg.loading && (
                  <div className="bg-white border border-outline-variant/30 p-4 rounded-2xl rounded-tl-xs self-start shadow-sm flex items-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-primary text-lg">progress_activity</span>
                    <span className="text-sm text-text-secondary font-medium animate-pulse">Analyzing course material...</span>
                  </div>
                )}

                {/* Error state */}
                {msg.error && (
                  <div className="bg-red-50 text-red-600 p-3.5 rounded-2xl rounded-tl-xs self-start text-sm border border-red-200 shadow-sm max-w-[90%]">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <span>Tutor Error</span>
                    </div>
                    <p className="text-xs leading-relaxed">{msg.error}</p>
                  </div>
                )}

                {/* Tutor Answer Card */}
                {msg.response && (
                  <div className="bg-white border border-outline-variant/30 p-4 rounded-2xl rounded-tl-xs self-start w-full shadow-sm flex flex-col gap-3">
                    <div className="prose prose-sm prose-primary max-w-none prose-p:leading-relaxed prose-p:mb-2 prose-strong:text-primary">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.response.answer}</ReactMarkdown>
                    </div>

                    {msg.response.keyPoints && msg.response.keyPoints.length > 0 && (
                      <div className="pt-3 border-t border-outline-variant/20">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">checklist</span> Key Points
                        </p>
                        <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1">
                          {msg.response.keyPoints.map((kp: string, i: number) => (
                            <li key={i}>{kp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.response.example && (
                      <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                        <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">lightbulb</span> Example
                        </p>
                        <p className="text-xs italic text-on-surface/90">{msg.response.example}</p>
                      </div>
                    )}

                    {msg.response.practicePrompt && (
                      <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">psychology</span> Practice Prompt
                        </p>
                        <p className="text-xs text-on-surface">{msg.response.practicePrompt}</p>
                      </div>
                    )}

                    {msg.response.sources && msg.response.sources.length > 0 && (
                      <div className="pt-3 border-t border-outline-variant/20">
                        <p className="text-xs font-bold text-text-secondary mb-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">menu_book</span> Sources
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.response.sources.map((s: any, i: number) => (
                            <span key={i} className="text-[10px] bg-surface-container-highest px-2 py-1 rounded-md text-text-secondary truncate max-w-full">
                              {s.resourceName} (p. {s.pageNumber})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1 pt-1 text-[10px] text-text-secondary/60">
                      <span className="material-symbols-outlined text-[12px]">info</span>
                      <span>Adapted to your proficiency and teaching preference</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={askTutor} className="p-4 bg-white border-t border-outline-variant/30 shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ask about this topic..."
                value={tutorQuery}
                onChange={(e) => setTutorQuery(e.target.value)}
                disabled={tutorLoading}
                className="w-full pl-4 pr-12 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-secondary/60"
              />
              <button 
                type="submit" 
                disabled={!tutorQuery.trim() || tutorLoading}
                className="absolute right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Neo4j Knowledge & Prerequisite Graph Modal */}
      {showGraphModal && course && user && (
        <PrerequisiteGraphModal
          courseId={course.course_id}
          studentId={user.user_id}
          activeTopicId={activeTopicId}
          token={token}
          onClose={() => setShowGraphModal(false)}
          onSelectTopic={handleSelectTopicFromGraph}
        />
      )}

      {/* Zen Focus Mode Immersive Overlay */}
      {isZenMode && parsedAiLesson && parsedAiLesson.blocks && (
        <div className={`fixed inset-0 z-50 flex flex-col overflow-hidden animate-fade-in ${
          zenTheme === 'midnight'
            ? 'bg-[#080c14] text-slate-100'
            : zenTheme === 'warm'
            ? 'bg-[#14100d] text-amber-50'
            : 'bg-[#0f172a] text-slate-100'
        }`}>
          {/* Subtle Ambient Background Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mt-20"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent-neon/10 rounded-full blur-3xl pointer-events-none -mb-20"></div>

          {/* Reading Progress Line */}
          <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent-neon transition-all duration-300"
              style={{ width: `${((safeBlockIndex + 1) / parsedAiLesson.blocks.length) * 100}%` }}
            />
          </div>

          {/* Floating Minimal Header Bar */}
          <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 backdrop-blur-md bg-black/30 z-40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-neon/20 text-accent-neon border border-accent-neon/30 flex items-center justify-center font-bold shadow-sm">
                <span className="material-symbols-outlined text-[20px]">self_improvement</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight text-white">{course?.title}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-xs text-slate-300">{activeTopicObj?.topic_title || activeTopicObj?.title}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Block {safeBlockIndex + 1} of {parsedAiLesson.blocks.length}</span>
                  <span>•</span>
                  <span className="uppercase tracking-wider font-bold text-accent-neon">{parsedAiLesson.blocks[safeBlockIndex]?.type || 'LESSON'}</span>
                </div>
              </div>
            </div>

            {/* Controls Right */}
            <div className="flex items-center gap-3">
              {/* Theme Picker */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 text-xs">
                <button
                  onClick={() => setZenTheme('midnight')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${zenTheme === 'midnight' ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  Midnight
                </button>
                <button
                  onClick={() => setZenTheme('slate')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${zenTheme === 'slate' ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  Slate
                </button>
                <button
                  onClick={() => setZenTheme('warm')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${zenTheme === 'warm' ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:text-white'}`}
                >
                  Warm
                </button>
              </div>

              {/* Knowledge Graph Button */}
              <button
                onClick={() => setShowGraphModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-accent-neon">hub</span>
                <span className="hidden sm:inline">Knowledge Graph</span>
              </button>

              {/* Exit Zen Button */}
              <button
                onClick={() => setIsZenMode(false)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                <span>Exit Zen</span>
                <kbd className="hidden sm:inline-block px-1 py-0.2 bg-black/40 rounded text-[9px] text-rose-200 font-mono">Esc</kbd>
              </button>
            </div>
          </header>

          {/* Reading Canvas */}
          <div 
            ref={zenScrollRef}
            className="flex-1 overflow-y-auto custom-scrollbar px-4 py-8 sm:py-12"
          >
            <div className="max-w-3xl mx-auto pb-24">
              {parsedAiLesson.blocks[safeBlockIndex]?.subTopicTitle && (
                <div className="mb-6 inline-flex items-center gap-2 bg-accent-neon/15 text-accent-neon px-3.5 py-1.5 rounded-xl border border-accent-neon/30 text-xs font-bold shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">account_tree</span>
                  <span>{parsedAiLesson.blocks[safeBlockIndex].subTopicTitle}</span>
                </div>
              )}

              {/* The rendered lesson block */}
              <div className="zen-content-wrapper">
                {renderBlock(parsedAiLesson.blocks[safeBlockIndex], safeBlockIndex, true)}
              </div>
            </div>
          </div>

          {/* Floating Minimal Bottom Controls */}
          <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-2.5 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/15 shadow-2xl">
            <button
              onClick={() => {
                setActiveBlockIndex(prev => Math.max(0, prev - 1));
                zenScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={safeBlockIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-1 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Stepper Dots */}
            <div className="flex items-center gap-1.5 px-2">
              {parsedAiLesson.blocks.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveBlockIndex(idx);
                    zenScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`transition-all rounded-full ${
                    idx === safeBlockIndex
                      ? 'w-6 h-2 bg-accent-neon'
                      : idx < safeBlockIndex
                      ? 'w-2 h-2 bg-white/60 hover:bg-white'
                      : 'w-2 h-2 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Block ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                handleAdaptiveNext();
                zenScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={safeBlockIndex === parsedAiLesson.blocks.length - 1}
              className="px-4 py-1.5 rounded-xl bg-accent-neon hover:bg-accent-neon/90 disabled:opacity-30 disabled:pointer-events-none text-black text-xs font-extrabold flex items-center gap-1 transition-all shadow-md shadow-accent-neon/20 active:scale-95"
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>

            <span className="hidden md:inline-block text-[11px] text-white/40 pl-2 border-l border-white/15">
              [←/→] Navigate • [Esc] Exit
            </span>
          </footer>
        </div>
      )}

    </StudentLayout>
  );
}
