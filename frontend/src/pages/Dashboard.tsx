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
        // Fetch enrollments
        const enrRes = await fetch(`${API_URL}/enrollments/my-learning`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (enrRes.ok) {
          const enrData = await enrRes.json();
          setEnrollments(enrData);
          
          // Fetch assessments for enrolled courses
          let allAssessments: any[] = [];
          for (const enr of enrData) {
            const asmRes = await fetch(`${API_URL}/assessments/course/${enr.course.course_id}`, {
               headers: { Authorization: `Bearer ${token}` }
            });
            if (asmRes.ok) {
               const asmData = await asmRes.json();
               // Map with course info
               const mapped = asmData.map((a: any) => ({ ...a, course: enr.course }));
               allAssessments = [...allAssessments, ...mapped];
            }
          }
          setAssessments(allAssessments);
        }
      } catch (e) {
        console.error(e);
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
  const latestCourseTitle = enrollments[0]?.course?.title || 'your courses';
  const latestCourseCategory = enrollments[0]?.course?.category?.category_name || 'various topics';
  const pendingAssessments = assessments.filter(a => !a.attempts?.some((att: any) => att.status === 'SUBMITTED'));

  return (
    <StudentLayout user={user}>
      {/* Welcome Section */}
      <section className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="font-display-xl text-5xl md:text-6xl tracking-tight mb-2">
            Welcome back.
          </h1>
          <p className="font-body-md text-text-secondary">
            Your personalized learning ecosystem is ready. You have <strong className="text-primary">{pendingAssessments.length} pending assessments</strong>.
          </p>
        </div>
        <button onClick={() => navigate('/my-learning')} className="bg-primary text-on-primary font-label-mono text-label-mono px-6 py-3 rounded-full hover:scale-95 transition-transform flex items-center gap-2 cursor-pointer shadow-lg">
          Resume Learning <span className="material-symbols-outlined text-[18px]">play_arrow</span>
        </button>
      </section>

      {/* Bento Grid Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px] mb-8">
        
        {/* AI Mentor Insights - Large Lavender Card */}
        <BentoCard colSpanClass="md:col-span-8" bgColorClass="bg-card-lavender" className="relative overflow-hidden group">
          <div className="flex justify-between items-start z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <span className="font-label-mono text-label-mono uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full border border-black/5">AI Insight</span>
            </div>
          </div>
          <div className="z-10 max-w-lg mt-auto">
            <h3 className="font-headline-md text-2xl mb-2 line-clamp-1 truncate">
              {enrollments.length > 0 ? `You're mastering ${latestCourseTitle}!` : "Start your learning journey!"}
            </h3>
            <p className="font-body-md opacity-80 leading-relaxed">
              {enrollments.length > 0 
                ? `Based on your recent progress in ${latestCourseCategory}, you are showing great retention. Keep it up and tackle your pending assessments!`
                : "Explore our catalog and enroll in courses to see personalized AI insights here."}
            </p>
          </div>
          
          {/* Decorative background shape */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        </BentoCard>

        {/* Current Streak - Mint Card */}
        <BentoCard colSpanClass="md:col-span-4" bgColorClass="bg-card-mint">
          <div className="flex justify-between items-center">
            <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary/60">Activity</span>
            <span className="material-symbols-outlined text-primary/40">school</span>
          </div>
          <div className="text-center mt-auto">
            <div className="font-display-xl text-7xl text-primary mb-1 tracking-tighter">{activeCourses}</div>
            <p className="font-label-mono text-label-mono text-primary/70">ACTIVE COURSES</p>
          </div>
          <div className="flex gap-1 justify-center mt-4">
            {[...Array(Math.max(5, totalCourses))].map((_, i) => (
              <div key={i} className={`w-8 h-2 rounded-full ${i < activeCourses ? 'bg-primary' : 'bg-primary/10'}`}></div>
            ))}
          </div>
        </BentoCard>

        {/* Progress Chart Placeholder - Coral Card */}
        <BentoCard colSpanClass="md:col-span-4" bgColorClass="bg-card-coral">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">donut_large</span>
            </div>
            <span className="font-label-mono text-label-mono uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Completion</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#000" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <span className="absolute font-display-xl text-3xl">{completionPercentage}%</span>
            </div>
          </div>
        </BentoCard>
      </section>

      {/* Pending Assessments Section (Outside the 240px restricted grid) */}
      {/* Pending Assessments Section */}
      <section className="w-full mb-12">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-md text-2xl flex items-center gap-2">
               <span className="material-symbols-outlined text-primary">pending_actions</span> Pending Assessments
            </h3>
         </div>
         
         {pendingAssessments.length === 0 ? (
            <div className="text-center py-16 bg-white/50 border border-dashed border-outline-variant/50 rounded-[32px] flex flex-col items-center justify-center gap-3">
               <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-primary text-3xl">task_alt</span>
               </div>
               <h4 className="font-headline-md text-xl">You're all caught up!</h4>
               <p className="font-body-md text-text-secondary text-sm">No assessments pending. Great job staying on top of your learning.</p>
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
                     
                     <button onClick={() => navigate(`/assessments/${a.assessment_id}/take`)} className="z-10 mt-auto w-full bg-primary group-hover:bg-accent-neon text-on-primary group-hover:text-primary font-label-mono text-[12px] font-bold py-4 rounded-full transition-colors duration-300 flex items-center justify-center gap-2">
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
