import React from 'react';

export interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  showThresholds?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  max,
  unit,
  showThresholds = true,
  className = '',
}) => {
  const percent = max > 0 ? (value / max) * 100 : 0;
  const clampedDisplayWidth = Math.min(Math.max(percent, 0), 100);

  let barColor = 'bg-emerald-500';
  let statusText = 'Normal';

  if (percent >= 100) {
    barColor = 'bg-rose-500';
    statusText = 'Critical (Over Safe Limit)';
  } else if (percent >= 80) {
    barColor = 'bg-amber-500';
    statusText = 'Urgent (≥80%)';
  } else if (percent >= 70) {
    barColor = 'bg-yellow-500';
    statusText = 'Due (≥70%)';
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="font-medium text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            {value.toLocaleString()} / {max.toLocaleString()} {unit}
          </span>
          <span className="font-semibold text-slate-200">
            ({percent.toFixed(1)}%)
          </span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {statusText}
          </span>
        </div>
      </div>

      <div
        className="relative w-full h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percent.toFixed(1)}% (${statusText})`}
      >
        <div
          className={`h-full transition-all duration-500 rounded-full ${barColor}`}
          style={{ width: `${clampedDisplayWidth}%` }}
        />

        {showThresholds && (
          <>
            {/* 70% Due threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/70 z-10"
              style={{ left: '70%' }}
              title="70% Due threshold"
            />
            {/* 80% Urgent threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
              style={{ left: '80%' }}
              title="80% Urgent threshold"
            />
          </>
        )}
      </div>

      {showThresholds && (
        <div className="flex justify-between text-[10px] text-slate-500 px-0.5">
          <span>0%</span>
          <span className="text-yellow-400/80">70% Due</span>
          <span className="text-amber-400/80">80% Urgent</span>
          <span className="text-rose-400/80">100% Critical</span>
        </div>
      )}
    </div>
  );
};
