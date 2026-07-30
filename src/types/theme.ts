export type ThemeMode =
  | 'light'
  | 'dark'
  | 'steel'
  | 'Modern Minimalist'
  | 'Bento Box'
  | 'High Contrast'
  | 'modern-minimalist'
  | 'bento-box'
  | 'high-contrast';

export const THEME_MODE_CYCLE_ORDER: ThemeMode[] = [
  'dark',
  'light',
  'steel',
  'Modern Minimalist',
  'Bento Box',
  'High Contrast'
];

export function getNextThemeMode(current: ThemeMode): ThemeMode {
  const norm = current.toLowerCase().replace(/\s+/g, '-');
  const index = THEME_MODE_CYCLE_ORDER.findIndex(
    m => m.toLowerCase().replace(/\s+/g, '-') === norm
  );
  if (index === -1) return 'Modern Minimalist';
  return THEME_MODE_CYCLE_ORDER[(index + 1) % THEME_MODE_CYCLE_ORDER.length];
}

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
    case 'Modern Minimalist':
    case 'modern-minimalist':
      return {
        bg: 'bg-zinc-900 text-zinc-100',
        card: 'bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-sm backdrop-blur-md rounded-xl',
        cardHeader: 'bg-zinc-900/60 border-zinc-800 text-zinc-100',
        sidebar: 'bg-zinc-950 border-zinc-800 text-zinc-400',
        header: 'bg-zinc-950 border-zinc-800 text-zinc-100',
        border: 'border-zinc-800',
        subCard: 'bg-zinc-900/70 border-zinc-800 text-zinc-200 rounded-lg',
        mutedText: 'text-zinc-400',
        primaryText: 'text-zinc-100 font-medium',
        accentBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/30 rounded-lg shadow-sm',
        input: 'bg-zinc-900 border-zinc-800 text-zinc-100 rounded-md',
        badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80 rounded-md',
        codeBg: 'bg-zinc-950 text-indigo-300 rounded-md'
      };
    case 'Bento Box':
    case 'bento-box':
      return {
        bg: 'bg-[#090d16] text-slate-100',
        card: 'bg-gradient-to-br from-[#131b2e] to-[#111827] border-slate-700/80 text-slate-100 shadow-xl rounded-2xl',
        cardHeader: 'bg-[#1e293b]/50 border-slate-700/80 text-slate-100 rounded-t-2xl',
        sidebar: 'bg-[#0b101d] border-slate-800/80 text-slate-300',
        header: 'bg-[#090d16] border-slate-800 text-slate-100',
        border: 'border-slate-700/80',
        subCard: 'bg-[#151f33]/80 border-slate-700/60 text-slate-200 rounded-xl',
        mutedText: 'text-slate-400',
        primaryText: 'text-slate-100 font-semibold',
        accentBtn: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-md rounded-xl',
        input: 'bg-[#131b2e] border-slate-700 text-slate-100 rounded-xl',
        badge: 'bg-blue-950/90 text-blue-300 border-blue-600/50 rounded-lg',
        codeBg: 'bg-[#06080e] text-blue-300 rounded-lg'
      };
    case 'High Contrast':
    case 'high-contrast':
      return {
        bg: 'bg-black text-white font-mono',
        card: 'bg-black border-2 border-white text-white shadow-none rounded-none',
        cardHeader: 'bg-zinc-900 border-b-2 border-white text-white font-bold',
        sidebar: 'bg-black border-r-2 border-white text-white',
        header: 'bg-black border-b-2 border-white text-white',
        border: 'border-white',
        subCard: 'bg-black border border-white text-white rounded-none',
        mutedText: 'text-zinc-300',
        primaryText: 'text-white font-extrabold',
        accentBtn: 'bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold border-2 border-white rounded-none',
        input: 'bg-black border-2 border-white text-white rounded-none',
        badge: 'bg-yellow-400 text-black font-extrabold border border-white rounded-none',
        codeBg: 'bg-zinc-900 text-yellow-300 border border-white rounded-none'
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

