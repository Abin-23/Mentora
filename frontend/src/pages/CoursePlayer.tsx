import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import StudentLayout from '../components/layout/StudentLayout';

interface Resource {
  resource_id: number;
  resource_title: string;
  description: string | null;
  resource_type: string;
  resource_key: string;
  sequence_number: number;
}

interface Topic {
  topic_id: number;
  topic_title: string;
  topic_description: string;
  sequence_number: number;
  resources: Resource[];
}

interface CoursePlayerContent {
  course_id: number;
  title: string;
  topics: Topic[];
  course_admin?: { full_name: string };
}

export default function CoursePlayer() {
  const user = useAuthUser();
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CoursePlayerContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
  const [activeResource, setActiveResource] = useState<Resource | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`${API_URL}/courses/${courseSlug}/player`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 403) throw new Error('You must be enrolled to view this course');
          throw new Error('Course not found');
        }
        const data = await res.json();
        setCourse(data);
        
        // Auto-select first resource of first topic
        if (data.topics && data.topics.length > 0) {
          const firstTopic = data.topics[0];
          setActiveTopicId(firstTopic.topic_id);
          if (firstTopic.resources && firstTopic.resources.length > 0) {
            setActiveResource(firstTopic.resources[0]);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (courseSlug) fetchCourse();
  }, [courseSlug, API_URL, token]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'Video': return 'play_circle';
      case 'Document': return 'description';
      case 'Link': return 'link';
      default: return 'article';
    }
  };

  const renderResourceContent = (resource: Resource) => {
    if (resource.resource_type === 'Video') {
      if (resource.resource_key.includes('youtube') || resource.resource_key.includes('vimeo')) {
        // Embed for YouTube/Vimeo is complex, assume direct link or simplify for now
        return (
          <div className="aspect-video bg-black rounded-2xl flex items-center justify-center text-white">
             <div className="text-center p-8">
               <span className="material-symbols-outlined text-6xl mb-4 opacity-50">play_circle</span>
               <p>Video streaming is configured for URL: <a href={resource.resource_key} target="_blank" rel="noreferrer" className="text-accent-neon hover:underline break-all">{resource.resource_key}</a></p>
             </div>
          </div>
        );
      }
      return (
        <video controls className="w-full aspect-video rounded-2xl bg-black shadow-xl" src={resource.resource_key}>
          Your browser does not support the video tag.
        </video>
      );
    }
    
    if (resource.resource_type === 'Document') {
      return (
        <div className="p-10 bg-white rounded-2xl shadow-xl shadow-black/5 border border-outline-variant/30 text-center">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">picture_as_pdf</span>
          <h3 className="text-2xl font-bold mb-4">Document Resource</h3>
          <p className="text-text-secondary mb-8">{resource.description || 'View the attached document to continue learning.'}</p>
          <a href={resource.resource_key} target="_blank" rel="noreferrer" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all inline-block">
            Open Document
          </a>
        </div>
      );
    }

    if (resource.resource_type === 'Link') {
      return (
        <div className="p-10 bg-white rounded-2xl shadow-xl shadow-black/5 border border-outline-variant/30 text-center">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">link</span>
          <h3 className="text-2xl font-bold mb-4">External Resource</h3>
          <p className="text-text-secondary mb-8">{resource.description || 'This topic references an external link.'}</p>
          <a href={resource.resource_key} target="_blank" rel="noreferrer" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all inline-block">
            Visit Link
          </a>
        </div>
      );
    }

    return (
      <div className="p-10 bg-white rounded-2xl shadow-xl shadow-black/5 border border-outline-variant/30">
        <h3 className="text-2xl font-bold mb-4">Content</h3>
        <p className="text-text-secondary">{resource.description || 'No additional details available.'}</p>
      </div>
    );
  };

  if (!user) return null;

  return (
    <StudentLayout user={user}>
      {loading ? (
        <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>
      ) : error ? (
        <div className="text-error bg-error/10 p-4 rounded-xl max-w-2xl mx-auto mt-10">
          <div className="flex items-center gap-2 font-bold mb-2"><span className="material-symbols-outlined">block</span> Access Denied</div>
          {error}
          <div className="mt-4">
            <button onClick={() => navigate(-1)} className="bg-white/50 text-error px-4 py-2 rounded-lg font-medium text-sm">Go Back</button>
          </div>
        </div>
      ) : course ? (
        <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 -mx-4 md:mx-0 px-4 md:px-0 pb-6 overflow-hidden">
          {/* Main Viewer Area */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
            <button onClick={() => navigate('/my-learning')} className="flex items-center text-text-secondary hover:text-primary mb-4 transition-colors font-bold text-sm shrink-0">
              <span className="material-symbols-outlined mr-1">arrow_back</span> Back to My Learning
            </button>
            <h1 className="font-display-md text-2xl md:text-3xl tracking-tight leading-tight mb-6 shrink-0">{course.title}</h1>
            
            {activeResource ? (
              <div className="flex flex-col gap-6">
                {renderResourceContent(activeResource)}
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 shrink-0">
                  <h2 className="font-bold text-xl mb-2">{activeResource.resource_title}</h2>
                  {activeResource.description && (
                    <p className="text-text-secondary leading-relaxed">{activeResource.description}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-text-secondary p-10 text-center">
                <div>
                  <span className="material-symbols-outlined text-6xl mb-4 opacity-50">menu_book</span>
                  <p className="text-lg">Select a topic and resource from the sidebar to start learning.</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Topics Sidebar */}
          <div className="lg:w-96 shrink-0 h-full flex flex-col bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-lg shadow-black/5">
            <div className="p-6 border-b border-outline-variant/30 shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">format_list_bulleted</span> Course Content
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {course.topics.length === 0 ? (
                <div className="p-6 text-center text-text-secondary text-sm">
                  No content available for this course yet.
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/30">
                  {course.topics.map((topic, index) => (
                    <div key={topic.topic_id} className="bg-white">
                      <button 
                        onClick={() => setActiveTopicId(activeTopicId === topic.topic_id ? null : topic.topic_id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest transition-colors text-left"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-primary font-bold text-sm mt-0.5 shrink-0">{(index + 1).toString().padStart(2, '0')}</span>
                          <div>
                            <h4 className={`font-bold text-sm ${activeTopicId === topic.topic_id ? 'text-primary' : 'text-on-surface'}`}>{topic.topic_title}</h4>
                            <span className="text-[10px] text-text-secondary uppercase tracking-widest">{topic.resources.length} items</span>
                          </div>
                        </div>
                        <span className={`material-symbols-outlined text-text-secondary transition-transform duration-300 ${activeTopicId === topic.topic_id ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>
                      
                      {activeTopicId === topic.topic_id && (
                        <div className="bg-surface-container-lowest/50 border-t border-outline-variant/10 p-2">
                          {topic.resources.length === 0 ? (
                            <div className="text-xs text-text-secondary p-2 italic pl-10">No resources available</div>
                          ) : (
                            <ul className="space-y-1">
                              {topic.resources.map(res => {
                                const isActive = activeResource?.resource_id === res.resource_id;
                                return (
                                  <li key={res.resource_id}>
                                    <button 
                                      onClick={() => setActiveResource(res)}
                                      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-white text-text-secondary hover:text-on-surface'}`}
                                    >
                                      <span className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${isActive ? 'text-primary' : 'opacity-60'}`}>
                                        {getResourceIcon(res.resource_type)}
                                      </span>
                                      <div>
                                        <div className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{res.resource_title}</div>
                                        <div className="text-[10px] uppercase tracking-widest opacity-70 mt-1">{res.resource_type}</div>
                                      </div>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </StudentLayout>
  );
}
