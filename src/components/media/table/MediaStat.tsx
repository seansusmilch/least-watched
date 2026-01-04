import { ReactNode } from 'react';

interface MediaStatProps {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MediaStat({ icon, children, className = '' }: MediaStatProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
}
