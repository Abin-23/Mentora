import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboardRoute, setDashboardRoute] = useState('/dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === 'SystemAdmin' || payload.role === 'CourseAdmin') {
          setDashboardRoute('/admin/dashboard');
        }
      } catch (e) {
        // ignore
      }
    }
    // Micro-interaction: Mouse tracking for a subtle spotlight effect
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      
      let spotlight = document.getElementById('mouse-spotlight');
      if (!spotlight) {
        spotlight = document.createElement('div');
        spotlight.id = 'mouse-spotlight';
        spotlight.style.position = 'fixed';
        spotlight.style.width = '400px';
        spotlight.style.height = '400px';
        spotlight.style.background = 'radial-gradient(circle, rgba(232, 255, 102, 0.05) 0%, transparent 70%)';
        spotlight.style.borderRadius = '50%';
        spotlight.style.pointerEvents = 'none';
        spotlight.style.transform = 'translate(-50%, -50%)';
        spotlight.style.zIndex = '1';
        document.body.appendChild(spotlight);
      }
      
      spotlight.style.left = `${x}px`;
      spotlight.style.top = `${y}px`;
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      const spotlight = document.getElementById('mouse-spotlight');
      if (spotlight) spotlight.remove();
    };
  }, []);

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav h-16 flex items-center justify-between px-10">
        <div className="flex items-center gap-8">
          <span className="font-headline-md text-headline-md font-black text-primary">Mentora</span>
          <div className="hidden md:flex items-center gap-6">
            <Link className="font-label-mono text-label-mono text-primary font-bold border-b-2 border-primary pb-1" to="/">Explore</Link>
            <Link className="font-label-mono text-label-mono text-on-surface-variant hover:text-primary transition-opacity opacity-80 hover:opacity-100" to="#">Community</Link>
            <Link className="font-label-mono text-label-mono text-on-surface-variant hover:text-primary transition-opacity opacity-80 hover:opacity-100" to="#">Resources</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button onClick={() => navigate(dashboardRoute)} className="bg-primary text-on-primary font-label-mono text-label-mono px-6 py-2 rounded-full hover:scale-95 transition-transform cursor-pointer">
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link className="font-label-mono text-label-mono px-4 py-2 hover:opacity-70 transition-all" to="/login">Sign In</Link>
              <Link to="/register" className="bg-primary text-on-primary font-label-mono text-label-mono px-6 py-2 rounded-full hover:scale-95 transition-transform">Start Learning</Link>
            </>
          )}
        </div>
      </nav>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none dot-grid z-0"></div>

      <main className="relative pt-32 pb-24 px-10 md:px-24 z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto flex flex-col items-start gap-12">
          <div className="flex flex-col gap-4">
            <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary/60">Introducing Mentora</span>
            <h1 className="font-display-xl text-display-xl leading-none max-w-4xl">
              The Future of Adaptive Learning
            </h1>
          </div>
          <div className="flex flex-wrap gap-6 items-center">
            {isAuthenticated ? (
              <button onClick={() => navigate(dashboardRoute)} className="bg-accent-neon text-primary font-headline-md text-headline-md px-10 py-5 rounded-full neon-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer">
                Access Dashboard
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            ) : (
              <Link to="/register" className="bg-accent-neon text-primary font-headline-md text-headline-md px-10 py-5 rounded-full neon-glow hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer">
                Enroll Now
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            )}
            <div className="flex -space-x-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#DCE8DE] bg-white overflow-hidden">
                <img className="w-full h-full object-cover" alt="Student" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJZzOy0vEuRHGKHzNfDWiGJSmObOT2jtUzlLdVQomWSEcNruLksZqdB7WlyQ6czSLkHkHPKjisw9vRG5bw2QM62sdZ3fyurCNVYMvRSjX00Yq2_0MzHC7C-dJd_BkJvWhuuwzFFqdchI9SbOTW-JhXVpR-ekpActm9XVfDNzz1pNTMaMmWWLhyupoZ3oWnH8eB1_VKsBmi9A_53F5fCGGHru86apKFuZyryWGVsNyvuj4x3HkJrO0Sk4ruWUAcc0azAkbNlFQG2gT3"/>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-[#DCE8DE] bg-white overflow-hidden">
                <img className="w-full h-full object-cover" alt="Interface" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwsCIY_ZCVdgqYSpAYZxkPUnpdhzB3gc2AD35eZnB6f9ksi828OHLmJcvRRcVGPIvhcj6AYwz7poM8XBNJXU-jlCjiCnlniPNHM-BTQhZ8D_6G2qffiC4ygenvHnF6gE1X3XJQbGhOa9D7kzIcEh7Lu7_tC9EIBzQdsB-MshBYpEDumOFy45aggOUGNF6FfPa_w4qMae0N3eRyBZvCPef7ehFuwBVjraESLZURJBCU7MJEgy4ydPoOO5G2HZ4t2lLoNVG2uKrt-Gs0"/>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-[#DCE8DE] bg-white flex items-center justify-center font-label-mono text-[10px] text-primary">
                +2K
              </div>
            </div>
            <p className="font-label-mono text-label-mono text-primary/60 max-w-[200px]">Joined by over 2,000+ top-tier students this month.</p>
          </div>
        </section>

        {/* Bento Grid Feature Section */}
        <section className="max-w-7xl mx-auto mt-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px]">
            {/* Lavender Card */}
            <div className="md:col-span-8 bg-card-lavender rounded-[32px] p-10 flex flex-col justify-between bento-card shadow-lg shadow-black/5">
              <div className="flex justify-between items-start">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                <span className="font-label-mono text-label-mono border border-black/10 rounded-full px-3 py-1 bg-white/20">AI Integration</span>
              </div>
              <div className="max-w-md">
                <h3 className="font-headline-md text-headline-md mb-2">Personalized Mentor</h3>
                <p className="font-body-md text-body-md opacity-70">Our proprietary LLM adapts to your learning pace, identifying knowledge gaps in real-time and restructuring your curriculum.</p>
              </div>
            </div>

            {/* Mint Card */}
            <div className="md:col-span-4 bg-card-mint rounded-[32px] p-10 flex flex-col justify-center bento-card shadow-lg shadow-black/5">
              <div className="text-center">
                <div className="font-display-xl text-5xl mb-2">94%</div>
                <p className="font-label-mono text-label-mono uppercase">Retention Rate</p>
              </div>
            </div>

            {/* Small Coral Card */}
            <div className="md:col-span-4 bg-card-coral rounded-[32px] p-8 bento-card shadow-lg shadow-black/5 flex flex-col gap-4">
              <div className="w-12 h-12 bg-white/30 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined">insights</span>
              </div>
              <h4 className="font-headline-md text-lg">Real-time Analytics</h4>
              <p className="font-body-md text-sm opacity-70">Track every interaction and milestone with hardware-inspired visual progress charts.</p>
            </div>

            {/* Large White Card */}
            <div className="md:col-span-8 bg-white rounded-[32px] p-10 bento-card shadow-xl shadow-black/5 flex items-center gap-10">
              <div className="flex-1">
                <h3 className="font-headline-md text-headline-md mb-4">Curated Excellence</h3>
                <p className="font-body-md text-body-md text-text-secondary mb-6">Access a library of over 500 premium courses designed by industry disruptors and academic visionaries.</p>
                <button className="bg-primary text-on-primary px-6 py-3 rounded-full font-label-mono text-label-mono flex items-center gap-2 hover:gap-4 transition-all cursor-pointer">
                  View All Courses <span className="material-symbols-outlined">arrow_outward</span>
                </button>
              </div>
              <div className="hidden lg:flex w-48 h-48 rounded-full border-[1.5px] border-dashed border-primary/20 items-center justify-center animate-spin-slow">
                <div className="w-32 h-32 bg-accent-neon rounded-full flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-4xl">school</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Visual Accent */}
        <section className="max-w-7xl mx-auto mt-24 overflow-hidden rounded-[40px] h-[400px] relative">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-10">
            <h2 className="font-headline-lg text-headline-lg text-white mb-6">Ready to disrupt your focus?</h2>
            {isAuthenticated ? (
              <button onClick={() => navigate(dashboardRoute)} className="bg-white text-primary font-label-mono text-label-mono px-12 py-4 rounded-full hover:bg-accent-neon transition-colors duration-300 cursor-pointer">
                View Your Dashboard
              </button>
            ) : (
              <Link to="/register" className="bg-white text-primary font-label-mono text-label-mono px-12 py-4 rounded-full hover:bg-accent-neon transition-colors duration-300">
                Join the waitlist for Pro
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Footer Space */}
      <footer className="max-w-7xl mx-auto px-10 pb-20 flex flex-col md:flex-row justify-between items-end gap-10 relative z-10">
        <div className="flex flex-col gap-4">
          <span className="font-headline-md text-headline-md font-black text-primary">Mentora</span>
          <p className="font-label-mono text-label-mono text-primary/40 max-w-xs">Built for the next generation of intellectual explorers. Minimalist. Adaptive. Disruptive.</p>
        </div>
        <div className="flex gap-12">
          <div className="flex flex-col gap-2">
            <span className="font-label-mono text-label-mono font-bold">Platform</span>
            <Link className="font-label-mono text-[11px] text-primary/60 hover:text-primary" to="#">Dashboard</Link>
            <Link className="font-label-mono text-[11px] text-primary/60 hover:text-primary" to="#">AI Mentor</Link>
            <Link className="font-label-mono text-[11px] text-primary/60 hover:text-primary" to="#">Progress</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-label-mono text-label-mono font-bold">Company</span>
            <Link className="font-label-mono text-[11px] text-primary/60 hover:text-primary" to="#">About</Link>
            <Link className="font-label-mono text-[11px] text-primary/60 hover:text-primary" to="#">Terms</Link>
            <Link className="font-label-mono text-[11px] text-primary/60 hover:text-primary" to="#">Privacy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
