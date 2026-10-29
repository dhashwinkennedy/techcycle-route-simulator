import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 text-slate-400 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-emerald-500`} />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  );
};
