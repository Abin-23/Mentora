interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  bgColorClass?: string;
}

export default function StatCard({ icon, title, value, subtitle, bgColorClass = 'bg-white' }: StatCardProps) {
  return (
    <div className={`${bgColorClass} p-6 rounded-[28px] shadow-sm border border-black/5 flex flex-col justify-between hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      </div>
      <div>
        <p className="font-label-mono text-[11px] text-text-secondary uppercase tracking-widest mb-1">{title}</p>
        <p className="font-display-md text-3xl md:text-4xl text-primary font-bold tracking-tight">{value}</p>
        {subtitle && (
          <p className="font-body-sm text-xs text-text-secondary mt-1.5 line-clamp-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

