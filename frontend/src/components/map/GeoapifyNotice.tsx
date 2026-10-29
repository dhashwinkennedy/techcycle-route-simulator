import React, { useState } from 'react';
import { Info, AlertCircle, X } from 'lucide-react';

interface GeoapifyNoticeProps {
  hasKey: boolean;
}

export const GeoapifyNotice: React.FC<GeoapifyNoticeProps> = ({ hasKey }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 sm:p-3 text-xs text-slate-300 flex items-start gap-2 shadow-lg backdrop-blur-md">
      {!hasKey ? (
        <>
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-amber-300">Map Tile Notice: </span>
            <span>
              Geoapify map key is missing. Using OpenStreetMap fallback tiles. To enable high-performance Geoapify tiles, set{' '}
              <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded font-mono">
                VITE_GEOAPIFY_MAP_KEY
              </code>{' '}
              in <code className="font-mono">frontend/.env</code>.
            </span>
          </div>
        </>
      ) : (
        <>
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-emerald-300">Geoapify Tiles Active. </span>
            <span className="text-slate-400">
              Note: Route plans display backend Haversine × 1.3 fallback geometry; straight-line segments represent point sequences, not turnkey road turns.
            </span>
          </div>
        </>
      )}

      <button
        onClick={() => setIsDismissed(true)}
        className="text-slate-400 hover:text-slate-200 p-0.5"
        aria-label="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
