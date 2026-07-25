export type ThemeMode = 'light' | 'dark' | 'steel';

export interface ThemeStyles {
  bg: string;
  card: string;
  cardHeader: string;
  sidebar: string;
  header: string;
  border: string;
  subCard: string;
  mutedText: string;
  primaryText: string;
  accentBtn: string;
  input: string;
  badge: string;
  codeBg: string;
}

export function getThemeStyles(mode: ThemeMode): ThemeStyles {
  switch (mode) {
    case 'light':
      return {
        bg: 'bg-slate-100 text-slate-900',
        card: 'bg-white border-slate-300 text-slate-900 shadow-sm',
        cardHeader: 'bg-slate-100 border-slate-300 text-slate-900',
        sidebar: 'bg-slate-200 border-slate-300 text-slate-800',
        header: 'bg-slate-900 border-slate-800 text-slate-100',
        border: 'border-slate-300',
        subCard: 'bg-slate-50 border-slate-300 text-slate-800',
        mutedText: 'text-slate-500',
        primaryText: 'text-slate-900',
        accentBtn: 'bg-blue-600 hover:bg-blue-700 text-white',
        input: 'bg-white border-slate-300 text-slate-900',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        codeBg: 'bg-slate-200 text-slate-900'
      };
    case 'steel':
      return {
        bg: 'bg-[#0f172a] text-slate-100',
        card: 'bg-[#1e293b] border-slate-700 text-slate-100 shadow-md',
        cardHeader: 'bg-[#334155]/80 border-slate-700 text-slate-100',
        sidebar: 'bg-[#1e293b] border-slate-700 text-slate-200',
        header: 'bg-[#0f172a] border-slate-700 text-slate-100',
        border: 'border-slate-700',
        subCard: 'bg-[#0f172a] border-slate-700 text-slate-200',
        mutedText: 'text-slate-400',
        primaryText: 'text-slate-100',
        accentBtn: 'bg-cyan-700 hover:bg-cyan-600 text-white border border-cyan-500/50',
        input: 'bg-[#0f172a] border-slate-700 text-slate-100',
        badge: 'bg-cyan-950 text-cyan-300 border-cyan-800',
        codeBg: 'bg-[#020617] text-cyan-300'
      };
    case 'dark':
    default:
      return {
        bg: 'bg-[#0b0e14] text-[#c9d1d9]',
        card: 'bg-[#161b22] border-[#30363d] text-[#c9d1d9]',
        cardHeader: 'bg-[#161b22] border-[#30363d] text-[#c9d1d9]',
        sidebar: 'bg-[#0d1117] border-[#2d333b] text-[#8b949e]',
        header: 'bg-[#1c2128] border-[#2d333b] text-[#d1d5db]',
        border: 'border-[#30363d]',
        subCard: 'bg-[#0d1117] border-[#30363d] text-[#c9d1d9]',
        mutedText: 'text-[#8b949e]',
        primaryText: 'text-[#c9d1d9]',
        accentBtn: 'bg-[#238636] hover:bg-[#2ea043] text-white',
        input: 'bg-[#0d1117] border-[#30363d] text-[#c9d1d9]',
        badge: 'bg-blue-950 text-blue-300 border-blue-800',
        codeBg: 'bg-[#0d1117] text-[#c9d1d9]'
      };
  }
}
