import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import disposableDomains from 'disposable-email-domains';

const TIPS = [
  {
    title: "AI Adaptation",
    content: "Mentora analyzes your reading speed and quiz accuracy to adjust the difficulty of upcoming modules in real-time.",
    icon: "psychology"
  },
  {
    title: "Micro-learning",
    content: "Breaking down complex topics into 15-minute chunks increases knowledge retention by up to 30%.",
    icon: "timer"
  },
  {
    title: "Active Recall",
    content: "Our AI Mentor will periodically quiz you on past topics to solidify your long-term memory structures.",
    icon: "replay"
  },
  {
    title: "Community Power",
    content: "Students who participate in community discussions are 4x more likely to complete their advanced certifications.",
    icon: "forum"
  }
];

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTip, setCurrentTip] = useState(TIPS[0]);

  useEffect(() => {
    // Pick a random tip on mount
    const randomIdx = Math.floor(Math.random() * TIPS.length);
    setCurrentTip(TIPS[randomIdx]);
  }, []);

  const validateForm = () => {
    if (fullName.trim().length < 2) {
      return 'Full name must be at least 2 characters long.';
    }
    
    if (/\d/.test(fullName)) {
      return 'Full name cannot contain numbers.';
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) {
      return 'Disposable email addresses are not allowed.';
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return 'Password must be at least 8 characters and contain at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMessage = Array.isArray(data.message) 
          ? data.message[0] 
          : data.message || 'Registration failed';
        throw new Error(errorMessage);
      }

      navigate('/login');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav h-16 flex items-center justify-between px-10">
        <Link to="/" className="font-headline-md text-headline-md font-black text-primary hover:opacity-80 transition-opacity">Mentora</Link>
        <div className="flex items-center gap-4">
          <Link className="font-label-mono text-label-mono px-4 py-2 hover:opacity-70 transition-all text-primary" to="/login">Sign In</Link>
        </div>
      </nav>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none dot-grid z-0"></div>
      
      {/* Abstract Glowing Orbs */}
      <div className="fixed top-[15%] right-[20%] w-[350px] h-[350px] bg-card-mint/60 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse"></div>
      <div className="fixed bottom-[10%] left-[20%] w-[400px] h-[400px] bg-accent-neon/20 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-10 pt-32 pb-24 flex-grow flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center">
          
          {/* Left Side: Bento Content Area */}
          <div className="md:col-span-7 flex flex-col gap-8 pr-0 md:pr-10">
            <div className="flex flex-col gap-4 mb-4">
              <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary/60">Initialize Identity</span>
              <h1 className="font-display-xl text-5xl md:text-6xl leading-tight tracking-tight">
                Join the disruption <br className="hidden lg:block"/> of education.
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 auto-rows-[200px]">
              {/* Coral Dynamic Tip Card */}
              <div className="bg-card-coral rounded-[32px] p-8 flex flex-col justify-between bento-card shadow-lg shadow-black/5 hover:-translate-y-2 transition-transform duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">{currentTip.icon}</span>
                  </div>
                  <span className="font-label-mono text-[10px] uppercase tracking-widest border border-black/10 bg-white/30 rounded-full px-3 py-1">
                    System Tip
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-md text-xl font-bold mb-2">{currentTip.title}</h3>
                  <p className="font-body-md text-sm opacity-80 leading-relaxed">{currentTip.content}</p>
                </div>
              </div>

              {/* Mint Stats Card */}
              <div className="bg-card-mint rounded-[32px] p-8 flex flex-col justify-center text-center bento-card shadow-lg shadow-black/5 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                </div>
                <div className="font-display-xl text-5xl mb-1">+2k</div>
                <p className="font-label-mono text-[11px] uppercase tracking-widest text-primary/70">Top-Tier Students</p>
              </div>
            </div>
          </div>

          {/* Right Side: Form Card */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-[40px] p-10 bento-card shadow-2xl shadow-black/5 border border-white/50 w-full relative overflow-hidden group">
              {/* Subtle background glow inside form */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-neon/10 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000"></div>

              <div className="mb-10 text-center">
                <h2 className="font-headline-md text-3xl font-black tracking-tight text-primary mb-2">Create ID</h2>
                <p className="font-label-mono text-[11px] text-text-secondary uppercase tracking-widest">Start your journey</p>
              </div>

              {error && (
                <div className="w-full bg-error/10 border border-error/20 text-error p-4 rounded-2xl text-sm mb-6 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] mt-0.5">error</span>
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="w-full space-y-5">
                <div className="space-y-2">
                  <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Full Name</label>
                  <div className="bg-surface-container-low rounded-2xl px-5 py-4 transition-all duration-200 border border-transparent focus-within:border-primary/20 hover:bg-surface-container">
                    <input 
                      className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant p-0 outline-none" 
                      placeholder="Jane Doe" 
                      required 
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

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
                  <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Password</label>
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

                <div className="space-y-2">
                  <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Confirm Password</label>
                  <div className="bg-surface-container-low rounded-2xl px-5 py-4 transition-all duration-200 border border-transparent focus-within:border-primary/20 hover:bg-surface-container">
                    <input 
                      className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant p-0 outline-none" 
                      placeholder="••••••••" 
                      required 
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    disabled={loading}
                    className="w-full bg-accent-neon text-primary font-headline-md text-[18px] py-4 rounded-full neon-glow active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:active:scale-100" 
                    type="submit"
                  >
                    {loading ? 'Creating Account...' : 'Initialize ID'}
                    {!loading && <span className="material-symbols-outlined">person_add</span>}
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
