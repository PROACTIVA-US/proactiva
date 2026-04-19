import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Map,
  PiggyBank,
  FileBarChart,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';

export type NavTab = 'overview' | 'engagements' | 'muddle-map' | 'savings' | 'reports';

const navItems: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; tab: NavTab }[] = [
  { icon: LayoutDashboard, label: 'Overview', tab: 'overview' },
  { icon: Briefcase, label: 'Engagements', tab: 'engagements' },
  { icon: Map, label: 'Muddle Map', tab: 'muddle-map' },
  { icon: PiggyBank, label: 'Savings', tab: 'savings' },
  { icon: FileBarChart, label: 'Reports', tab: 'reports' },
];

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-[220px] bg-black/20 border-r border-glass-border flex flex-col h-screen sticky top-0">
      <div className="p-10 flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-accent-primary rounded-md flex items-center justify-center">
          <Zap size={14} className="text-accent-primary fill-accent-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-accent-primary tracking-tight">PROACTIVA</h1>
          <p className="text-[9px] text-text-dim uppercase tracking-widest font-mono">Client Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-5 py-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.tab}
            onClick={() => onTabChange(item.tab)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group text-left',
              activeTab === item.tab
                ? 'bg-glass-bg text-text-main border border-glass-border'
                : 'text-text-dim hover:text-text-main hover:bg-white/5'
            )}
          >
            <item.icon
              size={18}
              className={cn(
                'transition-colors',
                activeTab === item.tab ? 'text-accent-primary' : 'text-text-dim group-hover:text-text-main'
              )}
            />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-5 mt-auto">
        <div className="text-[11px] text-text-dim mb-6 leading-relaxed">
          v1.0.0-beta<br />
          Client Portal
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary border border-white/20 shadow-lg" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-main truncate">Pacific Ridge PM</p>
            <p className="text-[10px] text-text-dim truncate">Active Engagement</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
