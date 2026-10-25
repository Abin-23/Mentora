import { ReactNode } from 'react';

interface BentoCardProps {
  colSpanClass: string;
  bgColorClass: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function BentoCard({ colSpanClass, bgColorClass, children, className = '', onClick }: BentoCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`${colSpanClass} ${bgColorClass} rounded-[32px] p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300 shadow-lg shadow-black/5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
