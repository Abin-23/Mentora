import { FormEvent, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    const expiresStr = params.get('expires');
    
    if (urlToken) {
      if (expiresStr) {
        const expiresTime = parseInt(expiresStr, 10);
        if (Date.now() > expiresTime) {
          setError('This password reset link has expired.');
          return;
        }
      }
      setToken(urlToken);
    } else {
      setError('Invalid or missing reset token.');
    }
  }, [location]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Missing reset token');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Reset failed');
      }

      navigate('/login?message=Password reset successful. Please sign in.');
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
        <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary/60">Account Security</span>
        <h1 className="font-display-xl text-5xl md:text-6xl leading-tight tracking-tight">
          Secure your <br className="hidden lg:block"/> digital presence.
        </h1>
      </div>

      <div className="bg-card-mint rounded-[32px] p-8 flex flex-col justify-between bento-card shadow-lg shadow-black/5 hover:-translate-y-2 transition-transform duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/40 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">security</span>
          </div>
          <span className="font-label-mono text-[10px] uppercase tracking-widest border border-black/10 bg-white/30 rounded-full px-3 py-1">
            Security Tips
          </span>
        </div>
        <div className="mt-4">
          <h3 className="font-headline-md text-xl font-bold mb-2">Create a strong password</h3>
          <p className="font-body-md text-sm opacity-80 leading-relaxed">Ensure your new password is at least 8 characters long and includes a mix of uppercase letters, numbers, and symbols to maximize security.</p>
        </div>
      </div>
    </>
  );

  return (
    <AuthLayout navLinkText="Sign In" navLinkTo="/login" leftContent={leftContent}>
      <div className="mb-10 text-center">
        <h2 className="font-headline-md text-3xl font-black tracking-tight text-primary mb-2">Reset Password</h2>
        <p className="font-label-mono text-[11px] text-text-secondary uppercase tracking-widest">Enter a new secure password</p>
      </div>

      {error && (
        <div className="w-full bg-error/10 border border-error/20 text-error p-4 rounded-2xl text-sm mb-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="space-y-2">
          <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">New Password</label>
          <div className="bg-surface-container-low rounded-2xl px-5 py-4 transition-all duration-200 border border-transparent focus-within:border-primary/20 hover:bg-surface-container flex items-center">
            <input 
              className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant p-0 outline-none" 
              placeholder="••••••••" 
              required 
              disabled={!token}
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
          <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Confirm New Password</label>
          <div className="bg-surface-container-low rounded-2xl px-5 py-4 transition-all duration-200 border border-transparent focus-within:border-primary/20 hover:bg-surface-container">
            <input 
              className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant p-0 outline-none" 
              placeholder="••••••••" 
              required 
              disabled={!token}
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        
        <div className="pt-4">
          <button 
            disabled={loading || !token}
            className="w-full bg-accent-neon text-primary font-headline-md text-[18px] py-4 rounded-full neon-glow active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:active:scale-100" 
            type="submit"
          >
            {loading ? 'Resetting...' : 'Save Password'}
            {!loading && <span className="material-symbols-outlined">save</span>}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
