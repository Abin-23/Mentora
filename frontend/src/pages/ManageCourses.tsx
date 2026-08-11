import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import AdminLayout from '../components/layout/AdminLayout';

interface CourseData {
  course_id: number;
  category_id: number;
  title: string;
  slug: string;
  short_description: string;
  difficulty_level: string;
  price: number;
  status: string;
  thumbnail_key?: string;
  created_at: string;
  category?: { category_name: string };
  course_admin?: { full_name: string; email: string };
  course_admin_id: number;
}

interface Category {
  category_id: number;
  category_name: string;
}

export default function ManageCourses() {
  const navigate = useNavigate();
  const currentUser = useAuthUser();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    short_description: '',
    description: '',
    learning_objectives: '',
    prerequisites: '',
    difficulty_level: 'Beginner',
    language: 'English',
    duration_hours: '',
    price: '0.00',
    thumbnail_key: '',
    status: 'Draft'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [coursesRes, catRes] = await Promise.all([
        fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const coursesData = await coursesRes.json();
      const catData = await catRes.json();
      
      if (!coursesRes.ok) throw new Error(coursesData.message || 'Failed to load courses');
      
      setCourses(coursesData);
      setCategories(catData);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenModal = async (course?: any) => {
    if (course) {
      setEditingId(course.course_id);
      
      // Fetch full details for editing
      try {
        const res = await fetch(`${API_URL}/courses/${course.course_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fullCourse = await res.json();
        
        setFormData({
          category_id: fullCourse.category_id.toString(),
          title: fullCourse.title,
          short_description: fullCourse.short_description,
          description: fullCourse.description,
          learning_objectives: fullCourse.learning_objectives,
          prerequisites: fullCourse.prerequisites || '',
          difficulty_level: fullCourse.difficulty_level,
          language: fullCourse.language || 'English',
          duration_hours: fullCourse.duration_hours?.toString() || '',
          price: fullCourse.price?.toString() || '0.00',
          thumbnail_key: fullCourse.thumbnail_key || '',
          status: fullCourse.status
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      setEditingId(null);
      setFormData({
        category_id: categories.length > 0 ? categories[0].category_id.toString() : '',
        title: '',
        short_description: '',
        description: '',
        learning_objectives: '',
        prerequisites: '',
        difficulty_level: 'Beginner',
        language: 'English',
        duration_hours: '',
        price: '0.00',
        thumbnail_key: '',
        status: 'Draft'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Format numeric values
    const payload = {
      ...formData,
      category_id: parseInt(formData.category_id),
      duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : undefined,
      price: formData.price ? parseFloat(formData.price) : 0,
    };

    try {
      const url = editingId ? `${API_URL}/courses/${editingId}` : `${API_URL}/courses`;
      const method = editingId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save course');
      
      setIsModalOpen(false);
      fetchData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`${API_URL}/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete course');
      }
      fetchData();
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
          <h1 className="font-display-xl text-5xl tracking-tight mb-2">Manage Courses</h1>
          <p className="font-body-md text-text-secondary">Create and manage your course offerings.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span className="font-label-mono text-xs uppercase tracking-widest font-bold hidden md:inline">Refresh</span>
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full shadow-md shadow-primary/20 hover:scale-105 transition-transform">
            <span className="material-symbols-outlined">add</span>
            <span className="font-label-mono text-xs uppercase tracking-widest font-bold">New Course</span>
          </button>
        </div>
      </section>

      {error && !isModalOpen && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-secondary">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white/40 border border-white rounded-3xl backdrop-blur-md shadow-sm">
            <span className="material-symbols-outlined text-6xl text-text-secondary mb-4 opacity-50 block">school</span>
            <h3 className="font-bold text-xl mb-2 text-on-surface">No courses found</h3>
            <p className="text-text-secondary">Get started by creating your first course.</p>
            <button onClick={() => handleOpenModal()} className="mt-6 bg-primary text-white px-6 py-2 rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span> Create Course
            </button>
          </div>
        ) : (
          courses.map(c => (
            <div key={c.course_id} className="group relative bg-white/60 backdrop-blur-md border border-white shadow-lg shadow-black/5 rounded-3xl p-5 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              
              {/* Thumbnail Container */}
              <div className="w-full h-40 bg-surface-container-low rounded-2xl mb-4 relative overflow-hidden border border-black/5">
                {c.thumbnail_key && c.thumbnail_key.startsWith('http') ? (
                  <img src={c.thumbnail_key} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-text-secondary opacity-30">image</span>
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-label-mono uppercase tracking-widest font-bold shadow-sm backdrop-blur-md ${
                    c.status === 'Published' ? 'bg-primary/90 text-white' :
                    c.status === 'Draft' ? 'bg-surface-container-high/90 text-on-surface-variant' :
                    'bg-error/90 text-white'
                  }`}>{c.status}</span>
                </div>
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => navigate(`/admin/courses/${c.course_id}/topics`)} className="w-8 h-8 rounded-full bg-white text-secondary shadow-md flex items-center justify-center hover:scale-110 transition-transform" title="Manage Topics">
                    <span className="material-symbols-outlined text-sm">library_books</span>
                  </button>
                  <button onClick={() => handleOpenModal(c)} className="w-8 h-8 rounded-full bg-white text-primary shadow-md flex items-center justify-center hover:scale-110 transition-transform" title="Edit Course">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  {(currentUser.role === 'SystemAdmin' || (currentUser.role === 'CourseAdmin' && c.course_admin_id === (currentUser.user_id || currentUser.sub))) && (
                    <button onClick={() => handleDelete(c.course_id)} className="w-8 h-8 rounded-full bg-white text-error shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-bold text-text-secondary border border-outline-variant/30 truncate max-w-[150px]">{c.category?.category_name}</span>
                <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-bold uppercase tracking-widest text-text-secondary border border-outline-variant/30">{c.difficulty_level}</span>
              </div>
              
              {/* Title & Desc */}
              <h3 className="font-headline-md text-lg font-bold text-on-surface mb-1 leading-tight line-clamp-2">{c.title}</h3>
              <p className="font-body-md text-text-secondary text-sm flex-grow opacity-80 mb-4 line-clamp-2">
                {c.short_description}
              </p>

              {/* Footer */}
              <div className="flex justify-between items-center border-t border-outline-variant/30 pt-4 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-label-mono text-text-secondary tracking-widest">Price</span>
                  <span className="font-bold text-primary">${Number(c.price).toFixed(2)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] uppercase font-label-mono text-text-secondary tracking-widest">Created By</span>
                  <span className="text-xs font-bold truncate max-w-[120px]">{c.course_admin?.full_name}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl overflow-hidden my-8 animate-cardFadeIn flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest shrink-0">
              <div>
                <h2 className="font-display-md text-2xl font-bold text-on-surface">{editingId ? 'Edit Course Details' : 'Create New Course'}</h2>
                <p className="text-sm text-text-secondary mt-1">{editingId ? 'Update your course content and settings' : 'Set up a new course for your students'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-outline-variant/30 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-on-surface">close</span>
              </button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form id="course-form" onSubmit={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column - Main Content */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    {/* Section: Basic Info */}
                    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 space-y-5">
                      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                        <span className="material-symbols-outlined text-primary">title</span>
                        <h3 className="font-bold text-lg">Basic Information</h3>
                      </div>
                      
                      <div>
                        <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Course Title *</label>
                        <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="E.g., Complete Python Bootcamp" />
                      </div>

                      <div>
                        <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Short Description *</label>
                        <textarea required rows={2} value={formData.short_description} onChange={e => setFormData({...formData, short_description: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="A catchy one-liner for the course card..."></textarea>
                      </div>

                      <div>
                        <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Full Description *</label>
                        <textarea required rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="Provide a detailed overview of the course content..."></textarea>
                      </div>
                    </div>

                    {/* Section: Curriculum Details */}
                    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 space-y-5">
                      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                        <span className="material-symbols-outlined text-primary">menu_book</span>
                        <h3 className="font-bold text-lg">Curriculum Details</h3>
                      </div>
                      
                      <div>
                        <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Learning Objectives *</label>
                        <textarea required rows={4} value={formData.learning_objectives} onChange={e => setFormData({...formData, learning_objectives: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="What will students learn? (e.g. Build 5 real-world projects)"></textarea>
                      </div>

                      <div>
                        <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Prerequisites</label>
                        <textarea rows={2} value={formData.prerequisites} onChange={e => setFormData({...formData, prerequisites: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="Any required prior knowledge or tools..."></textarea>
                      </div>
                    </div>

                  </div>

                  {/* Right Column - Settings */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Status Card */}
                    <div className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/30">
                      <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 ml-1">Publication Status *</label>
                      <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold">
                        <option value="Draft">Draft (Hidden)</option>
                        <option value="Published">Published (Public)</option>
                        <option value="Archived">Archived (Legacy)</option>
                      </select>
                    </div>

                    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 space-y-5">
                      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                        <span className="material-symbols-outlined text-primary">settings</span>
                        <h3 className="font-bold text-lg">Settings</h3>
                      </div>

                      <div>
                        <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Category *</label>
                        <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                          <option value="" disabled>Select Category</option>
                          {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Price (₹) *</label>
                          <input type="number" step="0.01" min="0" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-primary" placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Duration (Hrs)</label>
                          <input type="number" step="0.5" min="0" value={formData.duration_hours} onChange={e => setFormData({...formData, duration_hours: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="10.5" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Difficulty *</label>
                          <select required value={formData.difficulty_level} onChange={e => setFormData({...formData, difficulty_level: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all">
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Language *</label>
                          <input type="text" required value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="English" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Media Card */}
                    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 space-y-5">
                      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
                        <span className="material-symbols-outlined text-primary">image</span>
                        <h3 className="font-bold text-lg">Media</h3>
                      </div>
                      <div>
                        <label className="block font-label-mono text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1.5 ml-1">Thumbnail Image URL</label>
                        <input type="url" placeholder="https://..." value={formData.thumbnail_key} onChange={e => setFormData({...formData, thumbnail_key: e.target.value})} className="w-full bg-white border border-outline-variant/60 rounded-xl px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                        {formData.thumbnail_key && formData.thumbnail_key.startsWith('http') && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-outline-variant/30 aspect-video bg-surface-container-low">
                            <img src={formData.thumbnail_key} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </form>
            </div>
            
            {/* Fixed Footer */}
            <div className="px-8 py-5 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl border border-outline-variant font-bold text-text-secondary hover:bg-surface-container-low transition-colors">
                Cancel
              </button>
              <button form="course-form" type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-primary text-white font-bold flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100">
                {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">save</span>}
                {editingId ? 'Save Changes' : 'Create Course'}
              </button>
            </div>

          </div>
        </div>
      )}
    </AdminLayout>
  );
}
