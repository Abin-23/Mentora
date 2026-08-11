import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
  user: {
    email: string;
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
          <h1 className="font-headline-md text-headline-md font-bold text-white">Mentora Admin</h1>
          <p className="font-label-mono text-label-mono text-white/60 uppercase tracking-widest mt-1">Control Center</p>
        </div>
        
        <nav className="flex-grow space-y-4">
          <Link to="/admin/dashboard" className={`flex items-center space-x-3 pl-4 py-2 transition-colors duration-200 ${location.pathname === '/admin/dashboard' ? 'text-accent-neon font-bold border-l-4 border-accent-neon' : 'text-white/70 hover:text-white'}`}>
            <span className="material-symbols-outlined">shield</span>
            <span className="font-label-mono text-label-mono">Overview</span>
          </Link>
          {user.role === 'SystemAdmin' && (
            <Link to="/admin/users" className={`flex items-center space-x-3 pl-4 py-2 transition-colors duration-200 ${location.pathname === '/admin/users' ? 'text-accent-neon font-bold border-l-4 border-accent-neon' : 'text-white/70 hover:text-white'}`}>
              <span className="material-symbols-outlined">group</span>
              <span className="font-label-mono text-label-mono">Manage Users</span>
            </Link>
          )}
          <Link to="/admin/categories" className={`flex items-center space-x-3 pl-4 py-2 transition-colors duration-200 ${location.pathname === '/admin/categories' ? 'text-accent-neon font-bold border-l-4 border-accent-neon' : 'text-white/70 hover:text-white'}`}>
            <span className="material-symbols-outlined">library_books</span>
            <span className="font-label-mono text-label-mono">Course Categories</span>
          </Link>
          <Link to="/admin/courses" className={`flex items-center space-x-3 pl-4 py-2 transition-colors duration-200 ${location.pathname === '/admin/courses' ? 'text-accent-neon font-bold border-l-4 border-accent-neon' : 'text-white/70 hover:text-white'}`}>
            <span className="material-symbols-outlined">school</span>
            <span className="font-label-mono text-label-mono">Manage Courses</span>
          </Link>
          <Link to="/profile" className={`flex items-center space-x-3 pl-4 py-2 transition-colors duration-200 ${location.pathname === '/profile' ? 'text-accent-neon font-bold border-l-4 border-accent-neon' : 'text-white/70 hover:text-white'}`}>
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-mono text-label-mono">Settings</span>
          </Link>
          {user.role === 'SystemAdmin' && (
            <Link to="#" className="flex items-center space-x-3 text-white/70 hover:text-white pl-4 py-2 transition-colors duration-200">
              <span className="material-symbols-outlined">settings_suggest</span>
              <span className="font-label-mono text-label-mono">System Settings</span>
            </Link>
          )}
        </nav>
        
        <div className="mt-auto space-y-6">
          <div className="space-y-3 pt-4 border-t border-white/20">
            <button onClick={handleLogout} className="w-full flex items-center space-x-3 text-white/70 hover:text-error pl-4 transition-colors cursor-pointer">
              <span className="material-symbols-outlined">logout</span>
              <span className="font-label-mono text-label-mono">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport Shell */}
      <main className="md:ml-[280px] min-h-screen relative p-6 md:p-10 bg-surface-container-low/30 transition-all duration-300 w-full md:w-auto">
        
        {/* Top Navigation */}
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-280px)] h-20 flex justify-between items-center px-6 md:px-10 bg-background/80 backdrop-blur-md z-30 border-b border-black/5 transition-all duration-300">
          <div className="flex items-center space-x-4 md:space-x-6">
            <button 
              className="md:hidden flex items-center justify-center p-2 rounded-xl bg-white/60 border border-outline-variant hover:bg-white shadow-sm text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-headline-md text-xl md:text-headline-md font-black text-primary">Admin Console</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold font-label-mono">{user.email}</p>
                <p className="text-[10px] text-text-secondary font-label-mono uppercase">{user.role}</p>
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
