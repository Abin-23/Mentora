import { useState, useEffect } from 'react';
import { useAuthUser } from '../hooks/useAuthUser';
import AdminLayout from '../components/layout/AdminLayout';

interface UserData {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  status: string;
  profile_image: string | null;
  created_at: string;
  provider: string | null;
}

export default function ManageUsers() {
  const currentUser = useAuthUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load users');
      setUsers(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId: number, newStatus: string) => {
    setStatusLoading(userId);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update status');
      
      // Update local state
      setUsers(users.map(u => u.user_id === userId ? { ...u, status: newStatus } : u));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStatusLoading(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/users/admin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ email: newAdminEmail, full_name: newAdminName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create admin');
      
      setUsers([data, ...users]);
      setIsModalOpen(false);
      setNewAdminEmail('');
      setNewAdminName('');
      alert('Course Admin created! They will receive an email to set their password.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <AdminLayout user={currentUser}>
      <section className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display-xl text-5xl tracking-tight mb-2">Manage Users</h1>
          <p className="font-body-md text-text-secondary">View and manage all registered users in the platform.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span className="font-label-mono text-xs uppercase tracking-widest font-bold hidden md:inline">Refresh</span>
          </button>
          {currentUser.role === 'SystemAdmin' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full shadow-md hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined">person_add</span>
              <span className="font-label-mono text-xs uppercase tracking-widest font-bold hidden md:inline">Course Admin</span>
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      <div className="bg-white rounded-[32px] overflow-hidden shadow-lg shadow-black/5 border border-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-lowest">
                <th className="px-6 py-4 font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">User</th>
                <th className="px-6 py-4 font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-md">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    <span className="material-symbols-outlined animate-spin-slow text-4xl text-primary mb-4 block">refresh</span>
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.user_id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
                          {u.profile_image ? (
                            <img src={u.profile_image} alt={u.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-primary font-bold">{u.email.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{u.full_name || 'Anonymous'}</p>
                          <p className="text-sm text-text-secondary">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-label-mono uppercase tracking-widest font-bold ${
                        u.role === 'SystemAdmin' ? 'bg-error/10 text-error border border-error/20' : 
                        u.role === 'CourseAdmin' ? 'bg-primary/10 text-primary border border-primary/20' : 
                        'bg-surface-container-high text-on-surface-variant border border-outline-variant/50'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${u.status === 'Active' ? 'bg-primary' : 'bg-error'}`}></div>
                        <span className="font-label-mono text-xs uppercase tracking-widest text-text-secondary">{u.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {currentUser.role === 'SystemAdmin' && u.user_id !== currentUser.user_id && (
                        <div className="flex justify-end">
                          <button 
                            disabled={statusLoading === u.user_id}
                            onClick={() => handleStatusChange(u.user_id, u.status === 'Active' ? 'Inactive' : 'Active')}
                            className={`font-label-mono text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                              u.status === 'Active' 
                                ? 'border-error/20 bg-error/5 text-error hover:bg-error/10' 
                                : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
                            }`}
                          >
                            {statusLoading === u.user_id ? 'Wait...' : u.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-cardFadeIn">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
              <h2 className="font-display-md text-2xl font-bold">New Course Admin</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-outline-variant/20 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <p className="text-sm text-text-secondary mb-4">
                This will create a new Course Admin account. An email will be sent automatically with a secure link for them to set their password.
              </p>
              <div className="space-y-1">
                <label className="font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest">Full Name *</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                  placeholder="John Doe"
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest">Email Address *</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                  placeholder="admin@mentora.com"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-outline-variant font-bold text-text-secondary hover:bg-surface-container-lowest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                  Create & Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
