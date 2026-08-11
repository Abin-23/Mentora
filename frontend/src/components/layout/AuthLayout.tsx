import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  navLinkText: string;
  navLinkTo: string;
  leftContent: ReactNode;
  children: ReactNode;
}

export default function AuthLayout({ navLinkText, navLinkTo, leftContent, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav h-16 flex items-center justify-between px-10">
        <Link to="/" className="font-headline-md text-headline-md font-black text-primary hover:opacity-80 transition-opacity">Mentora</Link>
        <div className="flex items-center gap-4">
          <Link className="font-label-mono text-label-mono px-4 py-2 hover:opacity-70 transition-all text-primary" to={navLinkTo}>{navLinkText}</Link>
        </div>
      </nav>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none dot-grid z-0"></div>
      
      {/* Abstract Glowing Orbs */}
      <div className="fixed top-[15%] right-[20%] w-[350px] h-[350px] bg-card-mint/60 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse"></div>
      <div className="fixed bottom-[10%] left-[20%] w-[400px] h-[400px] bg-accent-neon/20 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-10 pt-32 pb-24 flex-grow flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center">
          
          {/* Left Side: Bento Content Area */}
          <div className="md:col-span-7 flex flex-col gap-8 pr-0 md:pr-10">
            {leftContent}
          </div>

          {/* Right Side: Form Card */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-[40px] p-10 bento-card shadow-2xl shadow-black/5 border border-white/50 w-full relative overflow-hidden group">
              {/* Subtle background glow inside form */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-neon/10 rounded-full blur-3xl -z-10 group-hover:scale-110 transition-transform duration-1000"></div>

              {children}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
