interface CoachFeedbackProps {
  message: string | null;
  isDark?: boolean;
}

export default function CoachFeedback({ message, isDark }: CoachFeedbackProps) {
  if (!message) return null;

  return (
    <div className={`border-l-4 border-accent-neon rounded-r-xl p-4 my-6 shadow-sm animate-fade-in-up ${
      isDark 
        ? 'bg-accent-neon/10 backdrop-blur-md border-accent-neon text-slate-100' 
        : 'bg-gradient-to-r from-accent-neon/10 to-transparent'
    }`}>
      <div className="flex items-start gap-3">
        <div className="bg-accent-neon/20 rounded-full p-2 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-accent-neon text-[20px]">psychology</span>
        </div>
        <div>
          <h4 className={`text-xs uppercase tracking-widest font-bold mb-1 ${isDark ? 'text-accent-neon' : 'text-text-secondary'}`}>Mentora Coach</h4>
          <p className={`font-medium text-sm leading-relaxed ${isDark ? 'text-slate-100' : 'text-on-surface'}`}>{message}</p>
        </div>
      </div>
    </div>
  );
}
