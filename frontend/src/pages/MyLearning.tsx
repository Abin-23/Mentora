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

interface CertificateItem {
  certificate_id: number;
  credential_id: string;
  issued_at: string;
  grade_percentage: number | null;
  course: {
    course_id: number;
    title: string;
    slug: string;
    difficulty_level: string;
    duration_hours: string | null;
    category?: { category_name: string };
    course_admin?: { full_name: string };
  };
}

export default function MyLearning() {
  const user = useAuthUser();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'courses' | 'certificates'>('courses');
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollRes, certRes] = await Promise.all([
          fetch(`${API_URL}/enrollments/my-learning`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/certificates/my-certificates`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (enrollRes.ok) {
          const enrollData = await enrollRes.json();
          setEnrollments(enrollData);
        }

        if (certRes.ok) {
          const certData = await certRes.json();
          setCertificates(certData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load learning data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_URL, token]);

  const handleCopyLink = (credentialId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/certificate/${credentialId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(credentialId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAddToLinkedIn = (cert: CertificateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const issuedDate = new Date(cert.issued_at);
    const verificationUrl = `${window.location.origin}/certificate/${cert.credential_id}`;
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: cert.course.title,
      organizationName: 'Mentora',
      issueYear: issuedDate.getFullYear().toString(),
      issueMonth: (issuedDate.getMonth() + 1).toString(),
      certUrl: verificationUrl,
      certId: cert.credential_id
    });
    window.open(`https://www.linkedin.com/profile/add?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  if (!user) return null;

  return (
    <StudentLayout user={user}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="font-display-xl text-4xl md:text-5xl tracking-tight mb-2 text-on-surface">My Learning</h1>
          <p className="font-body-md text-text-secondary max-w-2xl">
            Track your ongoing courses, manage study progress, and view verified mastery certificates.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-surface-container-high p-1.5 rounded-2xl border border-outline-variant/30 self-start md:self-auto shrink-0 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary hover:text-on-surface hover:bg-white/40'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            <span>Enrolled Courses</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'courses' ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-text-secondary'}`}>
              {enrollments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
              activeTab === 'certificates'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary hover:text-on-surface hover:bg-white/40'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">workspace_premium</span>
            <span>Earned Certificates</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'certificates' ? 'bg-[#D4AF37]/20 text-[#8B6508]' : 'bg-surface-container-highest text-text-secondary'}`}>
              {certificates.length}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 text-error p-4 rounded-xl mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
          <p className="text-sm font-bold text-text-secondary">Loading learning journey...</p>
        </div>
      ) : activeTab === 'courses' ? (
        /* ==================== ENROLLED COURSES TAB ==================== */
        enrollments.length === 0 ? (
          <div className="text-center py-20 bg-white/40 border border-white rounded-3xl backdrop-blur-md">
            <span className="material-symbols-outlined text-6xl text-text-secondary mb-4 opacity-50 block">local_library</span>
            <h3 className="font-bold text-xl mb-2 text-on-surface">No courses enrolled yet</h3>
            <p className="text-text-secondary mb-6">Explore our catalog and find the perfect course for you.</p>
            <button 
              onClick={() => navigate('/courses')} 
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enr) => (
              <div 
                key={enr.enrollment_id} 
                className="bg-white/70 backdrop-blur-md border border-white shadow-lg shadow-black/5 rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 flex flex-col h-full"
              >
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
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                      {enr.course.category?.category_name || 'General'}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl leading-tight mb-2 text-on-surface line-clamp-2">
                    {enr.course.title}
                  </h3>
                  
                  <div className="flex gap-4 mt-auto pt-4 text-xs font-medium text-text-secondary border-t border-black/5">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">stairs</span> {enr.course.difficulty_level}
                    </div>
                    {enr.course.duration_hours && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">schedule</span> {enr.course.duration_hours}h
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/learn/${enr.course.slug}`)} 
                    className="mt-4 w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Continue Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ==================== CERTIFICATES GALLERY TAB ==================== */
        certificates.length === 0 ? (
          <div className="text-center py-20 bg-white/60 border border-outline-variant/30 rounded-3xl p-8 max-w-2xl mx-auto shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/20">
              <span className="material-symbols-outlined text-4xl">workspace_premium</span>
            </div>
            <h3 className="font-bold text-2xl mb-2 text-on-surface">No Certificates Earned Yet</h3>
            <p className="text-text-secondary max-w-md mx-auto mb-6 text-sm leading-relaxed">
              Complete all topic lessons, practice questions, and assessments in your enrolled courses to unlock official, accredited Mentora Certificates of Mastery.
            </p>
            <button
              onClick={() => setActiveTab('courses')}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all text-sm shadow-md"
            >
              Continue My Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => {
              const issuedDate = new Date(cert.issued_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={cert.certificate_id}
                  onClick={() => navigate(`/certificate/${cert.credential_id}`)}
                  className="group bg-white rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Certificate Top Banner Preview */}
                  <div className="p-6 bg-gradient-to-br from-[#0E2018] via-[#142A20] to-[#0A1711] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#0E2018] flex items-center justify-center font-bold shadow-md">
                          <span className="material-symbols-outlined text-lg">auto_awesome</span>
                        </div>
                        <span className="text-xs uppercase tracking-widest font-extrabold text-[#D4AF37]">
                          Mentora Certified
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/90 border border-white/20">
                        100% Mastery
                      </span>
                    </div>

                    <h3 className="text-xl font-bold leading-snug line-clamp-2 text-white group-hover:text-[#D4AF37] transition-colors relative z-10">
                      {cert.course.title}
                    </h3>
                    
                    <p className="text-[11px] text-white/70 mt-1 uppercase tracking-wider font-semibold">
                      {cert.course.category?.category_name || 'Specialized Track'}
                    </p>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col flex-grow bg-white justify-between">
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <span className="font-bold">Issued:</span>
                        <span className="font-semibold text-on-surface">{issuedDate}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <span className="font-bold">Credential ID:</span>
                        <span className="font-mono text-primary font-bold">{cert.credential_id.slice(0, 8)}...</span>
                      </div>

                      {cert.course.course_admin?.full_name && (
                        <div className="flex items-center justify-between text-xs text-text-secondary">
                          <span className="font-bold">Instructor:</span>
                          <span className="font-medium text-on-surface truncate max-w-[140px]">{cert.course.course_admin.full_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleAddToLinkedIn(cert, e)}
                        className="p-2 rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                        title="Add to LinkedIn Profile"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z" />
                        </svg>
                        <span>LinkedIn</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(cert.credential_id, e)}
                        className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-text-secondary transition-all text-xs font-bold flex items-center gap-1"
                        title="Copy Public Link"
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {copiedId === cert.credential_id ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedId === cert.credential_id ? 'Copied' : 'Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/certificate/${cert.credential_id}`)}
                        className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1 ml-auto shadow-sm"
                      >
                        <span>View</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </StudentLayout>
  );
}
