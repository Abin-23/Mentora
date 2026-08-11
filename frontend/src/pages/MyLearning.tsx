import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import StudentLayout from '../components/layout/StudentLayout';

interface EnrolledCourse {
  enrollment_id: number;
  enrollment_status: string;
  enrolled_at: string;
  course: {
    course_id: number;
    title: string;
    slug: string;
    short_description: string;
    thumbnail_key: string | null;
    duration_hours: string | null;
    difficulty_level: string;
    course_admin?: { full_name: string };
    category?: { category_name: string };
  };
}

export default function MyLearning() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await fetch(`${API_URL}/enrollments/my-learning`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch enrollments');
        const data = await res.json();
        setEnrollments(data);
      } catch (err: any) {
        setError(err.message);
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
        <h1 className="font-display-xl text-4xl md:text-5xl tracking-tight mb-4">My Learning</h1>
        <p className="font-body-md text-text-secondary max-w-2xl">Access all the courses you have enrolled in and continue your learning journey.</p>
      </div>

      {error && (
        <div className="bg-error/10 text-error p-4 rounded-xl mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-20 bg-white/40 border border-white rounded-3xl backdrop-blur-md">
          <span className="material-symbols-outlined text-6xl text-text-secondary mb-4 opacity-50 block">local_library</span>
          <h3 className="font-bold text-xl mb-2">No courses enrolled yet</h3>
          <p className="text-text-secondary mb-6">Explore our catalog and find the perfect course for you.</p>
          <button onClick={() => navigate('/courses')} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all">Browse Courses</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enr) => (
            <div key={enr.enrollment_id} className="bg-white/60 backdrop-blur-md border border-white shadow-lg shadow-black/5 rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 flex flex-col h-full">
              {enr.course.thumbnail_key ? (
                <div className="aspect-video w-full relative bg-surface-container-low">
                  <img src={enr.course.thumbnail_key} alt={enr.course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/10"></div>
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-primary text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                    {enr.enrollment_status}
                  </span>
                </div>
              ) : (
                <div className="aspect-video w-full bg-primary/10 flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-5xl text-primary/30">school</span>
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-primary text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                    {enr.enrollment_status}
                  </span>
                </div>
              )}
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">{enr.course.category?.category_name || 'Uncategorized'}</span>
                </div>
                <h3 className="font-bold text-xl leading-tight mb-2 text-on-surface line-clamp-2">{enr.course.title}</h3>
                
                <div className="flex gap-4 mt-auto pt-4 text-xs font-medium text-text-secondary border-t border-black/5">
                  <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">stairs</span> {enr.course.difficulty_level}</div>
                  {enr.course.duration_hours && <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">schedule</span> {enr.course.duration_hours}h</div>}
                </div>
                
                <button onClick={() => navigate(`/learn/${enr.course.slug}`)} className="mt-4 w-full py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors">
                  Continue Learning
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
}
