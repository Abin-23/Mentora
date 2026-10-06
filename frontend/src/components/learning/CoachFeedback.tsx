import React from 'react';

interface CoachFeedbackProps {
  message: string | null;
}

export default function CoachFeedback({ message }: CoachFeedbackProps) {
  if (!message) return null;

  return (
    <div className="bg-gradient-to-r from-accent-neon/10 to-transparent border-l-4 border-accent-neon rounded-r-xl p-4 my-6 shadow-sm animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="bg-accent-neon/20 rounded-full p-2 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-accent-neon text-[20px]">psychology</span>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest font-bold text-text-secondary mb-1">Mentora Coach</h4>
          <p className="text-on-surface font-medium text-sm leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}
