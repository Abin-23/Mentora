import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../components/layout/StudentLayout';
import BentoCard from '../components/ui/BentoCard';
import CourseCard from '../components/ui/CourseCard';

import { useAuthUser } from '../hooks/useAuthUser';
export default function Dashboard() {
  const user = useAuthUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && (user.role === 'SystemAdmin' || user.role === 'CourseAdmin')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.role === 'SystemAdmin' || user.role === 'CourseAdmin') return null;

  return (
    <StudentLayout user={user}>
      {/* Welcome Section */}
      <section className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="font-display-xl text-5xl md:text-6xl tracking-tight mb-2">
            Welcome back.
          </h1>
          <p className="font-body-md text-text-secondary">
            Your personalized learning ecosystem is ready. You have <strong className="text-primary">2 tasks</strong> pending.
          </p>
        </div>
        <button className="bg-primary text-on-primary font-label-mono text-label-mono px-6 py-3 rounded-full hover:scale-95 transition-transform flex items-center gap-2 cursor-pointer shadow-lg">
          Resume Course <span className="material-symbols-outlined text-[18px]">play_arrow</span>
        </button>
      </section>

      {/* Bento Grid Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px]">
        
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
          <div className="z-10 max-w-lg mt-4">
            <h3 className="font-headline-md text-2xl mb-2">You're mastering Data Structures!</h3>
            <p className="font-body-md opacity-80 leading-relaxed">Based on your recent quizzes, you show a 94% retention rate in binary trees. I recommend moving on to Graph Theory next.</p>
          </div>
          
          {/* Decorative background shape */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        </BentoCard>

        {/* Current Streak - Mint Card */}
        <BentoCard colSpanClass="md:col-span-4" bgColorClass="bg-card-mint">
          <div className="flex justify-between items-center">
            <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary/60">Activity</span>
            <span className="material-symbols-outlined text-primary/40">local_fire_department</span>
          </div>
          <div className="text-center">
            <div className="font-display-xl text-7xl text-primary mb-1 tracking-tighter">12</div>
            <p className="font-label-mono text-label-mono text-primary/70">DAY STREAK</p>
          </div>
          <div className="flex gap-1 justify-center mt-4">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className={`w-8 h-2 rounded-full ${day <= 5 ? 'bg-primary' : 'bg-primary/10'}`}></div>
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
                <circle cx="50" cy="50" r="40" fill="none" stroke="#000" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="80" strokeLinecap="round" className="animate-[spin_2s_ease-out_forwards]" />
              </svg>
              <span className="absolute font-display-xl text-3xl">68%</span>
            </div>
          </div>
        </BentoCard>

        {/* Active Course - White Card */}
        <CourseCard />
        
      </section>
    </StudentLayout>
  );
}
