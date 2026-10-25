import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import StudentLayout from '../components/layout/StudentLayout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AIMentorPage() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await fetch(`${API_URL}/enrollments/my-learning`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEnrollments(data);
          if (data.length > 0) {
            setSelectedCourse(data[0].course);
          }
        }
      } catch (err) {
        console.error("Failed to fetch enrollments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [API_URL, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !selectedCourse) return;
    
    const userMsg = query.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setQuery('');
    setSending(true);

    try {
      const res = await fetch(`${API_URL}/adaptive-learning/students/${user.user_id}/courses/${selectedCourse.course_id}/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: userMsg })
      });

      if (!res.ok) throw new Error('Tutor service unavailable.');
      
      const data = await res.json();
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: data.reply || data.answer || 'No response provided.', 
        sources: data.sources,
        keyPoints: data.keyPoints,
        example: data.example,
        practicePrompt: data.practicePrompt,
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <StudentLayout user={user}>
      <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-outline-variant/30 bg-surface-container-lowest shrink-0">
          <div>
            <h1 className="font-display-md text-2xl font-black text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary">psychology</span>
              Global AI Mentor
            </h1>
            <p className="text-text-secondary text-sm mt-1">Select a course to contextually chat with your AI Tutor.</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-3 w-full md:w-auto">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="px-3 py-2 text-xs font-semibold text-text-secondary hover:text-red-600 rounded-xl hover:bg-surface-container-high transition-colors flex items-center gap-1 border border-outline-variant/30"
                title="Clear chat messages"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Clear Chat</span>
              </button>
            )}

            <div className="relative w-full md:w-64 shrink-0">
              {enrollments.length > 0 ? (
                <select 
                  className="w-full appearance-none bg-surface border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-primary pr-10"
                  value={selectedCourse?.course_id || ''}
                  onChange={(e) => setSelectedCourse(enrollments.find(enr => enr.course.course_id === parseInt(e.target.value))?.course)}
                >
                  {enrollments.map(enr => (
                    <option key={enr.course.course_id} value={enr.course.course_id}>{enr.course.title}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-text-secondary italic">No courses enrolled</div>
              )}
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-text-secondary pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface/30 custom-scrollbar relative">
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
               <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
             </div>
          ) : enrollments.length === 0 ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
               <span className="material-symbols-outlined text-6xl text-text-secondary opacity-30 mb-4">school</span>
               <h3 className="font-bold text-xl mb-2">You aren't enrolled in any courses</h3>
               <p className="text-text-secondary mb-4">Enroll in a course first to start chatting with the AI Mentor.</p>
               <button onClick={() => navigate('/courses')} className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:opacity-90">Browse Courses</button>
             </div>
          ) : messages.length === 0 ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 opacity-60">
               <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">forum</span>
               <h3 className="font-bold text-xl mb-2">Mentora AI</h3>
               <p className="text-text-secondary max-w-sm">I'm your dedicated AI tutor for <strong>{selectedCourse?.title}</strong>. Ask me anything about the course materials, or request a practice question!</p>
             </div>
          ) : (
            <div className="flex flex-col gap-4 max-w-4xl mx-auto">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
                  {msg.sender === 'user' ? (
                    /* User Question Bubble - High Contrast White Text */
                    <div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-xs shadow-sm">
                      <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-white">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    /* AI Mentor Response Card */
                    <div className="flex flex-col gap-1 w-full animate-fade-in-up">
                      <div className="flex items-center gap-2 mb-1 pl-1">
                        <div className="w-5 h-5 rounded-md bg-accent-neon/20 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[13px]">psychology</span>
                        </div>
                        <span className="text-[11px] uppercase tracking-wider font-bold text-text-secondary">AI Mentor</span>
                      </div>
                      
                      <div className="p-5 rounded-2xl rounded-tl-xs bg-white border border-outline-variant/30 text-on-surface shadow-sm flex flex-col gap-3">
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-primary">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                        </div>

                        {msg.keyPoints && msg.keyPoints.length > 0 && (
                          <div className="pt-3 border-t border-outline-variant/20">
                            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">checklist</span> Key Points
                            </p>
                            <ul className="list-disc pl-4 text-xs text-text-secondary space-y-1">
                              {msg.keyPoints.map((kp: string, i: number) => (
                                <li key={i}>{kp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {msg.example && (
                          <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                            <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">lightbulb</span> Example
                            </p>
                            <p className="text-xs italic text-on-surface/90">{msg.example}</p>
                          </div>
                        )}

                        {msg.practicePrompt && (
                          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
                            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">psychology</span> Practice Prompt
                            </p>
                            <p className="text-xs text-on-surface">{msg.practicePrompt}</p>
                          </div>
                        )}

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="pt-3 border-t border-outline-variant/20">
                            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest flex items-center gap-1 mb-1.5">
                              <span className="material-symbols-outlined text-[13px]">menu_book</span> Sources:
                            </span>
                            <ul className="flex flex-wrap gap-1.5">
                              {msg.sources.map((s: any, i: number) => (
                                <li key={i} className="text-[11px] bg-surface-container-low border border-outline-variant/20 px-2.5 py-1 rounded-lg text-text-secondary font-medium">
                                  {s.resourceName} (p. {s.pageNumber})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {sending && (
                <div className="self-start max-w-[85%] flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1 pl-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">AI Mentor</span>
                  </div>
                  <div className="bg-white border border-outline-variant/30 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    <span className="text-sm text-text-secondary animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-outline-variant/30 shrink-0">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              placeholder={enrollments.length > 0 ? `Ask about ${selectedCourse?.title}...` : "Enroll in a course first..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={sending || enrollments.length === 0}
              className="w-full pl-6 pr-14 py-4 bg-surface-container-lowest border border-outline-variant/50 rounded-full text-sm font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
            />
            <button 
              type="submit" 
              disabled={!query.trim() || sending || enrollments.length === 0}
              className="absolute right-2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
}
