import React from 'react';
import { Building2, Home, School, Briefcase } from 'lucide-react';

interface MapLegendProps {
  className?: string;
  showRoutes?: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({ className = '', showRoutes = true }) => {
  return (
    <div className={`bg-slate-900/95 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 shadow-xl backdrop-blur-md space-y-3 ${className}`}>
      <div>
        <h4 className="font-semibold text-slate-100 mb-1.5 uppercase tracking-wider text-[10px]">
          Entity Types
        </h4>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shrink-0" />
            <span>Recycling Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Residential</span>
          </div>
          <div className="flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>College/Hospital</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>IT Shop/Office</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-slate-100 mb-1.5 uppercase tracking-wider text-[10px]">
          Pickup Urgency
        </h4>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-600 border border-slate-400 shrink-0" />
            <span>Normal (&lt;70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-200 shrink-0" />
            <span>Due (&ge;70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-200 shrink-0" />
            <span>Urgent (&ge;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-rose-300 shrink-0" />
            <span>Critical (&ge;100%)</span>
          </div>
        </div>
      </div>

      {showRoutes && (
        <div>
          <h4 className="font-semibold text-slate-100 mb-1 uppercase tracking-wider text-[10px]">
            Route Polylines
          </h4>
          <p className="text-[11px] text-slate-400">
            Coloured lines show ordered vehicle trips starting and ending at their registered home facility.
          </p>
        </div>
      )}
    </div>
  );
};
