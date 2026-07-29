import React from 'react';
import {
  LayoutDashboard, GitMerge, PlayCircle, Ticket, Building2, CheckSquare,
  Terminal, ShieldCheck, Layers, ChevronLeft, ChevronRight, Activity, Cpu, Radio
} from 'lucide-react';
import { ThemeMode, getThemeStyles } from '../../types/theme';

export type ActiveTab = 'dashboard' | 'workflows' | 'instances' | 'tickets' | 'events' | 'offices' | 'validation' | 'api-console' | 'tackle';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  themeMode?: ThemeMode;
  pendingTicketCount: number;
  activeInstanceCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  themeMode = 'dark' as ThemeMode,
  pendingTicketCount,
  activeInstanceCount
}) => {
  const styles = getThemeStyles(themeMode);

  const sidebarBgClass = 
    themeMode === 'light' ? 'bg-slate-200 border-slate-300 text-slate-800' :
    themeMode === 'steel' ? 'bg-[#1e293b] border-slate-700 text-slate-200' :
    'bg-[#0d1117] border-[#2d333b] text-[#8b949e]';

  const sidebarHeaderBgClass =
    themeMode === 'light' ? 'bg-slate-300/60 border-slate-300 text-slate-900' :
    themeMode === 'steel' ? 'bg-[#0f172a]/60 border-slate-700 text-slate-100' :
    'bg-[#161b22]/50 border-[#2d333b] text-[#c9d1d9]';

  const activeTabClass =
    themeMode === 'light' ? 'bg-blue-600 text-white font-semibold' :
    themeMode === 'steel' ? 'bg-cyan-600 text-white font-semibold' :
    'bg-[#1f2937] text-white border-l-2 border-blue-500 font-semibold';

  const inactiveTabClass =
    themeMode === 'light' ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/80' :
    themeMode === 'steel' ? 'text-slate-300 hover:text-white hover:bg-slate-800/80' :
    'text-[#8b949e] hover:text-white hover:bg-[#161b22]/60';

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Telemetry Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'tackle' as ActiveTab,
      label: 'Tackle AI & Context Engine',
      shortLabel: 'Tackle AI',
      icon: Cpu,
      badge: null
    },
    {
      id: 'workflows' as ActiveTab,
      label: 'Workflow DAG Canvas',
      shortLabel: 'Workflows',
      icon: GitMerge,
      badge: null
    },
    {
      id: 'instances' as ActiveTab,
      label: 'Runtime Instances',
      shortLabel: 'Instances',
      icon: PlayCircle,
      badge: activeInstanceCount > 0 ? activeInstanceCount : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    },
    {
      id: 'tickets' as ActiveTab,
      label: 'Ticket Execution Queue',
      shortLabel: 'Tickets',
      icon: Ticket,
      badge: pendingTicketCount > 0 ? pendingTicketCount : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    },
    {
      id: 'events' as ActiveTab,
      label: 'Event Store & Triggers',
      shortLabel: 'Events',
      icon: Radio,
      badge: null
    },
    {
      id: 'offices' as ActiveTab,
      label: 'Offices, Tasks & Roles',
      shortLabel: 'Schema',
      icon: Building2,
      badge: null
    },
    {
      id: 'validation' as ActiveTab,
      label: 'Graph Validation Suite',
      shortLabel: 'Validate',
      icon: ShieldCheck,
      badge: null
    },
    {
      id: 'api-console' as ActiveTab,
      label: 'REST API Logs & Console',
      shortLabel: 'Console',
      icon: Terminal,
      badge: null
    },
  ];

  return (
    <aside className={`flex flex-col border-r select-none transition-all duration-200 shrink-0 ${sidebarBgClass} ${
      isCollapsed ? 'w-16' : 'w-56'
    }`}>
      {/* Sidebar Header */}
      <div className={`h-12 border-b flex items-center justify-between px-3.5 ${sidebarHeaderBgClass}`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2 truncate">
            <Layers className={`w-4 h-4 ${themeMode === 'steel' ? 'text-cyan-400' : 'text-[#58a6ff]'}`} />
            <span className={`font-bold text-[10px] uppercase tracking-widest ${themeMode === 'light' ? 'text-slate-600' : 'text-[#8b949e]'}`}>
              NAVIGATION
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1 rounded transition-colors ${
            themeMode === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300' : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
          } ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest ${
            themeMode === 'light' ? 'text-slate-500' : themeMode === 'steel' ? 'text-slate-400' : 'text-[#484f58]'
          }`}>
            Modules
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-1.5 text-[12px] font-sans transition-all group relative ${
                isActive ? activeTabClass : inactiveTabClass
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                isActive ? (themeMode === 'light' ? 'text-white' : themeMode === 'steel' ? 'text-white' : 'text-[#58a6ff]') : ''
              }`} />
              
              {!isCollapsed && (
                <span className="truncate flex-1 text-left">
                  {item.shortLabel || item.label}
                </span>
              )}

              {/* Badge */}
              {item.badge !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${item.badgeColor} ${
                  isCollapsed ? 'absolute -top-1 -right-1 px-1 py-0' : ''
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {!isCollapsed && (
          <div className={`pt-4 px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest ${
            themeMode === 'light' ? 'text-slate-500' : themeMode === 'steel' ? 'text-slate-400' : 'text-[#484f58]'
          }`}>
            Runtime Status
          </div>
        )}
        {!isCollapsed && (
          <div className="space-y-1 px-4 text-[11px] font-mono">
            <div className="py-1 flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="truncate">wind-srv daemon</span>
            </div>
            <div className="py-1 flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="truncate">nebula.roles API</span>
            </div>
            <div className="py-1 flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              <span className="truncate">graph validator</span>
            </div>
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className={`p-3 border-t flex items-center justify-between text-[10px] font-mono ${
        themeMode === 'light' ? 'border-slate-300 bg-slate-300/40 text-slate-700' :
        themeMode === 'steel' ? 'border-slate-700 bg-slate-900/60 text-slate-300' :
        'border-[#2d333b] bg-[#161b22] text-[#8b949e]'
      }`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>port: 3300</span>
            </div>
            <span
              onClick={() => onTabChange('api-console')}
              className={`${themeMode === 'steel' ? 'text-cyan-400' : 'text-[#58a6ff]'} hover:underline cursor-pointer italic`}
            >
              Docs
            </span>
          </>
        ) : (
          <div className="mx-auto text-emerald-400" title="wind-srv ready">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
