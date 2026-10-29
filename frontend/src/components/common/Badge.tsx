import React from 'react';
import { AlertTriangle, AlertCircle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface BadgeProps {
  status: 'normal' | 'due' | 'urgent' | 'critical' | 'mandatory' | 'available' | 'inactive' | 'maintenance' | 'planned' | 'executed' | string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const norm = status.toLowerCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  let icon: React.ReactNode = null;
  let label = status.toUpperCase();

  switch (norm) {
    case 'critical':
      styles = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
      icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      label = 'CRITICAL (100%+)';
      break;
    case 'urgent':
      styles = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      icon = <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
      label = 'URGENT (80%+)';
      break;
    case 'due':
      styles = 'bg-yellow-950/80 text-yellow-300 border-yellow-800/80';
      icon = <Clock className="w-3.5 h-3.5 text-yellow-400" />;
      label = 'DUE (70%+)';
      break;
    case 'mandatory':
      styles = 'bg-purple-950/80 text-purple-300 border-purple-800/80';
      icon = <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />;
      label = 'MANDATORY (7d+)';
      break;
    case 'normal':
      styles = 'bg-slate-800/80 text-slate-300 border-slate-700/80';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />;
      label = 'NORMAL (<70%)';
      break;
    case 'available':
      styles = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      label = 'AVAILABLE';
      break;
    case 'planned':
      styles = 'bg-sky-950/80 text-sky-300 border-sky-800/80';
      icon = <Clock className="w-3.5 h-3.5 text-sky-400" />;
      label = 'PLANNED';
      break;
    case 'executed':
      styles = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      label = 'EXECUTED';
      break;
    case 'maintenance':
      styles = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      icon = <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
      label = 'MAINTENANCE';
      break;
    case 'inactive':
      styles = 'bg-slate-800 text-slate-400 border-slate-700';
      label = 'INACTIVE';
      break;
    default:
      styles = 'bg-slate-800 text-slate-300 border-slate-700';
      label = status;
      break;
  }

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClasses} ${styles} ${className}`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};
