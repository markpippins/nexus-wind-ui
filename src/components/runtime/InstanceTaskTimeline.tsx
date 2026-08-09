import React, { useState } from 'react';
import {
  CheckCircle2, AlertTriangle, Clock, Circle, ChevronDown, ChevronRight,
  ArrowRight, ShieldAlert, FileText, Zap, Ticket as TicketIcon, Terminal
} from 'lucide-react';
import { Instance, Ticket, Receipt, WorkflowVersion, Task } from '../../types/wind';
import { ThemeMode, getThemeStyles } from '../../types/theme';

interface InstanceTaskTimelineProps {
  instance: Instance;
  version?: WorkflowVersion | null;
  tickets: Ticket[];
  receipts: Receipt[];
  tasks: Task[];
  themeMode?: ThemeMode;
  onAdvanceTicket?: (ticket: Ticket) => void;
}

export interface TimelineStep {
  nodeId: string;
  nodeName: string;
  taskName: string;
  sequenceIndex: number;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'PENDING' | 'SKIPPED' | 'NOT_STARTED';
  receipt?: Receipt;
  ticket?: Ticket;
  timestamp?: string;
  outcomeCode?: string;
  outputData?: any;
  errorMessage?: string;
}

export const InstanceTaskTimeline: React.FC<InstanceTaskTimelineProps> = ({
  instance,
  version,
  tickets,
  receipts,
  tasks,
  themeMode = 'dark' as ThemeMode,
  onAdvanceTicket
}) => {
  const styles = getThemeStyles(themeMode);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  // Build ordered sequence of timeline steps based on version workflow nodes and execution receipts/tickets
  const timelineSteps: TimelineStep[] = React.useMemo(() => {
    if (!version || !version.nodes) return [];

    return version.nodes.map((node, index) => {
      // Find ticket status first
      const ticket = tickets.find(t => t.node_id === node.id || t.node_name === node.name);
      // Find corresponding receipt by ticket_id (receipts no longer carry node_name)
      const receipt = ticket ? receipts.find(r => r.ticket_id === ticket.id) : undefined;

      let status: TimelineStep['status'] = 'NOT_STARTED';
      let outcomeCode = receipt?.outcome_code;
      let timestamp = receipt?.completed_at || ticket?.created_at;

      if (receipt) {
        if (receipt.outcome_code?.includes('FAIL') || receipt.outcome_code?.includes('ERROR') || receipt.outcome_code?.includes('REJECT')) {
          status = 'FAILED';
        } else {
          status = 'SUCCESS';
        }
      } else if (ticket) {
        if (ticket.status === 'COMPLETED') {
          status = 'SUCCESS';
        } else if (ticket.status === 'IN_PROGRESS') {
          status = 'IN_PROGRESS';
        } else if (ticket.status === 'PENDING') {
          status = 'PENDING';
        }
      } else if (instance.status === 'FAILED' && index === version.nodes.length - 1) {
        status = 'FAILED';
      }

      // Infer realistic error message if failed
      let errorMessage = undefined;
      if (status === 'FAILED') {
        errorMessage = receipt?.metadata?.error || `Node execution failed with code [${outcomeCode || 'SYSTEM_FAILURE'}]`;
      }

      return {
        nodeId: node.id,
        nodeName: node.name,
        taskName: node.task_name || 'Workflow Task',
        sequenceIndex: index + 1,
        status,
        receipt,
        ticket,
        timestamp,
        outcomeCode,
        outputData: receipt?.metadata,
        errorMessage
      };
    });
  }, [version, tickets, receipts, instance]);

  const totalSteps = timelineSteps.length;
  const completedSteps = timelineSteps.filter(s => s.status === 'SUCCESS').length;
  const failedSteps = timelineSteps.filter(s => s.status === 'FAILED').length;
  const pendingSteps = timelineSteps.filter(s => s.status === 'IN_PROGRESS' || s.status === 'PENDING').length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const toggleExpand = (nodeId: string) => {
    setExpandedNodeId(prev => (prev === nodeId ? null : nodeId));
  };

  return (
    <div className={`p-4 rounded border ${styles.card} space-y-4 font-sans`}>
      {/* Header & Progress Stats */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${styles.border} pb-3`}>
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className={`text-sm font-bold font-mono uppercase tracking-wider ${styles.primaryText}`}>
              TASK EXECUTION TIMELINE SEQUENCE
            </h3>
            <p className={`text-[11px] ${styles.mutedText}`}>
              Chronological step execution status for instance #{instance.id}
            </p>
          </div>
        </div>

        {/* Step Counts Bar */}
        <div className="flex items-center space-x-2 text-[10px] font-mono">
          <div className={`px-2.5 py-1 rounded border ${styles.subCard} flex items-center space-x-1.5`}>
            <span className={styles.mutedText}>PROGRESS:</span>
            <span className="font-extrabold text-blue-400">{progressPercent}%</span>
          </div>
          <div className={`px-2.5 py-1 rounded border ${styles.subCard} flex items-center space-x-1.5`}>
            <span className={styles.mutedText}>SUCCESS:</span>
            <span className="font-extrabold text-emerald-400">{completedSteps}/{totalSteps}</span>
          </div>
          {failedSteps > 0 && (
            <div className="px-2.5 py-1 rounded border bg-rose-950/60 border-rose-800 text-rose-400 flex items-center space-x-1.5 font-bold">
              <span>FAILED:</span>
              <span>{failedSteps}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden border border-slate-700/50">
        <div
          className={`h-full transition-all duration-500 ${
            failedSteps > 0 ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
          }`}
          style={{ width: `${Math.max(5, progressPercent)}%` }}
        />
      </div>

      {/* Vertical Step Timeline List */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700/60">
        {timelineSteps.map((step, idx) => {
          const isExpanded = expandedNodeId === step.nodeId;

          // Status Badge Formatting
          let icon = <Circle className="w-4 h-4 text-slate-500" />;
          let nodeBg = 'bg-[#0d1117] border-[#30363d]';
          let badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700';

          if (step.status === 'SUCCESS') {
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
            nodeBg = themeMode === 'light' ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-950/30 border-emerald-800/80';
            badgeStyle = 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
          } else if (step.status === 'FAILED') {
            icon = <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />;
            nodeBg = themeMode === 'light' ? 'bg-rose-50 border-rose-300' : 'bg-rose-950/40 border-rose-800/80';
            badgeStyle = 'bg-rose-950/90 text-rose-300 border-rose-700';
          } else if (step.status === 'IN_PROGRESS' || step.status === 'PENDING') {
            icon = <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />;
            nodeBg = themeMode === 'light' ? 'bg-amber-50 border-amber-300' : 'bg-amber-950/30 border-amber-800/80';
            badgeStyle = 'bg-amber-950/80 text-amber-300 border-amber-700';
          }

          return (
            <div key={step.nodeId} className="relative group">
              {/* Timeline Dot Indicator */}
              <div className="absolute -left-6 top-3 -translate-x-1/2 p-1 rounded-full bg-[#161b22] border border-[#30363d] z-10 shadow-sm">
                {icon}
              </div>

              {/* Step Card */}
              <div className={`p-3 rounded-lg border transition-all ${nodeBg}`}>
                <div
                  onClick={() => toggleExpand(step.nodeId)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      STEP {step.sequenceIndex}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold font-mono ${styles.primaryText}`}>
                          {step.nodeName}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${badgeStyle}`}>
                          {step.status}
                        </span>
                      </div>
                      <div className={`text-[11px] ${styles.mutedText} font-mono`}>
                        {step.taskName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-[10px] font-mono">
                    {step.timestamp && (
                      <span className={styles.mutedText}>
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    )}

                    {/* Action button to advance if pending ticket exists */}
                    {step.ticket && (step.ticket.status === 'PENDING' || step.ticket.status === 'IN_PROGRESS') && instance.status === 'ACTIVE' && onAdvanceTicket && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdvanceTicket(step.ticket!);
                        }}
                        className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-all flex items-center space-x-1 shadow-sm"
                      >
                        <span>ADVANCE TASK</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    <div className="p-1 text-slate-400 group-hover:text-white">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Execution Details Payload / Error Log */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-2 text-sm font-mono">
                    {step.outcomeCode && (
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 text-[10px]">OUTCOME CODE:</span>
                        <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 text-[10px]">
                          {step.outcomeCode}
                        </span>
                      </div>
                    )}

                    {step.errorMessage && (
                      <div className="p-2.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] space-y-1">
                        <div className="flex items-center space-x-1.5 font-bold">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span>EXECUTION EXCEPTION LOG:</span>
                        </div>
                        <p>{step.errorMessage}</p>
                      </div>
                    )}

                    {step.outputData ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
                          <Terminal className="w-3 h-3 text-blue-400" />
                          <span>OUTPUT PAYLOAD DATA:</span>
                        </div>
                        <pre className="p-2.5 rounded bg-[#0b0e14] border border-slate-800 text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(step.outputData, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">
                        No output payload recorded for this step yet.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {timelineSteps.length === 0 && (
          <div className="p-6 text-center text-sm font-mono text-slate-500 italic">
            No node sequence available for this workflow version.
          </div>
        )}
      </div>
    </div>
  );
};
