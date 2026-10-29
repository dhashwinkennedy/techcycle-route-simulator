import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  Wifi,
  WifiOff,
  Menu,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { backendOnline, simulationTime, advanceClockDays } = useApp();
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceDays, setAdvanceDays] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatSimTime = (isoString: string | null) => {
    if (!isoString) return 'Loading...';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (advanceDays <= 0) return;
    setIsSubmitting(true);
    const ok = await advanceClockDays(advanceDays);
    setIsSubmitting(false);
    if (ok) {
      setIsAdvanceModalOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/30">
            TC
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm sm:text-base leading-none flex items-center gap-2">
              <span>TechCycle</span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                E-Waste Logistics
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Route Optimisation Simulator
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Simulation Clock Indicator */}
        <div className="flex items-center bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline text-slate-400">Sim Time:</span>
            <span className="font-medium text-slate-200">
              {formatSimTime(simulationTime)}
            </span>
          </div>
          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="ml-2 pl-2 border-l border-slate-700 text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
            title="Advance Simulation Clock"
          >
            <span>+Advance</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Backend Connection Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
            backendOnline === true
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
              : backendOnline === false
              ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title={
            backendOnline === true
              ? 'FastAPI backend connected'
              : backendOnline === false
              ? 'Cannot connect to backend at http://localhost:8000'
              : 'Checking API status...'
          }
        >
          {backendOnline === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">API Online</span>
            </>
          ) : backendOnline === false ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">API Offline</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
              <span className="hidden sm:inline">Connecting...</span>
            </>
          )}
        </div>
      </div>

      {/* Advance Clock Modal */}
      <Modal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        title="Advance Simulation Clock"
        description="Advance the virtual timeline to test waiting times and automated pickup urgency thresholds."
        maxWidth="sm"
      >
        <form onSubmit={handleAdvance} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Days to Advance (e.g. 1, 3, 7 days)
            </label>
            <input
              type="number"
              min="0.1"
              max="365"
              step="0.5"
              value={advanceDays}
              onChange={(e) => setAdvanceDays(parseFloat(e.target.value) || 1)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-amber-400/90 mt-2">
              Notice: Advancing the clock alters wait times for all pending points. Pickups reaching 7 days will become mandatory.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAdvanceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<PlusCircle className="w-4 h-4" />}
            >
              Advance Clock
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
