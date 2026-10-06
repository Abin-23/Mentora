import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import StudentLayout from '../components/layout/StudentLayout';

export default function StudentDashboardPage() {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const user = useAuthUser();
  const token = localStorage.getItem('access_token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [claimingCert, setClaimingCert] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user || !courseSlug || !token) return;
      try {
        // Fetch course details to get courseId
        const courseRes = await fetch(`${API_URL}/courses/${courseSlug}/player`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!courseRes.ok) throw new Error('Course not found or access denied');
        const courseData = await courseRes.json();
        setCourse(courseData);

        const res = await fetch(`${API_URL}/adaptive-learning/students/${user.user_id}/courses/${courseData.course_id}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load dashboard data');
        const data = await res.json();
        setDashboard(data);

        const goalsRes = await fetch(`${API_URL}/adaptive-learning/students/${user.user_id}/courses/${courseData.course_id}/goals`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (goalsRes.ok) {
          setGoals(await goalsRes.json());
        }

        try {
          const certsRes = await fetch(`${API_URL}/certificates/my-certificates`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (certsRes.ok) {
            const certs = await certsRes.json();
            const courseCert = certs.find((c: any) => c.course_id === courseData.course_id);
            if (courseCert) {
              setCertificateData({ issued: true, certificate: courseCert });
            } else {
              const eligRes = await fetch(`${API_URL}/certificates/eligibility/${courseData.course_id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (eligRes.ok) {
                const eligData = await eligRes.json();
                setCertificateData({ issued: false, eligible: eligData.eligible });
              }
            }
          }
        } catch (e) {
          console.error('Failed to load certificate data', e);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user, courseSlug, token, API_URL]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !user) return;
    setCreatingGoal(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const goalType = formData.get('goal_type');
      let targetValue = parseInt(formData.get('target_value') as string);
      let targetTopicId = formData.get('target_topic_id') ? parseInt(formData.get('target_topic_id') as string) : null;
      let targetProf = formData.get('target_proficiency') || null;

      const res = await fetch(`${API_URL}/adaptive-learning/students/${user.user_id}/courses/${course.course_id}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          goal_type: goalType,
          target_value: isNaN(targetValue) ? null : targetValue,
          target_topic_id: targetTopicId,
          target_proficiency: targetProf
        })
      });
      if (!res.ok) throw new Error('Failed to create goal');
      
      const goalsRes = await fetch(`${API_URL}/adaptive-learning/students/${user.user_id}/courses/${course.course_id}/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (goalsRes.ok) setGoals(await goalsRes.json());
      
      setShowGoalModal(false);
    } catch(err: any) {
      alert(err.message);
    } finally {
      setCreatingGoal(false);
    }
  };

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

  if (!user) return null;

  if (loading) {
    return (
      <StudentLayout user={user}>
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
             <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
             <p className="text-text-secondary font-medium">Loading your intelligence dashboard...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <StudentLayout user={user}>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-error bg-error/10 p-6 rounded-2xl max-w-lg w-full">
            <h2 className="flex items-center gap-2 font-bold text-lg mb-2">
              <span className="material-symbols-outlined">warning</span> Dashboard Unavailable
            </h2>
            <p>{error || 'An unexpected error occurred.'}</p>
            <button 
              onClick={() => navigate(`/learn/${courseSlug}`)} 
              className="mt-6 bg-white/50 px-4 py-2 rounded-xl font-bold hover:bg-white/80 transition-colors"
            >
              Back to Course
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
      <StudentLayout user={user}>
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button 
              onClick={() => navigate(`/learn/${courseSlug}`)}
              className="flex items-center text-text-secondary hover:text-primary transition-colors font-bold text-sm mb-4"
            >
              <span className="material-symbols-outlined mr-1">arrow_back</span> Back to Course
            </button>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Intelligence Dashboard
            </h1>
            <p className="text-text-secondary text-lg mt-1 font-medium">{course?.title}</p>
          </div>
          
          {/* Certificate Banner (Desktop) */}
          {certificateData?.issued ? (
            <div className="hidden md:flex items-center gap-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-4 shrink-0">
               <div>
                 <div className="font-bold text-green-700 flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">workspace_premium</span> Certified</div>
               </div>
               <button onClick={() => navigate(`/certificate/${certificateData.certificate.credential_id}`)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-green-700 transition-colors">
                 View Certificate
               </button>
            </div>
          ) : certificateData?.eligible ? (
            <div className="hidden md:flex items-center gap-4 bg-gradient-to-r from-primary/10 to-accent-neon/10 border border-primary/20 rounded-2xl p-4 shrink-0">
               <div>
                 <div className="font-bold text-primary flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">workspace_premium</span> Eligible</div>
               </div>
               <button onClick={handleClaimCertificate} disabled={claimingCert} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                 {claimingCert ? 'Claiming...' : 'Claim Certificate'}
               </button>
            </div>
          ) : null}

          
          {/* Progress Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-6">
            <div className="flex flex-col">
               <span className="text-xs uppercase tracking-wider text-text-secondary font-bold">Course Progress</span>
               <span className="text-2xl font-black text-text-primary">{dashboard.courseProgress.progressPercentage}%</span>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-surface-container-highest flex items-center justify-center relative overflow-hidden">
               <div 
                 className="absolute bottom-0 w-full bg-primary transition-all duration-1000" 
                 style={{ height: `${dashboard.courseProgress.progressPercentage}%` }}
               />
               <span className="relative z-10 material-symbols-outlined font-bold text-text-secondary mix-blend-difference text-white">flag</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Learning Goals */}
            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">flag</span> Learning Goals
                </h2>
                <button 
                  onClick={() => setShowGoalModal(true)}
                  className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl text-sm hover:bg-primary/20 transition-colors"
                >
                  + Add Goal
                </button>
              </div>

              {goals.length === 0 ? (
                <div className="bg-surface p-6 rounded-xl text-center text-text-secondary italic">
                  Set a learning goal to track your progress directly.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map((goal: any) => (
                    <div key={goal.goal_id} className="border border-outline-variant/30 rounded-xl p-4 flex flex-col relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-2 z-10">
                        <div className="pr-4">
                          <h3 className="font-bold text-sm text-text-secondary uppercase tracking-wider mb-1">
                            {goal.goal_type.replace(/_/g, ' ')}
                          </h3>
                          <p className="font-bold text-text-primary">
                            {goal.target_topic ? goal.target_topic.topic_title : course?.title}
                          </p>
                        </div>
                        {goal.isCompleted && (
                           <span className="material-symbols-outlined text-green-500 font-bold shrink-0">check_circle</span>
                        )}
                      </div>
                      <div className="mt-auto pt-4 z-10">
                        <div className="flex justify-between text-sm mb-1 font-bold">
                           <span className={goal.isCompleted ? 'text-green-600' : 'text-primary'}>
                             {goal.isCompleted ? 'Completed' : 'In Progress'}
                           </span>
                           <span>{goal.progressMessage}</span>
                        </div>
                        <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                           <div className={`h-full ${goal.isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${goal.progressPercentage}%` }} />
                        </div>
                      </div>
                      {goal.isCompleted && (
                        <div className="absolute inset-0 bg-green-50/50 pointer-events-none" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Topic Mastery */}
            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span> Topic Mastery
              </h2>
              {dashboard.topicMastery.length === 0 ? (
                <div className="bg-surface p-6 rounded-xl text-center text-text-secondary italic">
                  Complete topic assessments to build your mastery graph.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboard.topicMastery.map((topic: any) => (
                    <div key={topic.topic_id} className="border border-outline-variant/30 rounded-xl p-4 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold line-clamp-2 pr-2">{topic.title}</h3>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                          topic.proficiency === 'ADVANCED' ? 'bg-purple-100 text-purple-700' :
                          topic.proficiency === 'PROFICIENT' ? 'bg-green-100 text-green-700' :
                          topic.proficiency === 'DEVELOPING' ? 'bg-orange-100 text-orange-700' :
                          topic.proficiency === 'BEGINNER' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {topic.proficiency}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary mt-4">
                         {topic.score !== null ? (
                           <span className="flex items-center gap-1 font-bold">
                             <span className="material-symbols-outlined text-sm">score</span> {topic.score}%
                           </span>
                         ) : null}
                         <span className="flex items-center gap-1">
                           <span className="material-symbols-outlined text-sm">history</span> {topic.attemptCount} attempts
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Assessment Performance */}
            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">trending_up</span> Assessment Performance
              </h2>
              {dashboard.assessmentHistory.length === 0 ? (
                <div className="bg-surface p-6 rounded-xl text-center text-text-secondary italic">
                  Take your first assessment to see performance trends.
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.assessmentHistory.slice().reverse().slice(0, 5).map((attempt: any, idx: number) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 gap-4">
                      <div>
                        <h4 className="font-bold">{attempt.title}</h4>
                        <div className="text-sm text-text-secondary flex items-center gap-2 mt-1">
                          <span className="material-symbols-outlined text-[16px]">calendar_today</span> 
                          {new Date(attempt.date).toLocaleDateString()}
                        </div>
                      </div>
                      {attempt.score !== null && (
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-surface rounded-full overflow-hidden">
                             <div className="h-full bg-secondary" style={{ width: `${attempt.score}%` }} />
                          </div>
                          <span className="font-black w-10 text-right">{attempt.score}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Knowledge Growth */}
            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">monitoring</span> Knowledge Growth
              </h2>
              {dashboard.knowledgeGrowth.length === 0 ? (
                <div className="bg-surface p-6 rounded-xl text-center text-text-secondary italic">
                  Complete multiple assessments to track your knowledge growth over time.
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.knowledgeGrowth.slice().reverse().slice(0, 5).map((growth: any, idx: number) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-text-secondary">Topic Mastery Level</h4>
                        <p className="font-bold text-lg mt-1">{growth.topic}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                           <div className="text-xs text-text-secondary mb-1">{new Date(growth.date).toLocaleDateString()}</div>
                           <div className="font-black text-xl text-primary">{growth.score}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            
            {/* Next Recommendation */}
            <section className="bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg p-1 text-white">
              <div className="bg-surface-container-lowest/10 backdrop-blur-md rounded-xl p-6 h-full flex flex-col">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white/80 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">explore</span> Next Recommended
                </h2>
                {dashboard.currentRecommendation ? (
                  <div className="flex-1">
                    <h3 className="text-xl font-black mb-3">{dashboard.currentRecommendation.title}</h3>
                    {dashboard.currentRecommendation.insight ? (
                      <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-2 text-white/90">
                          <span className="material-symbols-outlined text-sm">
                            {dashboard.currentRecommendation.insight.type === 'PREREQUISITE' ? 'account_tree' : 
                             dashboard.currentRecommendation.insight.type === 'NEEDS_PRACTICE' ? 'model_training' : 'new_releases'}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider">{dashboard.currentRecommendation.insight.type.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed">
                          {dashboard.currentRecommendation.insight.message}
                        </p>
                      </div>
                    ) : (
                      <p className="text-white/90 text-sm leading-relaxed bg-black/20 p-4 rounded-xl">
                        {dashboard.currentRecommendation.extendedReason || dashboard.currentRecommendation.reason}
                      </p>
                    )}
                    <button 
                      onClick={() => navigate(`/learn/${courseSlug}`)}
                      className="mt-6 w-full py-3 bg-white text-primary font-bold rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      Start Learning
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                    <span className="material-symbols-outlined text-4xl mb-2 text-white/50">task_alt</span>
                    <p className="font-medium text-white/90">You have completely mastered all currently available topics in this course.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Strengths & Weaknesses */}
            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
              <h2 className="text-lg font-bold mb-4">Focus Areas</h2>
              
              <div className="mb-6">
                <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span> Strengths
                </h3>
                {dashboard.strengths.length === 0 ? (
                  <p className="text-sm text-text-secondary italic">Keep learning to build strengths.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {dashboard.strengths.map((s: any, idx: number) => (
                      <li key={idx} className="text-xs font-bold px-3 py-1.5 bg-green-50 text-green-800 rounded-lg border border-green-200">
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-orange-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">target</span> Needs Review
                </h3>
                {dashboard.areasToImprove.length === 0 ? (
                  <p className="text-sm text-text-secondary italic">No critical weak spots detected.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {dashboard.areasToImprove.map((w: any, idx: number) => (
                      <li key={idx} className="text-xs font-bold px-3 py-2 bg-orange-50 text-orange-800 rounded-lg border border-orange-200 flex justify-between items-center gap-2">
                        <span className="truncate">{w.name}</span>
                        <span className="shrink-0 uppercase opacity-70 text-[10px]">{w.proficiency}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Recent Learning Insights */}
            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">lightbulb</span> Recent Insights
              </h2>
              {(!dashboard.recentInsights || dashboard.recentInsights.length === 0) ? (
                <p className="text-sm text-text-secondary italic text-center py-4">Keep learning to generate insights.</p>
              ) : (
                <div className="space-y-3">
                  {dashboard.recentInsights.map((insight: any, idx: number) => (
                    <div key={idx} className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                         <span className={`material-symbols-outlined text-[16px] ${
                           insight.type === 'PROFICIENCY_IMPROVED' ? 'text-green-600' :
                           insight.type === 'PROFICIENCY_DECLINED' ? 'text-orange-600' :
                           'text-primary'
                         }`}>
                           {insight.type === 'PROFICIENCY_IMPROVED' ? 'trending_up' : 
                            insight.type === 'PROFICIENCY_DECLINED' ? 'trending_down' : 'tips_and_updates'}
                         </span>
                         <span className="font-bold text-xs uppercase tracking-wider text-text-secondary">
                           {insight.type.replace(/_/g, ' ')}
                         </span>
                      </div>
                      <p className="text-text-primary leading-relaxed pl-6">{insight.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Learning Activity */}
            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bolt</span> Recent Activity
              </h2>
              {dashboard.learningActivity.length === 0 ? (
                <p className="text-sm text-text-secondary italic text-center py-4">No recent activity.</p>
              ) : (
                <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                  {dashboard.learningActivity.slice(0, 10).map((activity: any, idx: number) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-primary/40 shrink-0" />
                      <div>
                        <p className="font-medium capitalize text-text-primary">{activity.description.toLowerCase()}</p>
                        <p className="text-xs text-text-secondary">{new Date(activity.date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </main>

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="text-xl font-bold">Create Learning Goal</h3>
              <button onClick={() => setShowGoalModal(false)} className="text-text-secondary hover:text-text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateGoal} className="p-6 flex flex-col gap-4">
              
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Goal Type</label>
                <select name="goal_type" required className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:outline-none focus:border-primary">
                  <option value="COMPLETE_COURSE">Complete Course</option>
                  <option value="MASTER_TOPICS">Master Topics (Count)</option>
                  <option value="IMPROVE_TOPIC">Improve Topic Proficiency</option>
                  <option value="COMPLETE_ASSESSMENTS">Complete Assessments (Count)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Target Value (if applicable)</label>
                <input type="number" name="target_value" min="1" placeholder="e.g. 3" className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:outline-none focus:border-primary" />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Target Topic (if applicable)</label>
                <select name="target_topic_id" className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:outline-none focus:border-primary">
                  <option value="">-- Select Topic --</option>
                  {dashboard.topicMastery.map((t: any) => (
                    <option key={t.topic_id} value={t.topic_id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-1">Target Proficiency (if applicable)</label>
                <select name="target_proficiency" className="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:outline-none focus:border-primary">
                  <option value="">-- Select Target --</option>
                  <option value="PROFICIENT">PROFICIENT</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowGoalModal(false)} className="px-4 py-2 font-bold text-text-secondary hover:bg-surface rounded-xl">Cancel</button>
                <button type="submit" disabled={creatingGoal} className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 disabled:opacity-50">
                  {creatingGoal ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </StudentLayout>
  );
}
