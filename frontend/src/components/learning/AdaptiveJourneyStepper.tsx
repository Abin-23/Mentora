import React from 'react';

export interface AdaptiveJourneyStepperProps {
  stages: string[];
  currentStageIndex: number;
  highestCompletedIndex: number;
  currentLabel: string;
  nextLabel: string;
  proficiency?: string;
  knowledgeScore?: number;
  weakConcepts?: string[];
  topicTitle?: string;
  isGeneratingAssessment?: boolean;
  onStageClick?: (stageIndex: number) => void;
  onAskTutor?: (prompt: string) => void;
  onStartAssessment?: () => void;
}

const STAGE_METADATA = [
  { name: 'Learn', icon: 'lightbulb', desc: 'Core concept & definitions', blockType: 'CONCEPT' },
  { name: 'Understand', icon: 'code_blocks', desc: 'Code walkthrough & visual example', blockType: 'EXAMPLE' },
  { name: 'Try', icon: 'psychology', desc: 'Active recall & quick check', blockType: 'TRY' },
  { name: 'Practice', icon: 'fitness_center', desc: 'Hands-on challenge & code', blockType: 'PRACTICE' },
  { name: 'Check', icon: 'quiz', desc: 'Topic knowledge assessment', blockType: 'CHECK' },
  { name: 'Master', icon: 'workspace_premium', desc: 'Verified mastery achievement', blockType: 'MASTER' },
];

export const AdaptiveJourneyStepper: React.FC<AdaptiveJourneyStepperProps> = ({
  stages,
  currentStageIndex,
  highestCompletedIndex,
  currentLabel,
  nextLabel,
  proficiency = 'UNASSESSED',
  knowledgeScore,
  weakConcepts = [],
  topicTitle,
  isGeneratingAssessment = false,
  onStageClick,
  onAskTutor,
  onStartAssessment,
}) => {
  // Format proficiency styling and labels
  const getProficiencyBadge = () => {
    switch (proficiency?.toUpperCase()) {
      case 'MASTER':
      case 'ADVANCED':
        return {
          bg: 'bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-amber-500/10 border-amber-400/40 text-amber-900',
          dot: 'bg-amber-500 shadow-amber-400/50',
          icon: 'workspace_premium',
          label: 'Mastered',
          subLabel: 'Advanced Level',
        };
      case 'PROFICIENT':
        return {
          bg: 'bg-gradient-to-r from-purple-500/15 via-indigo-400/20 to-purple-500/10 border-purple-400/40 text-purple-900',
          dot: 'bg-purple-600 shadow-purple-500/50',
          icon: 'bolt',
          label: 'Proficient',
          subLabel: 'Level 3 Achieved',
        };
      case 'DEVELOPING':
        return {
          bg: 'bg-gradient-to-r from-blue-500/15 via-sky-400/20 to-blue-500/10 border-blue-400/40 text-blue-900',
          dot: 'bg-blue-600 shadow-blue-500/50',
          icon: 'trending_up',
          label: 'Developing',
          subLabel: 'Reinforcing Concepts',
        };
      case 'BEGINNER':
      default:
        return {
          bg: 'bg-gradient-to-r from-emerald-500/15 via-teal-400/20 to-emerald-500/10 border-emerald-400/40 text-emerald-900',
          dot: 'bg-emerald-600 shadow-emerald-500/50',
          icon: 'eco',
          label: 'Foundational',
          subLabel: 'Adaptive Pacing Active',
        };
    }
  };

  const badge = getProficiencyBadge();
  const effectiveStage = Math.max(0, Math.min(stages.length - 1, currentStageIndex));
  const progressPercent = Math.min(100, Math.round(((highestCompletedIndex + 1) / stages.length) * 100));

  return (
    <div className="mb-6 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm overflow-hidden transition-all duration-300">
      {/* Top Header: Topic & Real-Time Mastery Radar */}
      <div className="p-5 md:p-6 border-b border-outline-variant/20 bg-gradient-to-r from-surface-container-low/70 via-surface-container-lowest to-surface-container-low/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-[24px]">route</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-widest text-primary/70">
                  Adaptive Learning Journey
                </span>
                <span className="text-outline-variant">•</span>
                <span className="text-xs font-semibold text-text-secondary">
                  Stage {effectiveStage + 1} of {stages.length}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-on-surface line-clamp-1">
                {topicTitle || 'Personalized Adaptive Module'}
              </h2>
            </div>
          </div>

          {/* Mastery Radar Badge */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className={`px-3.5 py-1.5 rounded-2xl border flex items-center gap-2.5 shadow-sm ${badge.bg}`}>
              <div className="relative flex items-center justify-center">
                <span className={`w-2.5 h-2.5 rounded-full ${badge.dot} shadow-sm animate-pulse`} />
              </div>
              <span className="material-symbols-outlined text-[18px]">{badge.icon}</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  {badge.label}
                  {knowledgeScore !== undefined && knowledgeScore !== null && (
                    <span className="text-[10px] font-mono px-1 py-0.2 bg-black/10 rounded">
                      {Math.round(knowledgeScore * 100)}%
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium opacity-80 leading-tight">
                  {badge.subLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weak Concept / Remediation Banner if present */}
        {weakConcepts && weakConcepts.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">target</span>
              </div>
              <p className="text-xs text-amber-900 font-medium">
                <strong className="font-bold">Adaptive Focus Active:</strong> Reinforcing concepts:{' '}
                <span className="font-bold underline decoration-amber-400">
                  {weakConcepts.slice(0, 3).join(', ')}
                </span>
                . Extra hints & practice are tailored for you.
              </p>
            </div>
            {onAskTutor && (
              <button
                type="button"
                onClick={() => onAskTutor(`Could you give me a simple walkthrough and analogy for ${weakConcepts[0]}?`)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-amber-400/40 text-amber-900 hover:bg-amber-100/50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-[15px] text-amber-600">psychology_alt</span>
                Ask Tutor about {weakConcepts[0]}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Interactive 6-Stage Stepper Ribbon */}
      <div className="p-5 md:p-6 bg-surface-container-lowest">
        <div className="relative">
          {/* Connecting Progress Track */}
          <div className="hidden md:block absolute top-[22px] left-[35px] right-[35px] h-[3px] bg-surface-container-highest rounded-full overflow-hidden z-0">
            <div
              className="h-full bg-gradient-to-r from-primary via-primary to-accent-neon transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Stepper Nodes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-2 relative z-10">
            {stages.map((stageName, sIdx) => {
              const meta = STAGE_METADATA[sIdx] || {
                name: stageName,
                icon: 'check_circle',
                desc: 'Pedagogical stage',
              };
              const isPast = sIdx <= highestCompletedIndex;
              const isActive = sIdx === effectiveStage;
              const isLocked = sIdx > highestCompletedIndex + 1;
              const isClickable = Boolean(onStageClick) && !isLocked;

              return (
                <button
                  key={stageName}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStageClick?.(sIdx)}
                  className={`group relative flex flex-col items-center p-3 rounded-2xl border text-center transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                      : isPast
                      ? 'bg-surface-container-low border-outline-variant/40 text-on-surface hover:bg-surface-container-high cursor-pointer'
                      : isLocked
                      ? 'bg-surface-container-lowest border-outline-variant/20 text-text-secondary/50 cursor-not-allowed opacity-75'
                      : 'bg-white border-outline-variant/30 text-on-surface hover:border-primary/50 cursor-pointer'
                  }`}
                >
                  {/* Stage Icon / Number Node */}
                  <div className="relative mb-2">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm transition-transform duration-200 group-hover:scale-105 ${
                        isActive
                          ? 'bg-white text-primary shadow-md ring-4 ring-accent-neon/60'
                          : isPast
                          ? 'bg-green-600 text-white shadow-sm'
                          : isLocked
                          ? 'bg-surface-container-highest text-text-secondary/60'
                          : 'bg-surface-container-low text-text-secondary border border-outline-variant/40'
                      }`}
                    >
                      {isPast ? (
                        <span className="material-symbols-outlined text-[20px]">check</span>
                      ) : isLocked ? (
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                      ) : (
                        <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                      )}
                    </div>

                    {/* Active Radar Ping */}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-neon opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-neon" />
                      </span>
                    )}
                  </div>

                  {/* Stage Name & Step */}
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${
                      isActive ? 'text-accent-neon' : isPast ? 'text-green-700' : 'text-text-secondary'
                    }`}
                  >
                    Step {sIdx + 1}
                  </span>
                  <span
                    className={`text-xs font-bold leading-tight line-clamp-1 ${
                      isActive ? 'text-white' : 'text-on-surface'
                    }`}
                  >
                    {stageName}
                  </span>
                  <span
                    className={`hidden md:block text-[10px] line-clamp-1 mt-0.5 ${
                      isActive ? 'text-white/80' : 'text-text-secondary'
                    }`}
                  >
                    {meta.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Micro-Bar: Current Stage Context & Immediate Action */}
        <div className="mt-5 pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <div className="text-xs">
              <span className="text-text-secondary font-medium">Current Goal: </span>
              <span className="font-bold text-on-surface">{currentLabel}</span>
            </div>
          </div>

          {/* Action guidance button */}
          <div className="flex items-center gap-2">
            {effectiveStage === 4 && onStartAssessment ? (
              <button
                type="button"
                onClick={onStartAssessment}
                disabled={isGeneratingAssessment}
                className="px-4 py-1.5 rounded-xl bg-accent-neon text-slate-900 font-bold text-xs shadow-md hover:brightness-105 transition-all flex items-center gap-1.5"
              >
                {isGeneratingAssessment ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                    Generating Assessment...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">quiz</span>
                    Take Mastery Quiz Now
                  </>
                )}
              </button>
            ) : nextLabel ? (
              <div className="text-xs text-text-secondary font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">arrow_forward</span>
                <span>Next: {nextLabel}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveJourneyStepper;
