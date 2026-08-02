import { useEffect, FormEvent, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const QUOTES = [
  {
    quote: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
    topic: "MINDSET"
  },
  {
    quote: "Anyone who stops learning is old, whether at twenty or eighty. Anyone who keeps learning stays young.",
    author: "Henry Ford",
    topic: "GROWTH"
  },
  {
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
    topic: "LIFELONG LEARNING"
  },
  {
    quote: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
    topic: "EMPOWERMENT"
  }
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(QUOTES[0]);

  useEffect(() => {
    // Pick a random quote on mount
    const randomIdx = Math.floor(Math.random() * QUOTES.length);
    setCurrentQuote(QUOTES[randomIdx]);
  }, []);

  useEffect(() => {
    // Check for OAuth token in URL
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const authError = params.get('error');
    if (token) {
      localStorage.setItem('access_token', token);
      navigate('/dashboard');
    } else if (authError) {
      setError(decodeURIComponent(authError));
    }
  }, [location, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('access_token', data.access_token);
      navigate('/dashboard');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleGithubLogin = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${API_URL}/auth/github`;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav h-16 flex items-center justify-between px-10">
        <Link to="/" className="font-headline-md text-headline-md font-black text-primary hover:opacity-80 transition-opacity">Mentora</Link>
        <div className="flex items-center gap-4">
          <Link className="font-label-mono text-label-mono px-4 py-2 hover:opacity-70 transition-all text-primary" to="/register">Create Account</Link>
        </div>
      </nav>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none dot-grid z-0"></div>
      
      {/* Abstract Glowing Orbs */}
      <div className="fixed top-[10%] left-[20%] w-[300px] h-[300px] bg-card-lavender/50 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse"></div>
      <div className="fixed bottom-[10%] right-[20%] w-[400px] h-[400px] bg-accent-neon/30 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-10 pt-32 pb-24 flex-grow flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center">
          
          {/* Left Side: Bento Content Area */}
          <div className="md:col-span-7 flex flex-col gap-8 pr-0 md:pr-10">
            <div className="flex flex-col gap-4 mb-4">
              <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary/60">Authentication</span>
              <h1 className="font-display-xl text-5xl md:text-6xl leading-tight tracking-tight">
                Welcome back to your <br className="hidden lg:block"/> adaptive ecosystem.
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 auto-rows-[200px]">
              {/* Lavender Quote Card */}
              <div className="bg-card-lavender rounded-[32px] p-8 flex flex-col justify-between bento-card shadow-lg shadow-black/5 hover:-translate-y-2 transition-transform duration-300">
                <div className="flex justify-between items-start">
                  <span className="font-label-mono text-[10px] uppercase tracking-widest border border-black/10 bg-white/30 rounded-full px-3 py-1">
                    {currentQuote.topic}
                  </span>
                  <span className="material-symbols-outlined text-primary/50">format_quote</span>
                </div>
                <div>
                  <p className="font-headline-md text-lg leading-tight mb-4">"{currentQuote.quote}"</p>
                  <p className="font-label-mono text-xs font-bold text-primary/70">— {currentQuote.author}</p>
                </div>
              </div>

              {/* Mint Stats Card */}
              <div className="bg-card-mint rounded-[32px] p-8 flex flex-col justify-center text-center bento-card shadow-lg shadow-black/5 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
                <div className="font-display-xl text-5xl mb-1">94%</div>
                <p className="font-label-mono text-[11px] uppercase tracking-widest text-primary/70">Knowledge Retention</p>
              </div>
            </div>
          </div>

          {/* Right Side: Form Card */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-[40px] p-10 bento-card shadow-2xl shadow-black/5 border border-white/50 w-full relative overflow-hidden group">
              {/* Subtle background glow inside form */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-neon/10 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000"></div>

              <div className="mb-10 text-center">
                <h2 className="font-headline-md text-3xl font-black tracking-tight text-primary mb-2">Sign In</h2>
                <p className="font-label-mono text-[11px] text-text-secondary uppercase tracking-widest">Access your dashboard</p>
              </div>

              {error && (
                <div className="w-full bg-error/10 border border-error/20 text-error p-4 rounded-2xl text-sm mb-6 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] mt-0.5">error</span>
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div className="space-y-2">
                  <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Email Address</label>
                  <div className="bg-surface-container-low rounded-2xl px-5 py-4 transition-all duration-200 border border-transparent focus-within:border-primary/20 hover:bg-surface-container">
                    <input 
                      className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant p-0 outline-none" 
                      placeholder="name@domain.com" 
                      required 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Password</label>
                    <Link className="font-label-mono text-[10px] text-text-secondary hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-0.5" to="/forgot-password">Forgot?</Link>
                  </div>
                  <div className="bg-surface-container-low rounded-2xl px-5 py-4 transition-all duration-200 border border-transparent focus-within:border-primary/20 hover:bg-surface-container flex items-center">
                    <input 
                      className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant p-0 outline-none" 
                      placeholder="••••••••" 
                      required 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      className="text-on-surface-variant hover:text-primary ml-2 cursor-pointer transition-colors flex-shrink-0" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className="w-full bg-accent-neon text-primary font-headline-md text-[18px] py-4 rounded-full neon-glow active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:active:scale-100" 
                    type="submit"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                    {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                  </button>
                </div>
                
                <div className="relative py-4 flex items-center">
                  <div className="flex-grow border-t border-surface-container-highest"></div>
                  <span className="flex-shrink mx-4 font-label-mono text-[10px] text-outline-variant">OR CONTINUE WITH</span>
                  <div className="flex-grow border-t border-surface-container-highest"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-3 py-3 border-[1.5px] border-outline-variant/60 rounded-full hover:bg-surface-container-low hover:border-primary transition-all cursor-pointer" 
                    type="button"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                    <span className="font-label-mono text-[11px] font-bold">Google</span>
                  </button>
                  <button 
                    onClick={handleGithubLogin}
                    className="flex items-center justify-center gap-3 py-3 border-[1.5px] border-outline-variant/60 rounded-full hover:bg-surface-container-low hover:border-primary transition-all cursor-pointer" 
                    type="button"
                  >
                    <svg className="w-5 h-5 text-on-surface" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                    <span className="font-label-mono text-[11px] font-bold">GitHub</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
