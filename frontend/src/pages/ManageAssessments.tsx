import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import AdminLayout from '../components/layout/AdminLayout';

interface Assessment {
  assessment_id: number;
  course_id: number;
  title: string;
  description: string;
  assessment_type: string;
  is_system_generated: boolean;
  total_questions: number;
  passing_percentage: number | null;
  max_attempts: number;
  status: string;
  created_at: string;
}

export default function ManageAssessments() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthUser();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/assessments/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load assessments');
      const data = await res.json();
      setAssessments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [courseId]);

  if (!currentUser) return null;

  return (
    <AdminLayout user={currentUser}>
      <div className="mb-6">
        <button onClick={() => navigate('/admin/courses')} className="text-sm font-bold text-text-secondary hover:text-primary flex items-center gap-1 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Courses
        </button>
      </div>

      <section className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="font-display-xl text-4xl tracking-tight mb-2 text-on-surface">Course Assessments</h1>
          <p className="font-body-md text-text-secondary">View and manage assessments for this course.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchAssessments} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow text-sm font-bold">
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span> Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2 font-bold">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-outline-variant/30 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-text-secondary">Loading assessments...</div>
        ) : assessments.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-text-secondary opacity-40 mb-3">quiz</span>
            <h3 className="font-bold text-xl text-on-surface">No assessments found</h3>
            <p className="text-text-secondary mt-1">
              If this course is published, an Initial Assessment should be auto-generated.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/30">
            {assessments.map(assessment => (
              <div key={assessment.assessment_id} className="p-6 hover:bg-surface-container-lowest transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border border-primary/20">
                      {assessment.assessment_type}
                    </span>
                    {assessment.is_system_generated && (
                      <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border border-secondary/20">
                        AI Generated
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${assessment.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {assessment.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-on-surface">{assessment.title}</h3>
                  <p className="text-sm text-text-secondary max-w-2xl">{assessment.description}</p>
                  
                  <div className="flex gap-4 mt-3 text-xs font-label-mono uppercase tracking-widest text-text-secondary">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">format_list_numbered</span> {assessment.total_questions} Questions</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">replay</span> {assessment.max_attempts} Attempt(s)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
