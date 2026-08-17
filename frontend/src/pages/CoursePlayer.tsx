import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import { useLearningProgress } from '../hooks/useLearningProgress';
import { useTopicAssessment } from '../hooks/useTopicAssessment';
import StudentLayout from '../components/layout/StudentLayout';
import AssessmentProfileViewer from '../components/assessments/AssessmentProfileViewer';
import CustomPdfViewer from '../components/CustomPdfViewer';

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

export default function CoursePlayer() {
  const user = useAuthUser();
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CoursePlayerContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);
  const [activeAssessmentId, setActiveAssessmentId] = useState<number | null>(null);
  
  // Assessments support
  const [assessments, setAssessments] = useState<any[]>([]);

  // Adaptive Learning Support
  const [isAdaptiveMode, setIsAdaptiveMode] = useState(false);
  const [adaptivePath, setAdaptivePath] = useState<any[] | null>(null);
  const [loadingAdaptive, setLoadingAdaptive] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const { progressId, startProgress, updateProgress, completeProgress, fetchResourceProgressForTopic } = useLearningProgress(token);
  const { generateTopicAssessment, isGenerating } = useTopicAssessment(token);
  const [resourceProgressMap, setResourceProgressMap] = useState<Record<number, number>>({});
  const [generatingTopicId, setGeneratingTopicId] = useState<number | null>(null);

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

  const handleRealtimeProgress = (resourceId: number, topicId: number, percent: number) => {
    setResourceProgressMap(prevMap => ({ ...prevMap, [resourceId]: percent }));
  };

  const getTopicProgress = (topic: any) => {
    if (!topic.resources || topic.resources.length === 0) return 0;
    const total = topic.resources.reduce((sum: number, r: any) => sum + (resourceProgressMap[r.resource_id] || 0), 0);
    return Math.round(total / topic.resources.length);
  };

  const getCourseProgress = () => {
    if (!course?.topics && assessments.length === 0) return 0;
    
    let totalItems = assessments.length;
    let totalProgress = 0;
    
    assessments.forEach(a => {
      const isCompleted = a.attempts?.some((attempt: any) => attempt.status === 'SUBMITTED');
      if (isCompleted) {
        totalProgress += 100;
      }
    });

    course?.topics?.forEach((t: any) => {
       if (t.resources) {
          totalItems += t.resources.length;
          t.resources.forEach((r: any) => {
             totalProgress += (resourceProgressMap[r.resource_id] || 0);
          });
       }
    });
    
    if (totalItems === 0) return 0;
    return Math.round(totalProgress / totalItems);
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
          const firstTopic = data.topics[0];
          setActiveTopicId(firstTopic.topic_id);
          if (firstTopic.resources && firstTopic.resources.length > 0) {
            setActiveResource(firstTopic.resources[0]);
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

  useEffect(() => {
    const fetchAdaptivePath = async () => {
      if (!course || adaptivePath) return;
      setLoadingAdaptive(true);
      try {
        const res = await fetch(`${API_URL}/adaptive-learning/students/${user?.user_id}/courses/${course.course_id}/path`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to generate learning path');
        const data = await res.json();
        setAdaptivePath(data.recommendedTopics || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAdaptive(false);
      }
    };

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
      navigate(`/assessments/${assessment.assessment_id}/take`);
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
        <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 -mx-4 md:mx-0 px-4 md:px-0 pb-6 overflow-hidden">
          {/* Main Viewer Area */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
            <button onClick={() => navigate('/my-learning')} className="flex items-center text-text-secondary hover:text-primary mb-4 transition-colors font-bold text-sm shrink-0">
              <span className="material-symbols-outlined mr-1">arrow_back</span> Back to My Learning
            </button>
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
          <div className="lg:w-96 shrink-0 h-full flex flex-col bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-lg shadow-black/5">
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
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-1 ${isAdaptiveMode ? 'bg-accent-neon text-white' : 'bg-white text-text-secondary hover:bg-surface-container-lowest border border-outline-variant/30'}`}
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
              ) : (isAdaptiveMode ? (adaptivePath || []) : course.topics).length === 0 ? (
                <div className="p-6 text-center text-text-secondary text-sm">
                  {isAdaptiveMode ? 'You have mastered all topics!' : 'No content available for this course yet.'}
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/30">
                  {(isAdaptiveMode ? (adaptivePath || []) : course.topics).map((topic, index) => (
                    <div key={topic.topic_id || topic.topicId} className="bg-white">
                      <button 
                        onClick={() => setActiveTopicId(activeTopicId === (topic.topic_id || topic.topicId) ? null : (topic.topic_id || topic.topicId))}
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
                          {!topic.resources || topic.resources.length === 0 ? (
                            <div className="text-xs text-text-secondary p-2 italic pl-10">No resources available</div>
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
                          
                          {/* Topic Assessment Button */}
                          {isAdaptiveMode && getTopicProgress(topic) === 100 && (
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
    </StudentLayout>
  );
}
