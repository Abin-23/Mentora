interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  bgColorClass?: string;
}

export default function StatCard({ icon, title, value, bgColorClass = 'bg-white' }: StatCardProps) {
  return (
    <div className={`${bgColorClass} p-6 rounded-[24px] shadow-sm border border-black/5 flex flex-col justify-between`}>
      <span className="material-symbols-outlined text-primary mb-4">{icon}</span>
      <div>
        <p className="font-label-mono text-[10px] text-text-secondary uppercase tracking-widest mb-1">{title}</p>
        <p className="font-display-md text-4xl text-primary font-bold">{value}</p>
      </div>
    </div>
  );
}
