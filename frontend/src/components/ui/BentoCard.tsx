import { ReactNode } from 'react';

interface BentoCardProps {
  colSpanClass: string;
  bgColorClass: string;
  children: ReactNode;
  className?: string;
}

export default function BentoCard({ colSpanClass, bgColorClass, children, className = '' }: BentoCardProps) {
  return (
    <div className={`${colSpanClass} ${bgColorClass} rounded-[32px] p-8 flex flex-col hover:-translate-y-2 transition-transform duration-300 shadow-lg shadow-black/5 ${className}`}>
      {children}
    </div>
  );
}
