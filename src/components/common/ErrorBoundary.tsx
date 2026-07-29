import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Application:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0e14] text-[#c9d1d9] font-sans flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-[#161b22] border border-rose-800/80 rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400 border-b border-rose-900/50 pb-3">
              <div className="p-2 rounded bg-rose-950/80 border border-rose-800">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-bold font-mono uppercase tracking-wider">
                  SYSTEM EXECUTION EXCEPTION DETECTED
                </h1>
                <p className="text-xs text-rose-300 font-mono">
                  Runtime React error boundary caught an unhandled component exception
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-xs text-[#8b949e] font-mono">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>DIAGNOSTIC EXCEPTION STACK:</span>
              </div>
              <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded text-xs font-mono text-rose-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                {this.state.error?.toString() || 'Unknown application error'}
                {this.state.errorInfo?.componentStack && (
                  <span className="text-[#8b949e] block mt-2 pt-2 border-t border-[#30363d]/50">
                    {this.state.errorInfo.componentStack}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#8b949e]">
                wind-srv telemetry engine running in resilient mode
              </span>
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs px-4 py-2 rounded transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>RELOAD APPLICATION</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
