import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { useAuthUser } from '../hooks/useAuthUser';

interface TopicData {
  topic_id: number;
  course_id: number;
  topic_title: string;
  topic_description: string;
  learning_objectives: string;
  difficulty_level: string;
  estimated_duration: number;
  sequence_number: number;
  status: string;
}

export default function ManageCourseTopics() {
  const currentUser = useAuthUser();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    topic_title: '',
    topic_description: '',
    learning_objectives: '',
    difficulty_level: 'Beginner',
    estimated_duration: '',
    status: 'Draft'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // We will try to fetch course and topics in parallel
      const headers = { Authorization: `Bearer ${token}` };
      
      const topicsRes = await fetch(`${API_URL}/courses/${courseId}/topics`, { headers });
      
      if (!topicsRes.ok) throw new Error('Failed to fetch topics');
      const topicsData = await topicsRes.json();
      setTopics(topicsData);

      // Try fetching course title
      try {
        const courseRes = await fetch(`${API_URL}/courses/${courseId}`, { headers });
        if (courseRes.ok) {
          const courseData = await courseRes.json();
          setCourse(courseData);
        }
      } catch(e) {
        // ignore if course fetch fails, not critical
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const handleOpenModal = (topic?: TopicData) => {
    if (topic) {
      setEditingId(topic.topic_id);
      setFormData({
        topic_title: topic.topic_title,
        topic_description: topic.topic_description || '',
        learning_objectives: topic.learning_objectives,
        difficulty_level: topic.difficulty_level,
        estimated_duration: topic.estimated_duration ? topic.estimated_duration.toString() : '',
        status: topic.status
      });
    } else {
      setEditingId(null);
      setFormData({
        topic_title: '',
        topic_description: '',
        learning_objectives: '',
        difficulty_level: 'Beginner',
        estimated_duration: '',
        status: 'Draft'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        estimated_duration: formData.estimated_duration ? parseFloat(formData.estimated_duration) : undefined
      };

      const url = editingId 
        ? `${API_URL}/topics/${editingId}`
        : `${API_URL}/courses/${courseId}/topics`;
        
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save topic');
      }

      handleCloseModal();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    
    try {
      const res = await fetch(`${API_URL}/topics/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete topic');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting');
    }
  };

  const handleReorder = async (direction: 'up' | 'down', index: number) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === topics.length - 1) return;

    setIsReordering(true);
    
    const newTopics = [...topics];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap sequence numbers
    const tempSeq = newTopics[index].sequence_number;
    newTopics[index].sequence_number = newTopics[swapIndex].sequence_number;
    newTopics[swapIndex].sequence_number = tempSeq;

    // Swap positions in array for immediate UI update
    const temp = newTopics[index];
    newTopics[index] = newTopics[swapIndex];
    newTopics[swapIndex] = temp;
    
    setTopics(newTopics);

    try {
      const res = await fetch(`${API_URL}/courses/${courseId}/topics/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topics: [
            { topic_id: newTopics[index].topic_id, sequence_number: newTopics[index].sequence_number },
            { topic_id: newTopics[swapIndex].topic_id, sequence_number: newTopics[swapIndex].sequence_number }
          ]
        })
      });

      if (!res.ok) {
        throw new Error('Failed to reorder');
      }
    } catch (err: any) {
      setError('Failed to reorder topics. Refreshing list.');
      fetchData();
    } finally {
      setIsReordering(false);
    }
  };

  if (!currentUser) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin text-primary material-symbols-outlined text-4xl">refresh</div></div>;
  }

  return (
    <AdminLayout user={currentUser}>
      {/* Header section */}
      <section className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-lg shadow-black/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/courses')} className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-outline-variant/30 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <div>
            <h1 className="font-display-lg text-3xl font-bold text-on-surface leading-tight">
              Manage Topics
            </h1>
            <p className="font-body-md text-text-secondary text-sm opacity-80 mt-1">
              {course ? `Course: ${course.title}` : 'Organize and manage learning topics for this course.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center justify-center w-10 h-10 bg-white text-text-secondary rounded-full shadow-sm hover:bg-surface-container-low transition-colors">
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full shadow-md shadow-primary/20 hover:scale-105 transition-transform">
            <span className="material-symbols-outlined">add</span>
            <span className="font-label-mono text-xs uppercase tracking-widest font-bold">New Topic</span>
          </button>
        </div>
      </section>

      {error && !isModalOpen && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      {loading && topics.length === 0 ? (
        <div className="py-12 text-center text-text-secondary">Loading topics...</div>
      ) : topics.length === 0 ? (
        <div className="py-20 text-center bg-white/40 border border-white rounded-3xl backdrop-blur-md shadow-sm">
          <span className="material-symbols-outlined text-6xl text-text-secondary mb-4 opacity-50 block">library_books</span>
          <h3 className="font-bold text-xl mb-2 text-on-surface">No topics found</h3>
          <p className="text-text-secondary">Start adding topics to build your course content.</p>
          <button onClick={() => handleOpenModal()} className="mt-6 bg-primary text-white px-6 py-2 rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Create Topic
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {topics.map((t, index) => (
            <div key={t.topic_id} className="group relative bg-white/60 backdrop-blur-md border border-white shadow-lg shadow-black/5 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 flex items-center gap-4">
              
              {/* Reorder Buttons */}
              <div className="flex flex-col gap-1 items-center justify-center pr-4 border-r border-outline-variant/30">
                <button 
                  onClick={() => handleReorder('up', index)} 
                  disabled={index === 0 || isReordering}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${index === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-primary/10 text-text-secondary hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined">keyboard_arrow_up</span>
                </button>
                <span className="font-label-mono text-xs font-bold text-text-secondary opacity-50">{t.sequence_number}</span>
                <button 
                  onClick={() => handleReorder('down', index)} 
                  disabled={index === topics.length - 1 || isReordering}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${index === topics.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-primary/10 text-text-secondary hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined">keyboard_arrow_down</span>
                </button>
              </div>

              {/* Topic Info */}
              <div className="flex-1 min-w-0 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-label-mono uppercase tracking-widest font-bold shadow-sm ${
                    t.status === 'Published' ? 'bg-primary/10 text-primary border border-primary/20' :
                    t.status === 'Draft' ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30' :
                    'bg-error/10 text-error border border-error/20'
                  }`}>{t.status}</span>
                  <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-bold uppercase tracking-widest text-text-secondary border border-outline-variant/30">{t.difficulty_level}</span>
                  {t.estimated_duration && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/20">
                      <span className="material-symbols-outlined text-[12px]">schedule</span> {t.estimated_duration}h
                    </span>
                  )}
                </div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface mb-1 truncate">{t.topic_title}</h3>
                <p className="font-body-md text-text-secondary text-sm truncate max-w-2xl">{t.topic_description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => navigate(`/admin/topics/${t.topic_id}/resources`)} className="w-10 h-10 rounded-full bg-white text-secondary shadow-sm border border-outline-variant/20 flex items-center justify-center hover:scale-110 transition-transform" title="Manage Resources">
                  <span className="material-symbols-outlined text-sm">attachment</span>
                </button>
                <button onClick={() => handleOpenModal(t)} className="w-10 h-10 rounded-full bg-white text-primary shadow-sm border border-outline-variant/20 flex items-center justify-center hover:scale-110 transition-transform" title="Edit Topic">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onClick={() => handleDelete(t.topic_id)} className="w-10 h-10 rounded-full bg-white text-error shadow-sm border border-outline-variant/20 flex items-center justify-center hover:scale-110 transition-transform" title="Delete Topic">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-cardFadeIn flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-8 py-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest shrink-0">
              <div>
                <h2 className="font-display-md text-2xl font-bold text-on-surface">{editingId ? 'Edit Topic' : 'Create New Topic'}</h2>
                <p className="text-sm text-text-secondary mt-1">{editingId ? 'Update your topic details' : 'Add a new topic to this course'}</p>
              </div>
              <button onClick={handleCloseModal} className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-outline-variant/30 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-on-surface">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar">
              {error && (
                <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span> {error}
                </div>
              )}
              <form id="topicForm" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                  <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Topic Title *</label>
                  <input type="text" name="topic_title" value={formData.topic_title} onChange={handleChange} required
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                    placeholder="E.g., Introduction to React" />
                </div>

                <div className="space-y-2">
                  <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Topic Description</label>
                  <textarea name="topic_description" value={formData.topic_description} onChange={handleChange} rows={2}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all custom-scrollbar resize-none font-medium"
                    placeholder="Brief overview of what this topic covers..."></textarea>
                </div>

                <div className="space-y-2">
                  <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Learning Objectives *</label>
                  <textarea name="learning_objectives" value={formData.learning_objectives} onChange={handleChange} required rows={3}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all custom-scrollbar resize-none font-medium"
                    placeholder="What will students learn in this topic?"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Difficulty</label>
                    <div className="relative">
                      <select name="difficulty_level" value={formData.difficulty_level} onChange={handleChange}
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium pr-10 cursor-pointer">
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">expand_more</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Est. Duration (hrs)</label>
                    <input type="number" step="0.1" min="0" name="estimated_duration" value={formData.estimated_duration} onChange={handleChange}
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                      placeholder="e.g. 1.5" />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Status</label>
                    <div className="relative">
                      <select name="status" value={formData.status} onChange={handleChange}
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium pr-10 cursor-pointer">
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                        <option value="Archived">Archived</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">expand_more</span>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-outline-variant/30 bg-surface-container-lowest shrink-0 flex justify-end gap-3">
              <button type="button" onClick={handleCloseModal} disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full font-bold text-sm text-text-secondary hover:bg-surface-container-high transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" form="topicForm" disabled={isSubmitting}
                className="px-8 py-2.5 rounded-full font-bold text-sm bg-primary text-white shadow-md shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2">
                {isSubmitting ? (
                  <><span className="material-symbols-outlined animate-spin text-sm">refresh</span> Saving...</>
                ) : (
                  editingId ? 'Save Changes' : 'Create Topic'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
