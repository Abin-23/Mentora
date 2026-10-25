import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../components/layout/StudentLayout';
import BentoCard from '../components/ui/BentoCard';
import { useAuthUser } from '../hooks/useAuthUser';

export default function Dashboard() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (user && (user.role === 'SystemAdmin' || user.role === 'CourseAdmin')) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        if (!token) return;
        setLoading(true);

        // Fetch enrollments
        const enrRes = await fetch(`${API_URL}/enrollments/my-learning`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let enrData: any[] = [];
        if (enrRes.ok) {
          enrData = await enrRes.json();
          setEnrollments(enrData);
        }

        // Fetch certificates
        try {
          const certRes = await fetch(`${API_URL}/certificates/my-certificates`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (certRes.ok) {
            const certData = await certRes.json();
            setCertificates(certData);
          }
        } catch (err) {
          console.error('Failed to load certificates:', err);
        }

        // Fetch assessments for enrolled courses
        if (enrData.length > 0) {
          let allAssessments: any[] = [];
          for (const enr of enrData) {
            try {
              const asmRes = await fetch(`${API_URL}/assessments/course/${enr.course.course_id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (asmRes.ok) {
                const asmData = await asmRes.json();
                const mapped = asmData.map((a: any) => ({ ...a, course: enr.course }));
                allAssessments = [...allAssessments, ...mapped];
              }
            } catch (err) {
              console.error(`Failed to load assessments for course ${enr.course.course_id}:`, err);
            }
          }
          setAssessments(allAssessments);
        }
      } catch (e) {
        console.error('Dashboard data fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, navigate, API_URL, token]);

  if (!user || user.role === 'SystemAdmin' || user.role === 'CourseAdmin') return null;

  // Calculate dynamic data
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.enrollment_status === 'COMPLETED').length;
  const completionPercentage = totalCourses === 0 ? 0 : Math.round((completedCourses / totalCourses) * 100);
  const strokeDashoffset = 251.2 * (1 - completionPercentage / 100);
  
  const activeCourses = enrollments.filter(e => e.enrollment_status === 'ACTIVE').length;
  const latestEnrollment = enrollments[0];
  const latestCourseTitle = latestEnrollment?.course?.title || 'your enrolled courses';
  const latestCourseCategory = latestEnrollment?.course?.category?.category_name || 'various topics';
  const pendingAssessments = assessments.filter(a => !a.attempts?.some((att: any) => att.status === 'SUBMITTED'));

  if (loading) {
    return (
      <StudentLayout user={user}>
        <div className="py-24 flex flex-col items-center justify-center text-text-secondary gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
          <p className="font-label-mono text-xs uppercase tracking-widest">Loading Learning Ecosystem...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout user={user}>
      {/* Welcome Section */}
      <section className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="font-display-xl text-4xl md:text-5xl tracking-tight mb-2 text-primary font-bold">
            Welcome back, {user.full_name?.split(' ')[0] || user.email.split('@')[0]}.
          </h1>
          <p className="font-body-md text-text-secondary">
            Your adaptive learning ecosystem is ready. You have <strong className="text-primary">{pendingAssessments.length} pending assessment{pendingAssessments.length !== 1 ? 's' : ''}</strong> and <strong className="text-primary">{certificates.length} earned certificate{certificates.length !== 1 ? 's' : ''}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {latestEnrollment ? (
            <button 
              onClick={() => navigate(`/learn/${latestEnrollment.course.slug}`)} 
              className="bg-primary text-on-primary font-label-mono text-label-mono px-6 py-3 rounded-full hover:scale-95 transition-transform flex items-center gap-2 cursor-pointer shadow-lg text-xs font-bold"
            >
              Resume Course <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            </button>
          ) : (
            <button 
              onClick={() => navigate('/courses')} 
              className="bg-primary text-on-primary font-label-mono text-label-mono px-6 py-3 rounded-full hover:scale-95 transition-transform flex items-center gap-2 cursor-pointer shadow-lg text-xs font-bold"
            >
              Browse Catalog <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          )}
        </div>
      </section>

      {/* Bento Grid Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px] mb-10">
        
        {/* AI Mentor Insights - Large Lavender Card */}
        <BentoCard colSpanClass="md:col-span-8" bgColorClass="bg-card-lavender" className="relative overflow-hidden group">
          <div className="flex justify-between items-start z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/50 backdrop-blur flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <span className="font-label-mono text-[11px] uppercase tracking-widest bg-white/40 px-3 py-1 rounded-full border border-black/5 font-bold">
                Adaptive AI Tutor
              </span>
            </div>
            {latestEnrollment && (
              <span className="font-label-mono text-[10px] uppercase tracking-wider text-primary/70 font-bold hidden sm:inline-block">
                {latestCourseCategory}
              </span>
            )}
          </div>
          
          <div className="z-10 max-w-xl mt-auto">
            <h3 className="font-headline-md text-2xl font-bold mb-2 line-clamp-1 truncate text-primary">
              {enrollments.length > 0 ? `Mastering ${latestCourseTitle}` : "Start your learning journey!"}
            </h3>
            <p className="font-body-md opacity-85 leading-relaxed text-sm">
              {enrollments.length > 0 
                ? `Your RAG mentor has indexed your course resources and slides. Ask questions, get interactive hints, or test your topic knowledge.`
                : "Explore our rich catalog and enroll in your first course to activate your personalized AI tutor."}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button 
                onClick={() => navigate('/ai-mentor')} 
                className="bg-primary text-white font-label-mono text-xs font-bold px-4 py-2 rounded-full hover:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Ask AI Tutor</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
              {latestEnrollment && (
                <button 
                  onClick={() => navigate(`/learn/${latestEnrollment.course.slug}/progress`)}
                  className="bg-white/60 hover:bg-white text-primary font-label-mono text-xs font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-1 cursor-pointer border border-black/5"
                >
                  <span>Intelligence Dashboard</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Decorative background shape */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
        </BentoCard>

        {/* Current Active Courses - Mint Card */}
        <BentoCard colSpanClass="md:col-span-4" bgColorClass="bg-card-mint" className="group">
          <div className="flex justify-between items-center">
            <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary/70 font-bold">Enrolled Courses</span>
            <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[18px]">school</span>
            </div>
          </div>
          <div className="text-center mt-auto">
            <div className="font-display-xl text-6xl text-primary mb-1 tracking-tighter font-bold">{activeCourses}</div>
            <p className="font-label-mono text-[11px] text-primary/80 font-bold tracking-wider uppercase">
              {activeCourses === 1 ? 'Active Course' : 'Active Courses'}
            </p>
          </div>
          <div className="flex gap-1.5 justify-center mt-4">
            {[...Array(Math.max(4, totalCourses))].map((_, i) => (
              <div 
                key={i} 
                className={`w-7 h-2 rounded-full transition-colors ${i < activeCourses ? 'bg-primary' : 'bg-primary/15'}`}
              />
            ))}
          </div>
          <button 
            onClick={() => navigate('/my-learning')} 
            className="mt-3 text-center text-xs font-label-mono font-bold text-primary hover:underline"
          >
            View All ({totalCourses})
          </button>
        </BentoCard>

        {/* Progress Chart - Coral Card */}
        <BentoCard colSpanClass="md:col-span-4" bgColorClass="bg-card-coral">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]">donut_large</span>
              </div>
              <span className="font-label-mono text-[11px] uppercase tracking-widest font-bold">Completion</span>
            </div>
            <span className="font-label-mono text-[10px] text-primary/70 font-bold">
              {completedCourses}/{totalCourses} Done
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="10" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke="#1c1917" 
                  strokeWidth="10" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-out" 
                />
              </svg>
              <span className="absolute font-display-xl text-2xl font-bold">{completionPercentage}%</span>
            </div>
            <p className="font-label-mono text-[11px] text-primary/80 mt-2 font-medium">Curriculum Progress</p>
          </div>
        </BentoCard>

        {/* Certificates Card - Warm White Card */}
        <BentoCard 
          colSpanClass="md:col-span-4" 
          bgColorClass="bg-white" 
          className="border border-black/5 hover:border-amber-400/50 transition-all cursor-pointer group"
          onClick={() => navigate('/my-learning?tab=certificates')}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-amber-700 text-[18px]">workspace_premium</span>
              </div>
              <span className="font-label-mono text-[11px] uppercase tracking-widest text-text-secondary font-bold">Certifications</span>
            </div>
            <span className="font-label-mono text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
              Verified
            </span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center text-center mt-2">
            <div className="font-display-xl text-5xl font-bold text-primary mb-1">
              {certificates.length}
            </div>
            <p className="text-xs text-text-secondary font-medium">
              {certificates.length === 1 ? 'Credential Earned' : 'Credentials Earned'}
            </p>
          </div>

          <div className="mt-auto pt-3 border-t border-black/5 flex items-center justify-between">
            <span className="text-[11px] text-text-secondary truncate max-w-[150px]">
              {certificates.length > 0 ? (
                certificates.length === 1 ? certificates[0].course.title : `${certificates.length} Certificates Available`
              ) : 'Finish all topics'}
            </span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/my-learning?tab=certificates');
              }}
              className="text-xs font-bold text-primary group-hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{certificates.length > 0 ? 'View All' : 'Eligibility'}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </BentoCard>

        {/* Assessment Status Card - Soft Cyan/Mint Card */}
        <BentoCard colSpanClass="md:col-span-4" bgColorClass="bg-card-mint">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]">quiz</span>
              </div>
              <span className="font-label-mono text-[11px] uppercase tracking-widest font-bold">Assessments</span>
            </div>
            <span className={`font-label-mono text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
              pendingAssessments.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-primary/10 text-primary'
            }`}>
              {pendingAssessments.length === 0 ? 'All Clear' : `${pendingAssessments.length} Due`}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center mt-2">
            <div className="font-display-xl text-5xl font-bold text-primary mb-1">
              {pendingAssessments.length}
            </div>
            <p className="text-xs text-primary/80 font-medium">
              {pendingAssessments.length === 0 ? 'Everything submitted' : 'Pending Quizzes & Tests'}
            </p>
          </div>

          <div className="mt-auto pt-3 border-t border-black/5 flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">
              {assessments.length} total quizzes
            </span>
            <button 
              onClick={() => {
                const el = document.getElementById('pending-assessments-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View Tasks</span>
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
            </button>
          </div>
        </BentoCard>

      </section>

      {/* Continue Learning Featured Course Banner */}
      {latestEnrollment && (
        <section className="mb-12">
          <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-6 md:p-8 border border-black/5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                <span className="material-symbols-outlined text-3xl">play_circle</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-label-mono text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    Active Learning
                  </span>
                  <span className="font-label-mono text-xs text-text-secondary">
                    {latestEnrollment.course.category?.category_name || 'Technical'}
                  </span>
                </div>
                <h3 className="font-headline-md text-xl md:text-2xl font-bold text-primary">
                  {latestEnrollment.course.title}
                </h3>
                <p className="text-xs text-text-secondary mt-1 line-clamp-1 max-w-xl">
                  {latestEnrollment.course.short_description || 'Pick up where you left off with adaptive lessons and interactive exercises.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
              <button 
                onClick={() => navigate(`/learn/${latestEnrollment.course.slug}/progress`)}
                className="flex-1 lg:flex-none px-5 py-3 rounded-full border border-black/10 text-primary font-bold text-xs hover:bg-black/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">insights</span>
                Mastery Dashboard
              </button>
              <button 
                onClick={() => navigate(`/learn/${latestEnrollment.course.slug}`)}
                className="flex-1 lg:flex-none px-6 py-3 rounded-full bg-primary text-white font-bold text-xs hover:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Continue Course</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Pending Assessments Section */}
      <section id="pending-assessments-section" className="w-full mb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline-md text-2xl font-bold flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-primary">pending_actions</span> 
            Pending Assessments
          </h3>
          {pendingAssessments.length > 0 && (
            <span className="font-label-mono text-xs text-text-secondary">
              {pendingAssessments.length} assessment{pendingAssessments.length !== 1 ? 's' : ''} to take
            </span>
          )}
        </div>
        
        {pendingAssessments.length === 0 ? (
          <div className="text-center py-16 bg-white/50 border border-dashed border-outline-variant/50 rounded-[32px] flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
              <span className="material-symbols-outlined text-3xl">task_alt</span>
            </div>
            <h4 className="font-headline-md text-xl font-bold">You're all caught up!</h4>
            <p className="font-body-md text-text-secondary text-sm max-w-md">
              No assessments are currently pending. Great job staying on top of your learning material.
            </p>
            <button 
              onClick={() => navigate('/courses')} 
              className="mt-2 text-primary font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer"
            >
              Browse more courses <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingAssessments.map((a, index) => {
              const colors = ['bg-card-lavender', 'bg-card-mint', 'bg-card-coral'];
              const bgColor = colors[index % colors.length];
              
              return (
                <div key={a.assessment_id} className={`bento-card ${bgColor} rounded-[32px] p-8 flex flex-col hover:shadow-xl transition-all duration-400 border border-black/5 relative overflow-hidden group shadow-sm`}>
                  {/* Decorative Background Element */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="flex-1 z-10 relative">
                    <div className="flex justify-between items-start mb-6">
                      <span className="font-label-mono text-[10px] uppercase font-bold tracking-widest border border-black/10 text-primary px-3 py-1 rounded-full bg-white/40 backdrop-blur-md">
                        {a.assessment_type}
                      </span>
                      <div className="flex items-center gap-1 font-label-mono bg-white/40 border border-black/5 px-2 py-1 rounded-full text-text-secondary backdrop-blur-md">
                        <span className="material-symbols-outlined text-[14px]">help</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{a.total_questions} Qs</span>
                      </div>
                    </div>
                    
                    <h4 className="font-headline-md text-2xl mb-3 text-primary leading-tight line-clamp-2">{a.title}</h4>
                    <div className="flex items-center gap-2 font-label-mono text-xs text-text-secondary mb-6">
                      <span className="material-symbols-outlined text-[16px] text-primary/60">menu_book</span>
                      <span className="line-clamp-1">{a.course?.title}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/assessments/${a.assessment_id}/take`)} 
                    className="z-10 mt-auto w-full bg-primary hover:bg-black text-white font-label-mono text-[12px] font-bold py-4 rounded-full transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    TAKE ASSESSMENT
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </StudentLayout>
  );
}
