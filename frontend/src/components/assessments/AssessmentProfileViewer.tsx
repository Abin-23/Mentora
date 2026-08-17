import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AssessmentProfileViewerProps {
  assessmentId: number;
  courseSlug: string;
}

export default function AssessmentProfileViewer({ assessmentId, courseSlug }: AssessmentProfileViewerProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/assessments/${assessmentId}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            setProfile(null);
          } else {
            throw new Error('Failed to load profile');
          }
        } else {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [assessmentId, API_URL, token]);

  const handleTakeAssessment = () => {
    navigate(`/assessments/${assessmentId}/take`, { state: { returnUrl: `/learn/${courseSlug}` } });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-text-secondary p-10 text-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-error p-10 text-center">
        <span className="material-symbols-outlined text-5xl mb-4">error</span>
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-text-secondary p-10 text-center h-full">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-50">quiz</span>
        <h3 className="text-xl font-bold text-on-surface mb-2">No Profile Available</h3>
        <p className="mb-6 max-w-md">You haven't completed this assessment yet. Take the assessment to generate your personalized performance profile.</p>
        <button 
          onClick={handleTakeAssessment}
          className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all shadow-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">play_arrow</span> Take Assessment
        </button>
      </div>
    );
  }

  const { student, assessment, topic_results } = profile;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-lg shadow-black/5 h-full flex flex-col">
      <div className="p-8 border-b border-outline-variant/30 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
        <div>
          <h2 className="text-3xl font-display-md font-bold text-on-surface tracking-tight mb-2">Assessment Profile</h2>
          <div className="space-y-1 text-sm text-text-secondary">
            <p><span className="font-bold text-on-surface mr-2">Student:</span> {student?.full_name}</p>
            <p><span className="font-bold text-on-surface mr-2">Course:</span> {assessment?.course?.title}</p>
            <p><span className="font-bold text-on-surface mr-2">Overall Score:</span> {profile.percentage}%</p>
          </div>
        </div>
        {(!assessment?.max_attempts || profile.attempt_number < assessment.max_attempts) && (
          <button 
            onClick={handleTakeAssessment}
            className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:scale-105 transition-all shadow-md shrink-0 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">replay</span> Retake Assessment
          </button>
        )}
      </div>
      
      <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
        <h3 className="text-xl font-bold mb-6 text-on-surface">Topic Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-outline-variant/30 text-text-secondary">
                <th className="py-4 px-4 font-bold uppercase tracking-widest text-xs">Topic</th>
                <th className="py-4 px-4 font-bold uppercase tracking-widest text-xs">Level</th>
                <th className="py-4 px-4 font-bold uppercase tracking-widest text-xs text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {topic_results?.map((result: any, index: number) => {
                let levelColor = 'text-text-secondary bg-surface-container-high';
                if (result.proficiency_level === 'ADVANCED') levelColor = 'text-primary bg-primary/10 border-primary/20';
                else if (result.proficiency_level === 'PROFICIENT') levelColor = 'text-green-600 bg-green-50 border-green-200';
                else if (result.proficiency_level === 'DEVELOPING') levelColor = 'text-orange-600 bg-orange-50 border-orange-200';
                else if (result.proficiency_level === 'BEGINNER') levelColor = 'text-error bg-error/10 border-error/20';

                return (
                  <tr key={index} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-4 px-4 font-medium text-on-surface">
                      {result.topic?.topic_title || 'Unknown Topic'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${levelColor}`}>
                        {result.proficiency_level}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-on-surface text-right">
                      {result.percentage}%
                    </td>
                  </tr>
                );
              })}
              {(!topic_results || topic_results.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-text-secondary italic">
                    No topic data available for this attempt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
