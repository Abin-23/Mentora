import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthUser } from '../hooks/useAuthUser';
import StudentLayout from '../components/layout/StudentLayout';

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
    
    const userMsg = query;
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
      setMessages(prev => [...prev, { sender: 'ai', text: data.reply || data.answer, sources: data.sources }]);
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
          
          <div className="mt-4 md:mt-0 relative w-full md:w-64 shrink-0">
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
                  {msg.sender === 'ai' && (
                    <div className="flex items-center gap-2 mb-1 pl-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">AI Mentor</span>
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white rounded-tr-sm shadow-sm' : 'bg-white border border-outline-variant/30 text-on-surface rounded-tl-sm shadow-sm'}`}>
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-outline-variant/20">
                        <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Sources:</span>
                        <ul className="mt-1 flex flex-wrap gap-2">
                          {msg.sources.map((s: any, i: number) => (
                            <li key={i} className="text-xs bg-surface-container-low px-2 py-1 rounded-md text-text-secondary">
                              {s.resourceName} (p. {s.pageNumber})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
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
