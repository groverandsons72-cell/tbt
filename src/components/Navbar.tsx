import React from 'react';
import { Dumbbell, Settings, PlusCircle, Users, FileText } from 'lucide-react';
import { GymSettings } from '../types';

interface NavbarProps {
  settings: GymSettings;
  onOpenSettings: () => void;
  onScrollToInvoice: () => void;
  onScrollToMembers: () => void;
  activeMemberCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenSettings,
  onScrollToInvoice,
  onScrollToMembers,
  activeMemberCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
              {settings.logoBase64 ? (
                <img
                  src={settings.logoBase64}
                  alt={settings.gymName}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Dumbbell className="w-6 h-6 text-amber-500" />
              )}
            </div>
            <a href="/" className="text-lg font-bold tracking-tight text-slate-900 hover:text-amber-600 transition-colors">
              {settings.gymName || 'Gym Billing Manager'}
            </a>
          </div>

          {/* Zone 2: Navigation anchors */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={onScrollToInvoice}
              className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Create Invoice</span>
            </button>
            <button
              onClick={onScrollToMembers}
              className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Members Tracker</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono tabular-nums border border-slate-200">
                {activeMemberCount} active
              </span>
            </button>
          </nav>

          {/* Zone 3: Primary action & Settings trigger */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 rounded-lg border border-slate-300 shadow-xs transition-colors whitespace-nowrap cursor-pointer"
              title="Gym Profile & GST Settings"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Gym Settings</span>
            </button>
            <button
              onClick={onScrollToInvoice}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-all whitespace-nowrap cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
