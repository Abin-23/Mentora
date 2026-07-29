import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      setMessage(data.message);
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
      <div className="fixed top-[10%] left-[20%] w-[300px] h-[300px] bg-card-lavender/50 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse"></div>
      <div className="fixed bottom-[10%] right-[20%] w-[400px] h-[400px] bg-accent-neon/30 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-10 pt-32 pb-24 flex-grow flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center">
          
          {/* Left Side: Bento Content Area */}
          <div className="md:col-span-7 flex flex-col gap-8 pr-0 md:pr-10">
            <div className="flex flex-col gap-4 mb-4">
              <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary/60">Account Recovery</span>
              <h1 className="font-display-xl text-5xl md:text-6xl leading-tight tracking-tight">
                Get back into <br className="hidden lg:block"/> your flow state.
              </h1>
            </div>

            <div className="bg-card-coral rounded-[32px] p-8 flex flex-col justify-between bento-card shadow-lg shadow-black/5 hover:-translate-y-2 transition-transform duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">lock_reset</span>
                </div>
                <span className="font-label-mono text-[10px] uppercase tracking-widest border border-black/10 bg-white/30 rounded-full px-3 py-1">
                  Recovery Info
                </span>
              </div>
              <div className="mt-4">
                <h3 className="font-headline-md text-xl font-bold mb-2">Secure Reset Process</h3>
                <p className="font-body-md text-sm opacity-80 leading-relaxed">Enter your email and we'll send you a secure link to reset your password. The link will remain active for 1 hour.</p>
              </div>
            </div>
          </div>

          {/* Right Side: Form Card */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-[40px] p-10 bento-card shadow-2xl shadow-black/5 border border-white/50 w-full relative overflow-hidden group">
              {/* Subtle background glow inside form */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-neon/10 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000"></div>

              <div className="mb-10 text-center">
                <h2 className="font-headline-md text-3xl font-black tracking-tight text-primary mb-2">Forgot Password</h2>
                <p className="font-label-mono text-[11px] text-text-secondary uppercase tracking-widest">Request a reset link</p>
              </div>

              {error && (
                <div className="w-full bg-error/10 border border-error/20 text-error p-4 rounded-2xl text-sm mb-6 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] mt-0.5">error</span>
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="w-full bg-[#E8FF66]/20 border border-[#E8FF66]/50 text-primary p-4 rounded-2xl text-sm mb-6 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] mt-0.5">check_circle</span>
                  <span>{message}</span>
                </div>
              )}
              
              {!message && (
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
                  
                  <div className="pt-4">
                    <button 
                      disabled={loading}
                      className="w-full bg-accent-neon text-primary font-headline-md text-[18px] py-4 rounded-full neon-glow active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:active:scale-100" 
                      type="submit"
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                      {!loading && <span className="material-symbols-outlined">send</span>}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-8 text-center">
                <Link to="/login" className="font-label-mono text-xs text-text-secondary hover:text-primary transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
