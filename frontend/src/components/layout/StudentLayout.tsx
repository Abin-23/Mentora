import { ReactNode, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface StudentLayoutProps {
  children: ReactNode;
  user: {
    user_id?: number;
    email: string;
    full_name?: string;
    role?: string;
    profile_image?: string;
  };
}

export default function StudentLayout({ children, user }: StudentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/courses');
    }
  };

  const isDashboardActive = location.pathname === '/dashboard';
  const isMyLearningActive = location.pathname === '/my-learning';
  const isCoursesActive = location.pathname.startsWith('/courses');
  const isAIMentorActive = location.pathname === '/ai-mentor';
  const isProgressActive = location.pathname === '/progress' || location.pathname.includes('/progress');
  const isProfileActive = location.pathname === '/profile';

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Anchor (Fixed) */}
      <aside className={`fixed left-0 top-0 h-full w-[280px] bg-white/70 backdrop-blur-xl border-r border-black/5 shadow-xl flex flex-col py-10 px-6 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-12">
          <Link to="/dashboard" className="block">
            <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">Mentora OS</h1>
            <p className="font-label-mono text-label-mono text-text-secondary uppercase tracking-widest mt-1">Adaptive Learning</p>
          </Link>
        </div>
        
        <nav className="flex-grow space-y-2.5">
          <Link to="/dashboard" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isDashboardActive ? 'text-primary font-bold bg-primary/10 border-l-4 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-black/5'}`}>
            <span className={`material-symbols-outlined text-[20px] ${isDashboardActive ? 'text-primary' : ''}`}>dashboard</span>
            <span className="font-label-mono text-label-mono">Dashboard</span>
          </Link>
          <Link to="/my-learning" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isMyLearningActive ? 'text-primary font-bold bg-primary/10 border-l-4 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-black/5'}`}>
            <span className={`material-symbols-outlined text-[20px] ${isMyLearningActive ? 'text-primary' : ''}`}>school</span>
            <span className="font-label-mono text-label-mono">My Learning</span>
          </Link>
          <Link to="/courses" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isCoursesActive ? 'text-primary font-bold bg-primary/10 border-l-4 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-black/5'}`}>
            <span className={`material-symbols-outlined text-[20px] ${isCoursesActive ? 'text-primary' : ''}`}>local_library</span>
            <span className="font-label-mono text-label-mono">Courses</span>
          </Link>
          <Link to="/ai-mentor" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isAIMentorActive ? 'text-primary font-bold bg-primary/10 border-l-4 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-black/5'}`}>
            <span className={`material-symbols-outlined text-[20px] ${isAIMentorActive ? 'text-primary' : ''}`}>psychology</span>
            <span className="font-label-mono text-label-mono">AI Mentor</span>
          </Link>
          <Link to="/progress" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isProgressActive ? 'text-primary font-bold bg-primary/10 border-l-4 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-black/5'}`}>
            <span className={`material-symbols-outlined text-[20px] ${isProgressActive ? 'text-primary' : ''}`}>insights</span>
            <span className="font-label-mono text-label-mono">Progress</span>
          </Link>
          <Link to="/profile" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isProfileActive ? 'text-primary font-bold bg-primary/10 border-l-4 border-primary' : 'text-on-surface-variant hover:text-primary hover:bg-black/5'}`}>
            <span className={`material-symbols-outlined text-[20px] ${isProfileActive ? 'text-primary' : ''}`}>person</span>
            <span className="font-label-mono text-label-mono">Profile</span>
          </Link>
        </nav>
        
        <div className="mt-auto space-y-4">
          {/* Dynamic Active Learning Status Widget */}
          <div className="p-4 bg-white/80 rounded-2xl border border-black/5 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="font-label-mono text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Active Session</p>
            </div>
            <p className="font-headline-md text-xs font-bold text-primary truncate">
              {user.full_name || user.email.split('@')[0]}
            </p>
            <p className="font-label-mono text-[10px] text-text-secondary uppercase tracking-wider">
              {user.role || 'Student'}
            </p>
            <Link 
              to="/ai-mentor" 
              className="mt-3 w-full bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>Ask AI Mentor</span>
            </Link>
          </div>

          <div className="space-y-1 pt-2 border-t border-black/5">
            <a 
              href="mailto:support@mentora.com?subject=Mentora%20Student%20Support" 
              className="flex items-center space-x-3 text-on-surface-variant hover:text-primary pl-4 py-2 rounded-xl hover:bg-black/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
              <span className="font-label-mono text-label-mono">Help & Support</span>
            </a>
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center space-x-3 text-on-surface-variant hover:text-error pl-4 py-2 rounded-xl hover:bg-error/5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="font-label-mono text-label-mono">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport Shell */}
      <main className="md:ml-[280px] min-h-screen relative p-6 md:p-10 transition-all duration-300 w-full md:w-auto">
        
        {/* Top Navigation */}
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-280px)] h-20 flex justify-between items-center px-6 md:px-10 bg-background/80 backdrop-blur-md z-30 border-b border-black/5 transition-all duration-300">
          <div className="flex items-center space-x-4 md:space-x-8">
            <button 
              className="md:hidden flex items-center justify-center p-2 rounded-xl bg-white/60 border border-outline-variant hover:bg-white shadow-sm text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <Link to="/dashboard" className="font-headline-md text-xl md:text-headline-md font-black text-primary">
              Mentora
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                className={`font-label-mono text-xs uppercase tracking-wider transition-colors ${isCoursesActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary'}`} 
                to="/courses"
              >
                Courses
              </Link>
              <Link 
                className={`font-label-mono text-xs uppercase tracking-wider transition-colors ${isMyLearningActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary'}`} 
                to="/my-learning"
              >
                My Learning
              </Link>
              <Link 
                className={`font-label-mono text-xs uppercase tracking-wider transition-colors ${isAIMentorActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary'}`} 
                to="/ai-mentor"
              >
                AI Mentor
              </Link>
              <Link 
                className={`font-label-mono text-xs uppercase tracking-wider transition-colors ${isProgressActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary'}`} 
                to="/progress"
              >
                Progress
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-6">
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/80 border border-black/5 rounded-full px-5 py-2 pr-10 text-xs w-60 focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all shadow-sm" 
                placeholder="Search catalog..." 
                type="text"
              />
              <button type="submit" className="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant hover:text-primary transition-colors text-[18px] cursor-pointer">
                search
              </button>
            </form>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold font-label-mono text-primary truncate max-w-[140px]">
                  {user.full_name || user.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-text-secondary font-label-mono uppercase tracking-wider">
                  {user.role || 'Student'}
                </p>
              </div>
              <Link 
                to="/profile" 
                className="w-10 h-10 rounded-full border-2 border-accent-neon bg-primary flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
              >
                {user.profile_image ? (
                  <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user.full_name || user.email).charAt(0).toUpperCase()
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="mt-24 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

