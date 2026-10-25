import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
  user: {
    email: string;
    full_name?: string;
    role?: string;
    profile_image?: string;
  };
}

export default function AdminLayout({ children, user }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && user.role === 'Student') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const isCoursesActive = location.pathname.startsWith('/admin/courses') || location.pathname.startsWith('/admin/topics');
  const isCategoriesActive = location.pathname.startsWith('/admin/categories');
  const isUsersActive = location.pathname.startsWith('/admin/users');
  const isOverviewActive = location.pathname === '/admin/dashboard';
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
      <aside className={`fixed left-0 top-0 h-full w-[280px] bg-primary text-white shadow-xl flex flex-col py-10 px-6 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-12">
          <Link to="/admin/dashboard" className="block">
            <h1 className="font-headline-md text-headline-md font-bold text-white tracking-tight">Mentora Admin</h1>
            <p className="font-label-mono text-label-mono text-white/60 uppercase tracking-widest mt-1">Control Center</p>
          </Link>
        </div>
        
        <nav className="flex-grow space-y-3">
          <Link to="/admin/dashboard" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isOverviewActive ? 'text-accent-neon font-bold bg-white/10 border-l-4 border-accent-neon' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
            <span className="material-symbols-outlined text-[20px]">shield</span>
            <span className="font-label-mono text-label-mono">Overview</span>
          </Link>
          {user.role === 'SystemAdmin' && (
            <Link to="/admin/users" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isUsersActive ? 'text-accent-neon font-bold bg-white/10 border-l-4 border-accent-neon' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
              <span className="material-symbols-outlined text-[20px]">group</span>
              <span className="font-label-mono text-label-mono">Manage Users</span>
            </Link>
          )}
          <Link to="/admin/categories" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isCategoriesActive ? 'text-accent-neon font-bold bg-white/10 border-l-4 border-accent-neon' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
            <span className="material-symbols-outlined text-[20px]">library_books</span>
            <span className="font-label-mono text-label-mono">Course Categories</span>
          </Link>
          <Link to="/admin/courses" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isCoursesActive ? 'text-accent-neon font-bold bg-white/10 border-l-4 border-accent-neon' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
            <span className="material-symbols-outlined text-[20px]">school</span>
            <span className="font-label-mono text-label-mono">Manage Courses</span>
          </Link>
          <Link to="/profile" className={`flex items-center space-x-3 pl-4 py-2.5 rounded-xl transition-all duration-200 ${isProfileActive ? 'text-accent-neon font-bold bg-white/10 border-l-4 border-accent-neon' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span className="font-label-mono text-label-mono">Profile</span>
          </Link>
        </nav>
        
        <div className="mt-auto space-y-4">
          <div className="p-4 bg-white/10 rounded-2xl border border-white/15">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-accent-neon animate-pulse"></span>
              <p className="font-label-mono text-[10px] text-white/70 uppercase tracking-widest">Admin Mode</p>
            </div>
            <p className="font-headline-md text-xs font-bold text-white truncate">{user.full_name || user.email.split('@')[0]}</p>
            <p className="font-label-mono text-[10px] text-accent-neon uppercase tracking-wider">{user.role}</p>
          </div>

          <div className="pt-2">
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 text-white/70 hover:text-error pl-4 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="font-label-mono text-label-mono">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport Shell */}
      <main className="md:ml-[280px] min-h-screen relative p-6 md:p-10 bg-surface-container-low/30 transition-all duration-300 w-full md:w-auto">
        
        {/* Top Navigation */}
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-280px)] h-20 flex justify-between items-center px-6 md:px-10 bg-background/80 backdrop-blur-md z-30 border-b border-black/5 transition-all duration-300">
          <div className="flex items-center space-x-4 md:space-x-8">
            <button 
              className="md:hidden flex items-center justify-center p-2 rounded-xl bg-white/60 border border-outline-variant hover:bg-white shadow-sm text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-headline-md text-xl md:text-headline-md font-black text-primary">Admin Console</span>

            <nav className="hidden lg:flex items-center space-x-6">
              <Link to="/admin/dashboard" className={`font-label-mono text-xs uppercase tracking-wider transition-colors ${isOverviewActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary'}`}>Overview</Link>
              <Link to="/admin/courses" className={`font-label-mono text-xs uppercase tracking-wider transition-colors ${isCoursesActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary'}`}>Courses</Link>
              <Link to="/admin/categories" className={`font-label-mono text-xs uppercase tracking-wider transition-colors ${isCategoriesActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary'}`}>Categories</Link>
              {user.role === 'SystemAdmin' && (
                <Link to="/admin/users" className={`font-label-mono text-xs uppercase tracking-wider transition-colors ${isUsersActive ? 'text-primary font-bold' : 'text-text-secondary hover:text-primary'}`}>Users</Link>
              )}
              <Link to="/courses" className="font-label-mono text-xs uppercase tracking-wider text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
                <span>Catalog</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold font-label-mono text-primary">{user.full_name || user.email}</p>
                <p className="text-[10px] text-text-secondary font-label-mono uppercase tracking-wider">{user.role}</p>
              </div>
              <Link to="/profile" className="w-10 h-10 rounded-full border-2 border-accent-neon bg-primary flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shadow-sm">
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
