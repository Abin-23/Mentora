interface ActionCardProps {
  bgColorClass: string;
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  buttonStyleClass?: string;
  onClick?: () => void;
}

export default function ActionCard({ bgColorClass, icon, title, description, buttonText, buttonStyleClass, onClick }: ActionCardProps) {
  const defaultButtonStyle = "self-start bg-primary text-white font-label-mono text-label-mono px-6 py-2 rounded-full hover:scale-95 transition-transform cursor-pointer";
  
  return (
    <div className={`${bgColorClass} rounded-[32px] p-8 flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300 shadow-sm border border-black/5`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>
        <h3 className="font-headline-md text-xl font-bold">{title}</h3>
      </div>
      <p className="font-body-md opacity-80 mb-6">{description}</p>
      <button onClick={onClick} className={buttonStyleClass || defaultButtonStyle}>
        {buttonText}
      </button>
    </div>
  );
}
