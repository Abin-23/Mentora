import { FormEvent, useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import disposableDomains from 'disposable-email-domains';
import AuthLayout from '../components/layout/AuthLayout';

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
  
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTip, setCurrentTip] = useState(TIPS[0]);

  useEffect(() => {
    // Pick a random tip on mount
    const randomIdx = Math.floor(Math.random() * TIPS.length);
    setCurrentTip(TIPS[randomIdx]);
  }, []);

  const handleFullNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFullName(val);
    if (val.trim().length > 0 && val.trim().length < 2) setFullNameError('Full name must be at least 2 characters long.');
    else if (/\d/.test(val)) setFullNameError('Full name cannot contain numbers.');
    else setFullNameError('');
  };
  
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    const domain = val.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) setEmailError('Disposable email addresses are not allowed.');
    else if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) setEmailError('Invalid email format.');
    else setEmailError('');
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (val && (val.length < 8 || !/[A-Z]/.test(val) || !/[a-z]/.test(val) || !/\d/.test(val) || !/[^A-Za-z0-9]/.test(val))) {
      setPasswordError('Must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol.');
    } else {
      setPasswordError('');
    }
    if (confirmPassword && val !== confirmPassword) setConfirmPasswordError('Passwords do not match.');
    else if (confirmPassword) setConfirmPasswordError('');
  };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (val && password !== val) setConfirmPasswordError('Passwords do not match.');
    else setConfirmPasswordError('');
  };

  const validateForm = () => {
    let isValid = true;
    
    if (fullName.trim().length < 2) {
      setFullNameError('Full name must be at least 2 characters long.');
      isValid = false;
    } else if (/\d/.test(fullName)) {
      setFullNameError('Full name cannot contain numbers.');
      isValid = false;
    } else {
      setFullNameError('');
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format.');
      isValid = false;
    } else if (domain && disposableDomains.includes(domain)) {
      setEmailError('Disposable email addresses are not allowed.');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setPasswordError('Must be at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
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

      navigate('/login', { replace: true });
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
    </>
  );

  return (
    <AuthLayout navLinkText="Sign In" navLinkTo="/login" leftContent={leftContent}>
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
          <div className={`bg-surface-container-low rounded-2xl px-5 py-4 transition-all duration-200 border ${fullNameError ? 'border-error/50 focus-within:border-error' : 'border-transparent focus-within:border-primary/20'} hover:bg-surface-container`}>
            <input 
              className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant p-0 outline-none" 
              placeholder="Jane Doe" 
              required 
              type="text"
              value={fullName}
              onChange={handleFullNameChange}
            />
          </div>
          {fullNameError && <p className="text-error text-xs mt-1 ml-2">{fullNameError}</p>}
        </div>

        <div className="space-y-2">
          <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Email Address</label>
          <div className={`bg-surface-container-low rounded-2xl px-5 py-4 transition-all duration-200 border ${emailError ? 'border-error/50 focus-within:border-error' : 'border-transparent focus-within:border-primary/20'} hover:bg-surface-container`}>
            <input 
              className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant p-0 outline-none" 
              placeholder="name@domain.com" 
              required 
              type="email"
              value={email}
              onChange={handleEmailChange}
            />
          </div>
          {emailError && <p className="text-error text-xs mt-1 ml-2">{emailError}</p>}
        </div>
        
        <div className="space-y-2">
          <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Password</label>
          <div className={`bg-surface-container-low rounded-2xl px-5 py-4 transition-all duration-200 border ${passwordError ? 'border-error/50 focus-within:border-error' : 'border-transparent focus-within:border-primary/20'} hover:bg-surface-container flex items-center`}>
            <input 
              className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant p-0 outline-none" 
              placeholder="••••••••" 
              required 
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
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
          {passwordError && <p className="text-error text-xs mt-1 ml-2">{passwordError}</p>}
        </div>

        <div className="space-y-2">
          <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Confirm Password</label>
          <div className={`bg-surface-container-low rounded-2xl px-5 py-4 transition-all duration-200 border ${confirmPasswordError ? 'border-error/50 focus-within:border-error' : 'border-transparent focus-within:border-primary/20'} hover:bg-surface-container`}>
            <input 
              className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant p-0 outline-none" 
              placeholder="••••••••" 
              required 
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
            />
          </div>
          {confirmPasswordError && <p className="text-error text-xs mt-1 ml-2">{confirmPasswordError}</p>}
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
    </AuthLayout>
  );
}
