import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, Ticket as TicketIcon, CheckCircle2, Info, X, ChevronRight, Bell, Volume2, VolumeX, Trash2, Zap
} from 'lucide-react';
import { Toast, ToastType } from '../../types/toast';
import { ThemeMode, getThemeStyles } from '../../types/theme';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  themeMode?: ThemeMode;
  onSimulateFail?: () => void;
  onSimulateTicket?: () => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onClearAll,
  themeMode = 'dark' as ThemeMode,
  onSimulateFail,
  onSimulateTicket
}) => {
  const styles = getThemeStyles(themeMode);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Play subtle web audio chime when new toast arrives if sound enabled
  useEffect(() => {
    if (toasts.length > 0 && soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const latestToast = toasts[toasts.length - 1];
          osc.frequency.setValueAtTime(latestToast.type === 'error' ? 320 : 580, ctx.currentTime);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        }
      } catch (e) {
        // Ignore audio restrictions
      }
    }
  }, [toasts.length, soundEnabled]);

  if (toasts.length === 0) return null;

  const getToastBadgeStyle = (type: ToastType) => {
    switch (type) {
      case 'error':
        return {
          border: 'border-rose-600/80',
          bg: themeMode === 'light' ? 'bg-rose-50' : 'bg-rose-950/90',
          text: 'text-rose-400',
          iconBg: 'bg-rose-900/60 text-rose-300 border-rose-700/80',
          progress: 'bg-rose-500',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
        };
      case 'ticket':
        return {
          border: 'border-amber-600/80',
          bg: themeMode === 'light' ? 'bg-amber-50' : 'bg-amber-950/90',
          text: 'text-amber-300',
          iconBg: 'bg-amber-900/60 text-amber-300 border-amber-700/80',
          progress: 'bg-amber-500',
          icon: <TicketIcon className="w-4 h-4 text-amber-300" />
        };
      case 'success':
        return {
          border: 'border-emerald-600/80',
          bg: themeMode === 'light' ? 'bg-emerald-50' : 'bg-emerald-950/90',
          text: 'text-emerald-400',
          iconBg: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/80',
          progress: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        };
      default:
        return {
          border: 'border-blue-600/80',
          bg: themeMode === 'light' ? 'bg-blue-50' : 'bg-blue-950/90',
          text: 'text-blue-300',
          iconBg: 'bg-blue-900/60 text-blue-300 border-blue-700/80',
          progress: 'bg-blue-500',
          icon: <Info className="w-4 h-4 text-blue-300" />
        };
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2.5 max-w-md w-full px-2 sm:px-0 pointer-events-none font-sans">
      {/* Toast Controls Bar */}
      <div className="pointer-events-auto flex items-center justify-between bg-[#161b22]/95 backdrop-blur border border-[#30363d] px-3 py-1.5 rounded-lg shadow-xl text-[10px] font-mono text-[#8b949e]">
        <div className="flex items-center space-x-2">
          <Bell className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span className="font-bold text-[#c9d1d9]">SYSTEM TELEMETRY ALERTS ({toasts.length})</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute alert chimes" : "Unmute alert chimes"}
            className="hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <button
            onClick={onClearAll}
            className="hover:text-rose-400 flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Toast List */}
      {toasts.map((toast) => {
        const style = getToastBadgeStyle(toast.type);

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-lg border shadow-2xl p-3.5 transition-all duration-300 transform translate-y-0 ${style.border} ${style.bg} backdrop-blur`}
          >
            <div className="flex items-start space-x-3">
              {/* Type Icon Badge */}
              <div className={`p-2 rounded-md border shrink-0 ${style.iconBg}`}>
                {style.icon}
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold font-mono ${style.text}`}>
                    {toast.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {toast.timestamp}
                  </span>
                </div>

                <p className="text-xs text-slate-200 mt-1 leading-snug font-mono break-words">
                  {toast.description}
                </p>

                {/* Optional Action Button */}
                {toast.actionLabel && toast.onAction && (
                  <button
                    onClick={() => {
                      toast.onAction?.();
                      onDismiss(toast.id);
                    }}
                    className={`mt-2 inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all shadow-sm ${
                      toast.type === 'error'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : toast.type === 'ticket'
                        ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    <span>{toast.actionLabel}</span>
                    <ChevronRight className="w-3 h-3 ml-0.5" />
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => onDismiss(toast.id)}
                className="absolute top-2.5 right-2.5 p-1 rounded hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
