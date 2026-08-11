import { useState, useEffect } from 'react';
import { useAuthUser } from '../hooks/useAuthUser';
import AdminLayout from '../components/layout/AdminLayout';

interface CategoryData {
  category_id: number;
  category_name: string;
  description: string | null;
  icon: string | null;
  status: string;
  created_at: string;
  created_by: number;
  creator?: {
    full_name: string;
    email: string;
  };
}

export default function ManageCategories() {
  const currentUser = useAuthUser();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    icon: '',
    status: 'Active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load categories');
      setCategories(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category?: CategoryData) => {
    if (category) {
      setEditingId(category.category_id);
      setFormData({
        category_name: category.category_name,
        description: category.description || '',
        icon: category.icon || '',
        status: category.status
      });
    } else {
      setEditingId(null);
      setFormData({
        category_name: '',
        description: '',
        icon: '',
        status: 'Active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const url = editingId ? `${API_URL}/categories/${editingId}` : `${API_URL}/categories`;
      const method = editingId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save category');
      
      setIsModalOpen(false);
      fetchCategories();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete category');
      }
      fetchCategories();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!currentUser) return null;

  return (
    <AdminLayout user={currentUser}>
      <section className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display-xl text-5xl tracking-tight mb-2">Course Categories</h1>
          <p className="font-body-md text-text-secondary">Organize and manage the different subjects available on Mentora.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={fetchCategories}
            disabled={loading}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span className="font-label-mono text-xs uppercase tracking-widest font-bold">Refresh</span>
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full shadow-md shadow-primary/20 hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            <span className="font-label-mono text-xs uppercase tracking-widest font-bold">New Category</span>
          </button>
        </div>
      </section>

      {error && !isModalOpen && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      <div className="bg-white rounded-[32px] overflow-hidden shadow-lg shadow-black/5 border border-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-lowest">
                <th className="px-6 py-4 font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Created By</th>
                <th className="px-6 py-4 font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-md">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4 block">refresh</span>
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map(c => (
                  <tr key={c.category_id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/30 shrink-0">
                          {c.icon ? (
                            c.icon.startsWith('http') ? (
                              <img src={c.icon} alt={c.category_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-primary">{c.icon}</span>
                            )
                          ) : (
                            <span className="material-symbols-outlined text-text-secondary">category</span>
                          )}
                        </div>
                        <p className="font-bold text-on-surface">{c.category_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">
                      {c.description || <span className="italic opacity-50">No description</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${c.status === 'Active' ? 'bg-primary' : 'bg-error'}`}></div>
                        <span className="font-label-mono text-xs uppercase tracking-widest text-text-secondary">{c.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-on-surface">{c.creator?.full_name || 'System'}</p>
                      <p className="text-xs text-text-secondary">{new Date(c.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {(currentUser.role === 'SystemAdmin' || (currentUser.role === 'CourseAdmin' && c.created_by === (currentUser.user_id || currentUser.sub))) && (
                          <button 
                            onClick={() => handleOpenModal(c)}
                            className="w-8 h-8 rounded-full bg-primary/5 text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
                            title="Edit Category"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        )}
                        {(currentUser.role === 'SystemAdmin' || (currentUser.role === 'CourseAdmin' && c.created_by === (currentUser.user_id || currentUser.sub))) && (
                          <button 
                            onClick={() => handleDelete(c.category_id)}
                            className="w-8 h-8 rounded-full bg-error/5 text-error hover:bg-error/10 flex items-center justify-center transition-colors"
                            title="Delete Category"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
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
              <h2 className="font-display-md text-2xl font-bold">{editingId ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-outline-variant/20 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && isModalOpen && (
                <div className="bg-error/10 text-error p-3 rounded-xl text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span> {error}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest">Category Name *</label>
                <input 
                  type="text" 
                  required
                  maxLength={100}
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                  placeholder="e.g. Web Development"
                  value={formData.category_name}
                  onChange={e => setFormData({...formData, category_name: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest">Description</label>
                <textarea 
                  rows={3}
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md resize-none"
                  placeholder="Brief description of what this category covers..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest">Icon Name or URL</label>
                <input 
                  type="text" 
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md"
                  placeholder="e.g. code, http://...image.png"
                  value={formData.icon}
                  onChange={e => setFormData({...formData, icon: e.target.value})}
                />
                <p className="text-[10px] text-text-secondary mt-1">Use a Google Material Symbol name (e.g., 'code', 'data_object') or an image URL.</p>
              </div>

              <div className="space-y-1">
                <label className="font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest">Status</label>
                <select 
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-body-md appearance-none"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
