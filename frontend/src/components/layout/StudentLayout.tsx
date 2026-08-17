import { ReactNode, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface StudentLayoutProps {
  children: ReactNode;
  user: {
    email: string;
    role?: string;
    profile_image?: string;
  };
}

export default function StudentLayout({ children, user }: StudentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

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
      <aside className={`fixed left-0 top-0 h-full w-[280px] bg-white/40 backdrop-blur-xl border-r border-white/20 shadow-xl flex flex-col py-10 px-6 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-12">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Mentora OS</h1>
          <p className="font-label-mono text-label-mono text-text-secondary uppercase tracking-widest mt-1">Premium Learning</p>
        </div>
        
        <nav className="flex-grow space-y-4">
          <Link to="/dashboard" className={`flex items-center space-x-3 pl-4 py-2 transition-colors duration-200 ${location.pathname === '/dashboard' ? 'text-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className={`material-symbols-outlined ${location.pathname === '/dashboard' ? 'text-primary' : ''}`}>dashboard</span>
            <span className="font-label-mono text-label-mono">Dashboard</span>
          </Link>
          <Link to="/my-learning" className={`flex items-center space-x-3 pl-4 py-2 transition-colors duration-200 ${location.pathname === '/my-learning' ? 'text-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className={`material-symbols-outlined ${location.pathname === '/my-learning' ? 'text-primary' : ''}`}>school</span>
            <span className="font-label-mono text-label-mono">My Learning</span>
          </Link>
          <Link to="/courses" className={`flex items-center space-x-3 pl-4 py-2 transition-colors duration-200 ${location.pathname === '/courses' ? 'text-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className={`material-symbols-outlined ${location.pathname === '/courses' ? 'text-primary' : ''}`}>local_library</span>
            <span className="font-label-mono text-label-mono">Courses</span>
          </Link>
          <Link to="#" className="flex items-center space-x-3 text-on-surface-variant hover:text-primary pl-4 py-2 transition-colors duration-200">
            <span className="material-symbols-outlined">psychology</span>
            <span className="font-label-mono text-label-mono">AI Mentor</span>
          </Link>
          <Link to="#" className="flex items-center space-x-3 text-on-surface-variant hover:text-primary pl-4 py-2 transition-colors duration-200">
            <span className="material-symbols-outlined">insights</span>
            <span className="font-label-mono text-label-mono">Progress</span>
          </Link>
          <Link to="/profile" className={`flex items-center space-x-3 pl-4 py-2 transition-colors duration-200 ${location.pathname === '/profile' ? 'text-primary font-bold border-l-4 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className={`material-symbols-outlined ${location.pathname === '/profile' ? 'text-primary' : ''}`}>person</span>
            <span className="font-label-mono text-label-mono">Profile</span>
          </Link>
        </nav>
        
        <div className="mt-auto space-y-6">
          <div className="p-4 bg-white/60 rounded-xl border border-white shadow-sm">
            <p className="font-label-mono text-[10px] text-text-secondary mb-2">PRO PLAN</p>
            <button className="w-full bg-primary text-white py-2 rounded-full font-bold text-sm hover:scale-95 transition-transform cursor-pointer">
              Upgrade to Pro
            </button>
          </div>
          <div className="space-y-3 pt-4 border-t border-primary/10">
            <Link to="#" className="flex items-center space-x-3 text-on-surface-variant hover:text-primary pl-4">
              <span className="material-symbols-outlined">help</span>
              <span className="font-label-mono text-label-mono">Help</span>
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 text-on-surface-variant hover:text-error pl-4 transition-colors cursor-pointer">
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-mono text-label-mono">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport Shell */}
      <main className="md:ml-[280px] min-h-screen relative p-6 md:p-10 transition-all duration-300 w-full md:w-auto">
        
        {/* Top Navigation */}
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-280px)] h-20 flex justify-between items-center px-6 md:px-10 bg-background/80 backdrop-blur-md z-30 border-b border-white/20 transition-all duration-300">
          <div className="flex items-center space-x-4 md:space-x-6">
            <button 
              className="md:hidden flex items-center justify-center p-2 rounded-xl bg-white/60 border border-white hover:bg-white shadow-sm text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-headline-md text-xl md:text-headline-md font-black text-primary">Mentora</span>
            <nav className="hidden md:flex space-x-8">
              <Link className="text-on-surface-variant font-label-mono text-label-mono hover:text-primary transition-opacity" to="/">Explore</Link>
              <Link className="text-on-surface-variant font-label-mono text-label-mono hover:text-primary transition-opacity" to="#">Community</Link>
              <Link className="text-primary font-bold border-b-2 border-primary pb-1 font-label-mono text-label-mono" to="#">Resources</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative hidden md:block">
              <input 
                className="bg-surface-container-low border-none rounded-full px-6 py-2 text-sm w-64 focus:ring-2 focus:ring-accent-neon outline-none transition-all" 
                placeholder="Search resources..." 
                type="text"
              />
              <span className="material-symbols-outlined absolute right-4 top-2 text-on-surface-variant">search</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold font-label-mono">{user.email.split('@')[0]}</p>
                <p className="text-[10px] text-text-secondary font-label-mono uppercase">Student Lvl 1</p>
              </div>
              <Link to="/profile" className="w-10 h-10 rounded-full border-2 border-accent-neon bg-primary flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                {user.profile_image ? (
                  <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.email.charAt(0).toUpperCase()
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
