import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import StatCard from '../components/ui/StatCard';
import ActionCard from '../components/ui/ActionCard';
import { useAuthUser } from '../hooks/useAuthUser';

interface AdminStats {
  isSystemAdmin: boolean;
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  totalCourses: number;
  publishedCourses: number;
  totalCategories: number;
  totalEnrollments: number;
  totalRevenue: number;
  totalCertificates: number;
  recentEnrollments: Array<{
    enrollment_id: number;
    enrollment_status: string;
    enrolled_at: string;
    user: { full_name: string; email: string; profile_image: string | null };
    course: { title: string; slug: string };
  }>;
  recentCourses: Array<{
    course_id: number;
    title: string;
    slug: string;
    status: string;
    created_at: string;
    category?: { category_name: string } | null;
    course_admin?: { full_name: string } | null;
  }>;
  recentUsers: Array<{
    user_id: number;
    full_name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
  }>;
}

export default function AdminDashboard() {
  const user = useAuthUser(true);
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/users/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Failed to fetch administrative statistics');
        }
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        console.error('Error fetching admin stats:', err);
        setError(err.message || 'Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, API_URL, token]);

  if (!user) return null;

  return (
    <AdminLayout user={user}>
      {/* Welcome Section */}
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display-xl text-4xl md:text-5xl tracking-tight mb-2 text-primary">
            {user.role === 'SystemAdmin' ? 'System Overview' : 'Instructor Console'}
          </h1>
          <p className="font-body-md text-text-secondary max-w-xl">
            Live administrative telemetry, real platform metrics, and quick actions for your learning catalog.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/courses')} 
            className="bg-primary text-white font-label-mono text-label-mono px-5 py-2.5 rounded-full hover:scale-95 transition-transform flex items-center gap-2 cursor-pointer shadow-sm text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Manage Courses
          </button>
          <button 
            onClick={() => navigate('/courses')} 
            className="bg-white text-primary border border-primary/20 font-label-mono text-label-mono px-5 py-2.5 rounded-full hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            View Catalog
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-8 p-4 rounded-2xl bg-error/10 border border-error/20 text-error flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-text-secondary gap-3">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
          <p className="font-label-mono text-xs uppercase tracking-widest">Loading Platform Metrics...</p>
        </div>
      ) : stats ? (
        <>
          {/* KPI Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard 
              icon="group" 
              title="Total Users" 
              value={stats.totalUsers.toLocaleString()} 
              subtitle={`${stats.totalStudents} Students · ${stats.totalAdmins} Admins`}
              bgColorClass="bg-card-lavender"
            />
            <StatCard 
              icon="school" 
              title="Courses" 
              value={stats.totalCourses.toLocaleString()} 
              subtitle={`${stats.publishedCourses} Published · ${stats.totalCourses - stats.publishedCourses} Draft`}
              bgColorClass="bg-card-mint"
            />
            <StatCard 
              icon="how_to_reg" 
              title="Enrollments" 
              value={stats.totalEnrollments.toLocaleString()} 
              subtitle="Enrolled active learners"
              bgColorClass="bg-card-coral"
            />
            <StatCard 
              icon="payments" 
              title="Total Revenue" 
              value={stats.totalRevenue > 0 ? `₹${stats.totalRevenue.toLocaleString()}` : '₹0'} 
              subtitle={`${stats.totalCertificates} Certificates Issued`}
              bgColorClass="bg-white"
            />
          </section>

          {/* Action Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <ActionCard 
              bgColorClass="bg-card-mint"
              icon="library_books"
              title="Course Catalog"
              description={`Organize ${stats.totalCourses} courses, configure RAG study materials, topic hierarchies, and quiz assessments.`}
              buttonText="Manage Courses"
              onClick={() => navigate('/admin/courses')}
            />
            <ActionCard 
              bgColorClass="bg-card-lavender"
              icon="category"
              title="Course Categories"
              description={`Manage ${stats.totalCategories} active learning categories to classify technical domains and track student paths.`}
              buttonText="Manage Categories"
              onClick={() => navigate('/admin/categories')}
            />
            {stats.isSystemAdmin ? (
              <ActionCard 
                bgColorClass="bg-card-coral"
                icon="manage_accounts"
                title="User Administration"
                description={`Review ${stats.totalUsers} platform accounts, invite Course Admins, or manage user access privileges.`}
                buttonText="Manage Users"
                onClick={() => navigate('/admin/users')}
              />
            ) : (
              <ActionCard 
                bgColorClass="bg-card-coral"
                icon="workspace_premium"
                title="Certifications"
                description={`${stats.totalCertificates} students have successfully completed course requirements and earned verified credentials.`}
                buttonText="View Catalog"
                onClick={() => navigate('/courses')}
              />
            )}
          </section>

          {/* Dynamic Recent Activity Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            
            {/* Recent Enrollments */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 border border-black/5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">how_to_reg</span>
                  <h3 className="font-headline-md text-xl font-bold">Recent Enrollments</h3>
                </div>
                <span className="font-label-mono text-[11px] text-text-secondary uppercase tracking-wider">
                  Live Feed
                </span>
              </div>

              {stats.recentEnrollments.length === 0 ? (
                <div className="py-12 text-center text-text-secondary bg-surface-container-low/50 rounded-2xl border border-dashed border-outline-variant/40">
                  <span className="material-symbols-outlined text-3xl mb-1 text-text-secondary/50">school</span>
                  <p className="text-sm">No student enrollments recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3 flex-grow">
                  {stats.recentEnrollments.map((enr) => (
                    <div key={enr.enrollment_id} className="p-3.5 rounded-2xl bg-surface-container-low/40 hover:bg-surface-container-low transition-colors flex items-center justify-between gap-3 border border-black/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 uppercase overflow-hidden">
                          {enr.user.profile_image ? (
                            <img src={enr.user.profile_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            enr.user.full_name?.charAt(0) || enr.user.email?.charAt(0) || 'U'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-on-surface truncate">{enr.user.full_name || enr.user.email}</p>
                          <p className="text-xs text-text-secondary truncate">{enr.course.title}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-block font-label-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          enr.enrollment_status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-primary/10 text-primary'
                        }`}>
                          {enr.enrollment_status}
                        </span>
                        <p className="text-[10px] text-text-secondary mt-1">
                          {new Date(enr.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Courses Added */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 border border-black/5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">school</span>
                  <h3 className="font-headline-md text-xl font-bold">Recent Courses</h3>
                </div>
                <button 
                  onClick={() => navigate('/admin/courses')}
                  className="font-label-mono text-[11px] text-primary hover:underline uppercase tracking-wider font-bold cursor-pointer"
                >
                  View All ({stats.totalCourses})
                </button>
              </div>

              {stats.recentCourses.length === 0 ? (
                <div className="py-12 text-center text-text-secondary bg-surface-container-low/50 rounded-2xl border border-dashed border-outline-variant/40">
                  <span className="material-symbols-outlined text-3xl mb-1 text-text-secondary/50">menu_book</span>
                  <p className="text-sm">No courses created yet.</p>
                </div>
              ) : (
                <div className="space-y-3 flex-grow">
                  {stats.recentCourses.map((c) => (
                    <div key={c.course_id} className="p-3.5 rounded-2xl bg-surface-container-low/40 hover:bg-surface-container-low transition-colors flex items-center justify-between gap-3 border border-black/5">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-on-surface truncate">{c.title}</p>
                        <p className="text-xs text-text-secondary truncate">
                          {c.category?.category_name || 'Uncategorized'} · Created by {c.course_admin?.full_name || 'Admin'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`inline-block font-label-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          c.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                        <button 
                          onClick={() => navigate(`/admin/courses/${c.course_id}/topics`)}
                          className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                          title="Manage Curriculum"
                        >
                          <span className="material-symbols-outlined text-[16px]">tune</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>

          {/* System Admin: Recent Users List */}
          {stats.isSystemAdmin && stats.recentUsers && stats.recentUsers.length > 0 && (
            <section className="bg-white rounded-[32px] p-6 md:p-8 border border-black/5 shadow-sm mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">people</span>
                  <h3 className="font-headline-md text-xl font-bold">Recently Registered Users</h3>
                </div>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="font-label-mono text-[11px] text-primary hover:underline uppercase tracking-wider font-bold cursor-pointer"
                >
                  Manage Users ({stats.totalUsers})
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/5 text-text-secondary font-label-mono text-[11px] uppercase tracking-wider">
                      <th className="pb-3 pl-2">User</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-2 text-right">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {stats.recentUsers.map((u) => (
                      <tr key={u.user_id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-on-surface">{u.full_name}</td>
                        <td className="py-3.5 text-text-secondary font-label-mono text-xs">{u.email}</td>
                        <td className="py-3.5">
                          <span className={`font-label-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            u.role === 'SystemAdmin' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'CourseAdmin' ? 'bg-blue-100 text-blue-800' : 'bg-primary/10 text-primary'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`font-label-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            u.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-right text-xs text-text-secondary">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      ) : null}
    </AdminLayout>
  );
}
