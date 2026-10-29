import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Building2,
  MapPin,
  Truck,
  PlaySquare,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { to: '/map', label: 'Interactive Map', icon: <Map className="w-5 h-5 shrink-0" /> },
    { to: '/facilities', label: 'Facilities', icon: <Building2 className="w-5 h-5 shrink-0" /> },
    { to: '/pickup-points', label: 'Pickup Points', icon: <MapPin className="w-5 h-5 shrink-0" /> },
    { to: '/vehicles', label: 'Lorries', icon: <Truck className="w-5 h-5 shrink-0" /> },
    { to: '/simulations/new', label: 'Route Planner', icon: <PlaySquare className="w-5 h-5 shrink-0" /> },
    { to: '/simulations', label: 'Simulation History', icon: <History className="w-5 h-5 shrink-0" /> },
    { to: '/settings', label: 'Settings & Rules', icon: <Settings className="w-5 h-5 shrink-0" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Header Branding in Sidebar */}
        <div className="h-16 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
              TC
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <span className="font-bold text-slate-100 text-sm tracking-wide">
                TECHCYCLE
              </span>
            )}
          </div>

          <div className="flex items-center">
            {/* Close Mobile */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                } ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {(!isCollapsed || isMobileOpen) && (
                <span className="truncate">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer info */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
                <span>Deterministic Mode</span>
                <span className="text-emerald-400 font-bold">2-opt</span>
              </div>
              <p className="text-slate-400 leading-tight">
                Backend authoritative route planning & capacity calculation.
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
