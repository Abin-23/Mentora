import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import { useAuthUser } from '../hooks/useAuthUser';

interface ResourceData {
  resource_id: number;
  topic_id: number;
  resource_title: string;
  description: string;
  resource_type: string;
  resource_key: string;
  thumbnail_key: string;
  file_size: number;
  duration_seconds: number;
  sequence_number: number;
  is_preview: boolean;
  status: string;
}

export default function ManageTopicResources() {
  const currentUser = useAuthUser();
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    resource_title: '',
    description: '',
    resource_type: 'PDF',
    is_preview: false,
    status: 'Draft',
    link_url: '' // For LINK type
  });
  
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const resourcesRes = await fetch(`${API_URL}/topics/${topicId}/resources`, { headers });
      if (!resourcesRes.ok) throw new Error('Failed to fetch resources');
      const resourcesData = await resourcesRes.json();
      setResources(resourcesData);

      try {
        const topicRes = await fetch(`${API_URL}/topics/${topicId}`, { headers });
        if (topicRes.ok) {
          const topicData = await topicRes.json();
          setTopic(topicData);
        }
      } catch(e) {}
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (topicId) {
      fetchData();
    }
  }, [topicId]);

  const handleOpenModal = (resource?: ResourceData) => {
    if (resource) {
      setEditingId(resource.resource_id);
      setFormData({
        resource_title: resource.resource_title,
        description: resource.description || '',
        resource_type: resource.resource_type,
        is_preview: resource.is_preview,
        status: resource.status,
        link_url: resource.resource_type === 'LINK' ? resource.resource_key : ''
      });
    } else {
      setEditingId(null);
      setFormData({
        resource_title: '',
        description: '',
        resource_type: 'PDF',
        is_preview: false,
        status: 'Draft',
        link_url: ''
      });
    }
    setResourceFile(null);
    setThumbnailFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let res;
      if (editingId) {
        // Edit is JSON because we usually don't support file re-upload in standard simple edit.
        // If we want to re-upload, we'd use formData. For now, we'll keep it JSON to edit metadata.
        const payload = {
          resource_title: formData.resource_title,
          description: formData.description,
          status: formData.status,
          is_preview: formData.is_preview,
          link_url: formData.resource_type === 'LINK' ? formData.link_url : undefined
        };

        res = await fetch(`${API_URL}/resources/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create uses FormData to upload files
        const data = new FormData();
        data.append('resource_title', formData.resource_title);
        data.append('description', formData.description);
        data.append('resource_type', formData.resource_type);
        data.append('is_preview', formData.is_preview ? 'true' : 'false');
        data.append('status', formData.status);
        
        if (formData.resource_type === 'LINK') {
          data.append('link_url', formData.link_url);
        } else if (resourceFile) {
          data.append('resourceFile', resourceFile);
        } else {
          throw new Error('A file is required for this resource type.');
        }

        if (thumbnailFile) {
          data.append('thumbnailFile', thumbnailFile);
        }

        res = await fetch(`${API_URL}/topics/${topicId}/resources`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: data
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save resource');
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
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      const res = await fetch(`${API_URL}/resources/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete resource');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'An error occurred while deleting');
    }
  };

  const handleReorder = async (direction: 'up' | 'down', index: number) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === resources.length - 1) return;

    setIsReordering(true);
    
    const newResources = [...resources];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempSeq = newResources[index].sequence_number;
    newResources[index].sequence_number = newResources[swapIndex].sequence_number;
    newResources[swapIndex].sequence_number = tempSeq;

    const temp = newResources[index];
    newResources[index] = newResources[swapIndex];
    newResources[swapIndex] = temp;
    
    setResources(newResources);

    try {
      const res = await fetch(`${API_URL}/topics/${topicId}/resources/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resources: [
            { resource_id: newResources[index].resource_id, sequence_number: newResources[index].sequence_number },
            { resource_id: newResources[swapIndex].resource_id, sequence_number: newResources[swapIndex].sequence_number }
          ]
        })
      });

      if (!res.ok) throw new Error('Failed to reorder');
    } catch (err: any) {
      setError('Failed to reorder resources. Refreshing list.');
      fetchData();
    } finally {
      setIsReordering(false);
    }
  };

  if (!currentUser) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin text-primary material-symbols-outlined text-4xl">refresh</div></div>;
  }

  const getIconForType = (type: string) => {
    const icons: Record<string, string> = {
      'PDF': 'picture_as_pdf',
      'PPT': 'slideshow',
      'PPTX': 'slideshow',
      'DOC': 'description',
      'DOCX': 'description',
      'VIDEO': 'play_circle',
      'AUDIO': 'audiotrack',
      'IMAGE': 'image',
      'ZIP': 'folder_zip',
      'LINK': 'link'
    };
    return icons[type] || 'insert_drive_file';
  };

  return (
    <AdminLayout user={currentUser}>
      <section className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-lg shadow-black/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(topic ? `/admin/courses/${topic.course_id}/topics` : -1 as any)} className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-outline-variant/30 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <div>
            <h1 className="font-display-lg text-3xl font-bold text-on-surface leading-tight">
              Topic Resources
            </h1>
            <p className="font-body-md text-text-secondary text-sm opacity-80 mt-1">
              {topic ? `Topic: ${topic.topic_title}` : 'Manage learning resources.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center justify-center w-10 h-10 bg-white text-text-secondary rounded-full shadow-sm hover:bg-surface-container-low transition-colors">
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-full shadow-md shadow-primary/20 hover:scale-105 transition-transform">
            <span className="material-symbols-outlined">add</span>
            <span className="font-label-mono text-xs uppercase tracking-widest font-bold">Upload Resource</span>
          </button>
        </div>
      </section>

      {error && !isModalOpen && (
        <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      {loading && resources.length === 0 ? (
        <div className="py-12 text-center text-text-secondary">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="py-20 text-center bg-white/40 border border-white rounded-3xl backdrop-blur-md shadow-sm">
          <span className="material-symbols-outlined text-6xl text-text-secondary mb-4 opacity-50 block">attachment</span>
          <h3 className="font-bold text-xl mb-2 text-on-surface">No resources found</h3>
          <p className="text-text-secondary">Start uploading PDFs, videos, or links to build this topic.</p>
          <button onClick={() => handleOpenModal()} className="mt-6 bg-primary text-white px-6 py-2 rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">upload</span> Upload Resource
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {resources.map((r, index) => (
            <div key={r.resource_id} className="group relative bg-white/60 backdrop-blur-md border border-white shadow-lg shadow-black/5 rounded-2xl p-4 hover:shadow-xl transition-all duration-300 flex items-center gap-4">
              
              <div className="flex flex-col gap-1 items-center justify-center pr-4 border-r border-outline-variant/30">
                <button 
                  onClick={() => handleReorder('up', index)} 
                  disabled={index === 0 || isReordering}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${index === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-primary/10 text-text-secondary hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined">keyboard_arrow_up</span>
                </button>
                <button 
                  onClick={() => handleReorder('down', index)} 
                  disabled={index === resources.length - 1 || isReordering}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${index === resources.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-primary/10 text-text-secondary hover:text-primary'}`}
                >
                  <span className="material-symbols-outlined">keyboard_arrow_down</span>
                </button>
              </div>

              {/* Icon / Thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center border border-black/5 shrink-0 overflow-hidden relative">
                {r.thumbnail_key ? (
                  <img src={r.thumbnail_key} alt={r.resource_title} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-3xl text-primary/70">{getIconForType(r.resource_type)}</span>
                )}
                {r.is_preview && (
                  <div className="absolute top-0 right-0 bg-accent-neon text-black text-[8px] font-bold px-1 py-0.5 rounded-bl-lg z-10">FREE</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                    r.status === 'Published' ? 'bg-primary/10 text-primary border border-primary/20' :
                    r.status === 'Draft' ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30' :
                    'bg-error/10 text-error border border-error/20'
                  }`}>{r.status}</span>
                  <span className="px-2 py-0.5 bg-surface-container-high rounded text-[9px] font-bold uppercase tracking-widest text-text-secondary border border-outline-variant/30">
                    {r.resource_type}
                  </span>
                  {r.file_size ? (
                    <span className="text-[10px] text-text-secondary">{(r.file_size / 1024 / 1024).toFixed(2)} MB</span>
                  ) : null}
                </div>
                <h3 className="font-headline-md text-base font-bold text-on-surface mb-0.5 truncate">{r.resource_title}</h3>
                <p className="font-body-md text-text-secondary text-xs truncate max-w-xl">{r.description}</p>
              </div>

              <div className="flex items-center gap-2 ml-auto pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <a href={r.resource_key} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-white text-secondary shadow-sm border border-outline-variant/20 flex items-center justify-center hover:scale-110 transition-transform" title="View/Download">
                  <span className="material-symbols-outlined text-sm">download</span>
                </a>
                <button onClick={() => handleOpenModal(r)} className="w-9 h-9 rounded-full bg-white text-primary shadow-sm border border-outline-variant/20 flex items-center justify-center hover:scale-110 transition-transform" title="Edit Meta">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onClick={() => handleDelete(r.resource_id)} className="w-9 h-9 rounded-full bg-white text-error shadow-sm border border-outline-variant/20 flex items-center justify-center hover:scale-110 transition-transform" title="Delete">
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
            <div className="px-8 py-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest shrink-0">
              <div>
                <h2 className="font-display-md text-2xl font-bold text-on-surface">{editingId ? 'Edit Resource' : 'Upload Resource'}</h2>
                <p className="text-sm text-text-secondary mt-1">{editingId ? 'Update resource metadata' : 'Add a new file or link to this topic'}</p>
              </div>
              <button onClick={handleCloseModal} className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-outline-variant/30 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-on-surface">close</span>
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              {error && (
                <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span> {error}
                </div>
              )}
              <form id="resourceForm" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                  <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Title *</label>
                  <input type="text" name="resource_title" value={formData.resource_title} onChange={handleChange} required
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium" />
                </div>

                <div className="space-y-2">
                  <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={2}
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all custom-scrollbar resize-none font-medium"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Resource Type</label>
                    <div className="relative">
                      <select name="resource_type" value={formData.resource_type} onChange={handleChange} disabled={!!editingId}
                        className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium pr-10 disabled:opacity-50">
                        {['PDF', 'PPT', 'PPTX', 'DOC', 'DOCX', 'VIDEO', 'AUDIO', 'IMAGE', 'ZIP', 'LINK'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">expand_more</span>
                    </div>
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

                {!editingId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                    {formData.resource_type === 'LINK' ? (
                      <div className="space-y-2 md:col-span-2">
                        <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Link URL *</label>
                        <input type="url" name="link_url" value={formData.link_url} onChange={handleChange} required={!editingId}
                          className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface focus:outline-none focus:border-primary transition-all font-medium" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Upload File *</label>
                        <input type="file" required={!editingId} onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                          className="w-full block text-sm text-text-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Thumbnail (Optional)</label>
                      <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="w-full block text-sm text-text-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer" />
                    </div>
                  </div>
                )}
                
                {editingId && formData.resource_type === 'LINK' && (
                  <div className="space-y-2">
                    <label className="font-label-mono text-xs uppercase tracking-widest font-bold text-text-secondary ml-1">Link URL</label>
                    <input type="url" name="link_url" value={formData.link_url} onChange={handleChange}
                      className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl px-5 py-3 text-on-surface focus:outline-none focus:border-primary transition-all font-medium" />
                  </div>
                )}

                <div className="flex items-center gap-3 bg-accent-neon/10 p-4 rounded-xl border border-accent-neon/30">
                  <input type="checkbox" id="isPreview" name="is_preview" checked={formData.is_preview} onChange={handleChange} className="w-5 h-5 accent-primary rounded cursor-pointer" />
                  <label htmlFor="isPreview" className="font-bold text-sm text-on-surface cursor-pointer select-none">Allow Preview (Free Access)</label>
                </div>
              </form>
            </div>

            <div className="px-8 py-6 border-t border-outline-variant/30 bg-surface-container-lowest shrink-0 flex justify-end gap-3">
              <button type="button" onClick={handleCloseModal} disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full font-bold text-sm text-text-secondary hover:bg-surface-container-high transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" form="resourceForm" disabled={isSubmitting}
                className="px-8 py-2.5 rounded-full font-bold text-sm bg-primary text-white shadow-md shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2">
                {isSubmitting ? (
                  <><span className="material-symbols-outlined animate-spin text-sm">refresh</span> {editingId ? 'Saving...' : 'Uploading...'}</>
                ) : (
                  editingId ? 'Save Changes' : 'Upload Resource'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
