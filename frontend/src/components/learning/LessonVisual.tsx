import React from 'react';

export interface VisualMetadata {
  url: string;
  thumbnailUrl?: string;
  source: string;
  sourceUrl: string;
  attribution?: string;
  altText: string;
  purpose?: string;
}

interface LessonVisualProps {
  visual: VisualMetadata;
  className?: string;
  isDark?: boolean;
}

export const LessonVisual: React.FC<LessonVisualProps> = ({ visual, className = '', isDark = false }) => {
  if (!visual || !visual.url) return null;

  return (
    <div className={`my-6 rounded-2xl overflow-hidden shadow-sm border ${
      isDark 
        ? 'border-white/15 bg-white/[0.03] shadow-xl' 
        : 'border-outline-variant/30 bg-surface-container-lowest'
    } flex flex-col group ${className}`}>
      <div className={`relative w-full max-h-[400px] flex justify-center overflow-hidden ${
        isDark ? 'bg-black/40' : 'bg-surface-container-low'
      }`}>
        <img 
          src={visual.url} 
          alt={visual.altText || 'Educational visual'} 
          className="w-full h-full object-contain max-h-[400px] transition-transform duration-700 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {/* Optional gradient overlay to ensure text contrast if we had text over it */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
      
      <div className={`p-4 flex flex-col gap-2 ${isDark ? 'bg-white/[0.02] text-slate-200' : 'bg-white'}`}>
        {visual.purpose && (
          <p className={`text-sm font-medium leading-relaxed border-b pb-2 ${
            isDark ? 'text-slate-200 border-white/10' : 'text-on-surface border-outline-variant/10'
          }`}>
            <span className={`material-symbols-outlined text-[16px] align-middle mr-1 ${isDark ? 'text-accent-neon' : 'text-primary'}`}>info</span>
            {visual.purpose}
          </p>
        )}
        
        <div className={`flex flex-wrap items-center justify-between gap-4 text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-text-secondary'}`}>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">image</span>
            <span className="truncate max-w-[200px]" title={visual.altText}>{visual.altText}</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-right">
             {visual.attribution && <span>{visual.attribution}</span>}
             {visual.sourceUrl && (
               <a 
                 href={visual.sourceUrl} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className={`flex items-center gap-1 transition-colors font-medium px-2 py-1 rounded-md ${
                   isDark 
                     ? 'bg-white/10 text-slate-200 hover:text-accent-neon hover:bg-white/15' 
                     : 'bg-surface-container text-text-secondary hover:text-primary'
                 }`}
                 title={`View source on ${visual.source}`}
               >
                 {visual.source} <span className="material-symbols-outlined text-[12px]">open_in_new</span>
               </a>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
