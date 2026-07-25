import React, { useState, useEffect } from 'react';
import {
  Terminal, Sun, Moon, Cpu, Server, Database, RefreshCw, Activity,
  CheckCircle2, AlertCircle, Play, ChevronRight, Copy, Check, Shield
} from 'lucide-react';
import { api, ApiMode } from '../../services/api';
import { ThemeMode } from '../../types/theme';

interface BrandingBoxProps {
  currentPath: string;
  themeMode: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  onOpenConsole: () => void;
  onRefreshData: () => void;
}

export const BrandingBox: React.FC<BrandingBoxProps> = ({
  currentPath,
  themeMode,
  onChangeTheme,
  onOpenConsole,
  onRefreshData
}) => {
  const [mode, setMode] = useState<ApiMode>(api.getMode());
  const [health, setHealth] = useState<{ ok: boolean; schema: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkHealth();
  }, [mode]);

  const checkHealth = async () => {
    try {
      const res = await api.getHealth();
      setHealth(res);
    } catch (e) {
      setHealth(null);
    }
  };

  const handleToggleMode = () => {
    const nextMode = mode === 'MOCK' ? 'LIVE' : 'MOCK';
    api.setMode(nextMode);
    setMode(nextMode);
    onRefreshData();
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    checkHealth();
    onRefreshData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const fullApiUrl = mode === 'MOCK' ? `mock://wind-srv${currentPath}` : `${api.getBaseUrl()}${currentPath}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullApiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const headerBgClass = 
    themeMode === 'light' ? 'bg-slate-900 border-slate-800 text-slate-200' :
    themeMode === 'steel' ? 'bg-[#0f172a] border-slate-700 text-slate-100' :
    'bg-[#1c2128] border-[#2d333b] text-[#d1d5db]';

  return (
    <header className={`h-12 border-b flex items-center justify-between px-3 select-none text-xs font-mono shrink-0 transition-colors duration-150 ${headerBgClass}`}>
      {/* Top-Left Branding Box & Breadcrumbs */}
      <div className="flex items-center space-x-3 overflow-hidden flex-1 mr-4">
        {/* Branding Box */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-[#3b82f6] text-white font-bold px-1.5 py-0.5 rounded-sm text-[10px] tracking-tighter">
            WIND
          </div>
          <span className="text-xs font-semibold tracking-wide text-white uppercase font-sans">
            wind-srv
          </span>
          <span className="text-[10px] bg-[#21262d] text-[#8b949e] px-1.5 py-0.5 rounded border border-[#30363d]">
            v3.2
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-[#30363d] shrink-0" />

        {/* Address Bar */}
        <div className="flex-1 max-w-[560px] bg-[#0d1117] border border-[#30363d] rounded flex items-center px-2.5 py-1 text-[11px] text-[#8b949e] overflow-hidden">
          <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded shrink-0 mr-2 ${
            currentPath.startsWith('/api/instances') ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80' :
            currentPath.startsWith('/api/workflows') ? 'bg-purple-950/80 text-purple-300 border border-purple-800/80' :
            currentPath.startsWith('/api/tickets') ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80' :
            'bg-blue-950/80 text-blue-300 border border-blue-800/80'
          }`}>
            REST
          </span>
          <span className="text-[#c9d1d9] font-mono truncate select-all">
            {fullApiUrl}
          </span>
          <button
            onClick={handleCopyUrl}
            className="ml-auto text-[#8b949e] hover:text-white p-0.5 rounded hover:bg-[#21262d] transition-colors shrink-0"
            title="Copy API Endpoint URL"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Right Action Controls & Indicators */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Health Status Indicator */}
        <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
          health?.ok
            ? 'bg-green-900/20 text-green-400 border-green-800/60'
            : 'bg-red-900/20 text-red-400 border-red-800/60'
        }`}>
          <Activity className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
          <span>{health?.ok ? 'API OK' : 'API DOWN'}</span>
        </div>

        {/* API Mode Toggle Button */}
        <button
          onClick={handleToggleMode}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all border ${
            mode === 'MOCK'
              ? 'bg-[#1f2937] text-indigo-300 border-[#30363d] hover:bg-[#21262d]'
              : 'bg-green-900/30 text-green-300 border-green-800/70 hover:bg-green-900/50'
          }`}
          title="Toggle between in-memory Mock Backend and Live wind-srv server"
        >
          <Database className="w-3 h-3" />
          <span>{mode}</span>
        </button>

        {/* Manual Refresh */}
        <button
          onClick={handleManualRefresh}
          className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors border border-[#30363d]"
          title="Refresh API Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* API Console Toggle */}
        <button
          onClick={onOpenConsole}
          className="px-2 py-1 rounded text-[#58a6ff] hover:text-white bg-[#0d1117] hover:bg-[#21262d] transition-colors flex items-center space-x-1 border border-[#30363d] font-mono text-[11px]"
          title="Open REST API Console & Request Logs"
        >
          <Terminal className="w-3.5 h-3.5 text-[#58a6ff]" />
          <span className="hidden sm:inline">CONSOLE</span>
        </button>

        {/* Deploy Badge/Action */}
        <button
          onClick={handleManualRefresh}
          className="px-2.5 py-1 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-[11px] font-bold font-mono transition-colors"
        >
          DEPLOY
        </button>

        {/* Theme Mode Selector (Light / Dark / Steel) */}
        <div className="flex items-center bg-[#0d1117] p-0.5 rounded border border-[#30363d] text-[10px] font-mono">
          <button
            onClick={() => onChangeTheme('light')}
            className={`px-1.5 py-0.5 rounded flex items-center space-x-1 transition-all ${
              themeMode === 'light'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
            title="Light Theme"
          >
            <Sun className="w-3 h-3" />
            <span className="hidden md:inline">LIGHT</span>
          </button>
          <button
            onClick={() => onChangeTheme('dark')}
            className={`px-1.5 py-0.5 rounded flex items-center space-x-1 transition-all ${
              themeMode === 'dark'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
            title="Dark Theme"
          >
            <Moon className="w-3 h-3" />
            <span className="hidden md:inline">DARK</span>
          </button>
          <button
            onClick={() => onChangeTheme('steel')}
            className={`px-1.5 py-0.5 rounded flex items-center space-x-1 transition-all ${
              themeMode === 'steel'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-[#8b949e] hover:text-white'
            }`}
            title="Steel Theme"
          >
            <Shield className="w-3 h-3" />
            <span className="hidden md:inline">STEEL</span>
          </button>
        </div>
      </div>
    </header>
  );
};
