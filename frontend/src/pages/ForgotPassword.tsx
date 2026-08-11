import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';

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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
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

  const leftContent = (
    <>
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
    </>
  );

  return (
    <AuthLayout navLinkText="Sign In" navLinkTo="/login" leftContent={leftContent}>
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
    </AuthLayout>
  );
}
