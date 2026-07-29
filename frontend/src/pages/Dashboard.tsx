import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch (e) {
      console.error('Invalid token', e);
      localStorage.removeItem('access_token');
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden">
      
      {/* Sidebar Anchor (Fixed) */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-white/40 backdrop-blur-xl border-r border-white/20 shadow-xl flex flex-col py-10 px-6 z-50">
        <div className="mb-12">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">Mentora OS</h1>
          <p className="font-label-mono text-label-mono text-text-secondary uppercase tracking-widest mt-1">Premium Learning</p>
        </div>
        
        <nav className="flex-grow space-y-4">
          <Link to="/dashboard" className="flex items-center space-x-3 text-primary font-bold border-l-4 border-primary pl-4 py-2">
            <span className="material-symbols-outlined text-primary">dashboard</span>
            <span className="font-label-mono text-label-mono">Dashboard</span>
          </Link>
          <Link to="#" className="flex items-center space-x-3 text-on-surface-variant hover:text-primary pl-4 py-2 transition-colors duration-200">
            <span className="material-symbols-outlined">school</span>
            <span className="font-label-mono text-label-mono">My Learning</span>
          </Link>
          <Link to="#" className="flex items-center space-x-3 text-on-surface-variant hover:text-primary pl-4 py-2 transition-colors duration-200">
            <span className="material-symbols-outlined">local_library</span>
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
          <Link to="#" className="flex items-center space-x-3 text-on-surface-variant hover:text-primary pl-4 py-2 transition-colors duration-200">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-mono text-label-mono">Settings</span>
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
      <main className="ml-[280px] min-h-screen relative p-10">
        
        {/* Top Navigation */}
        <header className="fixed top-0 right-0 w-[calc(100%-280px)] h-20 flex justify-between items-center px-10 bg-background/80 backdrop-blur-md z-40 border-b border-white/20">
          <div className="flex items-center space-x-6">
            <span className="font-headline-md text-headline-md font-black text-primary">Mentora</span>
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
              <div className="w-10 h-10 rounded-full border-2 border-accent-neon bg-primary flex items-center justify-center text-white font-bold">
                {user.email.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="mt-24 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <section className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h1 className="font-display-xl text-5xl md:text-6xl tracking-tight mb-2">
                Welcome back.
              </h1>
              <p className="font-body-md text-text-secondary">
                Your personalized learning ecosystem is ready. You have <strong className="text-primary">2 tasks</strong> pending.
              </p>
            </div>
            <button className="bg-primary text-on-primary font-label-mono text-label-mono px-6 py-3 rounded-full hover:scale-95 transition-transform flex items-center gap-2 cursor-pointer shadow-lg">
              Resume Course <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            </button>
          </section>

          {/* Bento Grid Dashboard */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px]">
            
            {/* AI Mentor Insights - Large Lavender Card */}
            <div className="md:col-span-8 bg-card-lavender rounded-[32px] p-8 flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300 shadow-lg shadow-black/5 relative overflow-hidden group">
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  </div>
                  <span className="font-label-mono text-label-mono uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full border border-black/5">AI Insight</span>
                </div>
              </div>
              <div className="z-10 max-w-lg mt-4">
                <h3 className="font-headline-md text-2xl mb-2">You're mastering Data Structures!</h3>
                <p className="font-body-md opacity-80 leading-relaxed">Based on your recent quizzes, you show a 94% retention rate in binary trees. I recommend moving on to Graph Theory next.</p>
              </div>
              
              {/* Decorative background shape */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            </div>

            {/* Current Streak - Mint Card */}
            <div className="md:col-span-4 bg-card-mint rounded-[32px] p-8 flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300 shadow-lg shadow-black/5">
              <div className="flex justify-between items-center">
                <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary/60">Activity</span>
                <span className="material-symbols-outlined text-primary/40">local_fire_department</span>
              </div>
              <div className="text-center">
                <div className="font-display-xl text-7xl text-primary mb-1 tracking-tighter">12</div>
                <p className="font-label-mono text-label-mono text-primary/70">DAY STREAK</p>
              </div>
              <div className="flex gap-1 justify-center mt-4">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div key={day} className={`w-8 h-2 rounded-full ${day <= 5 ? 'bg-primary' : 'bg-primary/10'}`}></div>
                ))}
              </div>
            </div>

            {/* Progress Chart Placeholder - Coral Card */}
            <div className="md:col-span-4 bg-card-coral rounded-[32px] p-8 flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300 shadow-lg shadow-black/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">donut_large</span>
                </div>
                <span className="font-label-mono text-label-mono uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Completion</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="12" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#000" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="80" strokeLinecap="round" className="animate-[spin_2s_ease-out_forwards]" />
                  </svg>
                  <span className="absolute font-display-xl text-3xl">68%</span>
                </div>
              </div>
            </div>

            {/* Active Course - White Card */}
            <div className="md:col-span-8 bg-white rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-8 hover:-translate-y-2 transition-transform duration-300 shadow-xl shadow-black/5">
              <div className="w-32 h-32 rounded-[24px] bg-surface-container-low flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                <img className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwsCIY_ZCVdgqYSpAYZxkPUnpdhzB3gc2AD35eZnB6f9ksi828OHLmJcvRRcVGPIvhcj6AYwz7poM8XBNJXU-jlCjiCnlniPNHM-BTQhZ8D_6G2qffiC4ygenvHnF6gE1X3XJQbGhOa9D7kzIcEh7Lu7_tC9EIBzQdsB-MshBYpEDumOFy45aggOUGNF6FfPa_w4qMae0N3eRyBZvCPef7ehFuwBVjraESLZURJBCU7MJEgy4ydPoOO5G2HZ4t2lLoNVG2uKrt-Gs0" alt="Course" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-accent-neon animate-pulse"></span>
                  <span className="font-label-mono text-[10px] uppercase tracking-widest text-text-secondary">In Progress</span>
                </div>
                <h3 className="font-headline-md text-2xl mb-2">Advanced Machine Learning</h3>
                <p className="font-body-md text-text-secondary mb-6 line-clamp-2">Dive deep into neural networks, reinforcement learning, and deploying models to production with real-world datasets.</p>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[45%] rounded-full"></div>
                  </div>
                  <span className="font-label-mono text-[12px] text-text-secondary">45%</span>
                </div>
              </div>
              <button className="hidden md:flex w-14 h-14 rounded-full border border-outline-variant items-center justify-center hover:bg-surface-container-low transition-colors group cursor-pointer flex-shrink-0">
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
            
          </section>
        </div>
      </main>
    </div>
  );
}
