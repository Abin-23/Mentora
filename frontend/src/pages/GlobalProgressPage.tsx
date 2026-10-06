import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import StudentLayout from '../components/layout/StudentLayout';

export default function GlobalProgressPage() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await fetch(`${API_URL}/enrollments/my-learning`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEnrollments(data);
        }
      } catch (err) {
        console.error("Failed to fetch enrollments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [API_URL, token]);

  if (!user) return null;

  return (
    <StudentLayout user={user}>
      <div className="mb-12">
        <h1 className="font-display-xl text-4xl md:text-5xl tracking-tight mb-4">Overall Progress</h1>
        <p className="font-body-md text-text-secondary max-w-2xl">Track your knowledge growth and mastery across all your enrolled courses.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-20 bg-white/40 border border-white rounded-3xl backdrop-blur-md">
          <span className="material-symbols-outlined text-6xl text-text-secondary mb-4 opacity-50 block">timeline</span>
          <h3 className="font-bold text-xl mb-2">No active progress</h3>
          <p className="text-text-secondary mb-6">Enroll in a course to start tracking your knowledge growth.</p>
          <button onClick={() => navigate('/courses')} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all">Browse Courses</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enr) => (
            <button 
              key={enr.enrollment_id} 
              onClick={() => navigate(`/learn/${enr.course.slug}/progress`)}
              className="text-left bg-white/60 backdrop-blur-md border border-white shadow-lg shadow-black/5 rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 flex flex-col group h-full"
            >
              <div className="p-6 flex flex-col flex-grow w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-8xl text-primary">monitoring</span>
                </div>
                
                <div className="flex items-center gap-2 mb-4 relative">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[16px]">school</span>
                  </span>
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{enr.enrollment_status}</span>
                </div>
                
                <h3 className="font-bold text-xl leading-tight mb-2 text-on-surface line-clamp-2 relative">{enr.course.title}</h3>
                <p className="text-sm text-text-secondary line-clamp-2 relative mb-6">{enr.course.short_description}</p>
                
                <div className="mt-auto flex items-center justify-between text-primary font-bold relative border-t border-black/5 pt-4 w-full">
                  <span className="text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">insights</span>
                    View Mastery Dashboard
                  </span>
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
