import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
}) => {
  const variantStyles = {
    info: 'bg-sky-950/40 border-sky-800 text-sky-200',
    warning: 'bg-amber-950/40 border-amber-800 text-amber-200',
    error: 'bg-rose-950/40 border-rose-800 text-rose-200',
    success: 'bg-emerald-950/40 border-emerald-800 text-emerald-200',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
  };

  return (
    <div
      className={`p-4 rounded-xl border flex items-start gap-3 text-sm leading-relaxed ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      {icons[variant]}
      <div className="space-y-1">
        {title && <h5 className="font-semibold text-slate-100">{title}</h5>}
        <div className="text-slate-300">{children}</div>
      </div>
    </div>
  );
};
