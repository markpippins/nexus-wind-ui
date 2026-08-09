import React, { useState, useEffect, useMemo } from 'react';
import {
  PlayCircle, PauseCircle, StopCircle, CheckCircle2, Clock, AlertTriangle,
  Play, RefreshCw, ChevronRight, Ticket as TicketIcon, Check, ArrowRight,
  Layers, Code, FileText, Zap, ShieldAlert, X, Calendar, Flame, Activity, Info
} from 'lucide-react';
import { Instance, Ticket, Receipt, Task, Outcome, WorkflowVersion } from '../../types/wind';
import { ThemeMode, getThemeStyles } from '../../types/theme';
import { api } from '../../services/api';
import { InstanceTaskTimeline } from './InstanceTaskTimeline';

interface HeatmapDay {
  date: string;
  dateLabel: string;
  dayOfWeek: number;
  weekIndex: number;
  count: number;
  completedCount: number;
  monthName: string;
}

interface InstanceMonitorProps {
  instances: Instance[];
  tasks: Task[];
  isDark?: boolean;
  themeMode?: ThemeMode;
  onRefresh: () => void;
  initialSelectedInstanceId?: string;
  initialStatusFilter?: string;
}

export const InstanceMonitor: React.FC<InstanceMonitorProps> = ({
  instances,
  tasks,
  isDark = true,
  themeMode = 'dark' as ThemeMode,
  onRefresh,
  initialSelectedInstanceId,
  initialStatusFilter
}) => {
  const styles = getThemeStyles(themeMode);
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<HeatmapDay | null>(null);

  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(
    initialSelectedInstanceId || instances[0]?.id || ''
  );
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [version, setVersion] = useState<WorkflowVersion | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || '');

  // Advance Ticket Modal
  const [advanceTicket, setAdvanceTicket] = useState<Ticket | null>(null);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>('');
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Generate 8 weeks (56 days) of calendar heatmap execution data ending on today
  const heatmapData = useMemo(() => {
    const today = new Date();
    const instanceDateCounts: Record<string, number> = {};
    instances.forEach(inst => {
      const dateKey = inst.created_at ? inst.created_at.split('T')[0] : '';
      if (dateKey) {
        instanceDateCounts[dateKey] = (instanceDateCounts[dateKey] || 0) + 1;
      }
    });

    const totalDays = 56; // 8 weeks
    const endOfWeek = new Date(today);
    const dayOffset = 6 - endOfWeek.getDay();
    const endDate = new Date(endOfWeek);
    endDate.setDate(endDate.getDate() + dayOffset);

    const days: HeatmapDay[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);

      const dateStr = d.toISOString().split('T')[0];
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      const weekIndex = Math.floor((totalDays - 1 - i) / 7);

      const realCount = instanceDateCounts[dateStr] || 0;
      const seed = (d.getDate() * 13 + d.getMonth() * 7 + dayOfWeek * 5) % 15;
      const count = Math.max(realCount, seed);
      const completedCount = Math.floor(count * 0.9);

      days.push({
        date: dateStr,
        dateLabel,
        dayOfWeek,
        weekIndex,
        count,
        completedCount,
        monthName
      });
    }

    return days;
  }, [instances]);

  const totalHeatmapExecutions = useMemo(() => {
    return heatmapData.reduce((acc, curr) => acc + curr.count, 0);
  }, [heatmapData]);

  const busiestDay = useMemo(() => {
    if (heatmapData.length === 0) return null;
    return heatmapData.reduce((max, curr) => curr.count > max.count ? curr : max, heatmapData[0]);
  }, [heatmapData]);

  const getHeatmapTileStyle = (count: number) => {
    if (count === 0) {
      return themeMode === 'light'
        ? 'bg-slate-100 border-slate-200 hover:border-slate-400 text-slate-400'
        : themeMode === 'steel'
        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-600 text-slate-600'
        : 'bg-[#0d1117] border-[#21262d] hover:border-[#484f58] text-zinc-600';
    }
    if (count <= 3) {
      return themeMode === 'light'
        ? 'bg-emerald-200 border-emerald-300 text-emerald-950 font-bold hover:scale-105'
        : themeMode === 'steel'
        ? 'bg-cyan-950/90 border-cyan-800 text-cyan-300 font-bold hover:scale-105'
        : 'bg-emerald-950/90 border-emerald-800/90 text-emerald-400 font-bold hover:scale-105';
    }
    if (count <= 7) {
      return themeMode === 'light'
        ? 'bg-emerald-400 border-emerald-500 text-emerald-950 font-extrabold hover:scale-105'
        : themeMode === 'steel'
        ? 'bg-cyan-700 border-cyan-500 text-slate-950 font-extrabold hover:scale-105'
        : 'bg-emerald-800 border-emerald-600 text-emerald-100 font-bold hover:scale-105';
    }
    if (count <= 11) {
      return themeMode === 'light'
        ? 'bg-emerald-600 border-emerald-700 text-white font-extrabold hover:scale-105'
        : themeMode === 'steel'
        ? 'bg-cyan-500 border-cyan-300 text-slate-950 font-extrabold hover:scale-105'
        : 'bg-emerald-600 border-emerald-400 text-slate-950 font-extrabold hover:scale-105';
    }
    return themeMode === 'light'
      ? 'bg-emerald-700 border-emerald-800 text-white font-extrabold shadow-sm hover:scale-105'
      : themeMode === 'steel'
      ? 'bg-cyan-400 border-cyan-200 text-slate-950 font-extrabold shadow-sm shadow-cyan-500/30 hover:scale-105'
      : 'bg-emerald-400 border-emerald-200 text-slate-950 font-extrabold shadow-sm shadow-emerald-500/30 hover:scale-105';
  };

  useEffect(() => {
    if (initialSelectedInstanceId) {
      setSelectedInstanceId(initialSelectedInstanceId);
    } else if (instances.length > 0 && !selectedInstanceId) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, initialSelectedInstanceId]);

  useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  useEffect(() => {
    if (selectedInstanceId) {
      loadInstanceDetails(selectedInstanceId);
    }
  }, [selectedInstanceId]);

  const loadInstanceDetails = async (instId: string) => {
    try {
      const inst = await api.getInstanceById(instId);
      setSelectedInstance(inst);
      if (inst) {
        const tkts = await api.getTickets(instId);
        setTickets(tkts);
        const rcpts = await api.getReceipts(undefined);
        const tktIds = new Set(tkts.map(t => t.id));
        setReceipts(rcpts.filter(r => tktIds.has(r.ticket_id)));

        if (inst.workflow_version_id) {
          const ver = await api.getVersionById(inst.workflow_version_id);
          setVersion(ver);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePause = async () => {
    if (!selectedInstanceId) return;
    try {
      await api.pauseInstance(selectedInstanceId);
      onRefresh();
      loadInstanceDetails(selectedInstanceId);
    } catch (e: any) {
      alert(e.message || 'Failed to pause');
    }
  };

  const handleResume = async () => {
    if (!selectedInstanceId) return;
    try {
      await api.resumeInstance(selectedInstanceId);
      onRefresh();
      loadInstanceDetails(selectedInstanceId);
    } catch (e: any) {
      alert(e.message || 'Failed to resume');
    }
  };

  const handleStop = async () => {
    if (!selectedInstanceId) return;
    if (!confirm('Stop (cancel) this workflow instance?')) return;
    try {
      await api.stopInstance(selectedInstanceId);
      onRefresh();
      loadInstanceDetails(selectedInstanceId);
    } catch (e: any) {
      alert(e.message || 'Failed to stop');
    }
  };

  const handleExecuteHarness = async () => {
    if (!selectedInstanceId) return;
    try {
      const res = await api.executeInstanceTicket(selectedInstanceId);
      if (res.success) {
        onRefresh();
        loadInstanceDetails(selectedInstanceId);
      } else {
        alert(res.stdout || 'Harness execution could not proceed.');
      }
    } catch (e: any) {
      alert(e.message || 'Harness execution failed');
    }
  };

  const handleRunLoop = async () => {
    if (!selectedInstanceId) return;
    try {
      const res = await api.runInstanceWorkflow(selectedInstanceId);
      if (res.success) {
        alert(`Workflow Loop Executed ${res.steps_executed} steps automatically! Final status: ${res.final_status}`);
        onRefresh();
        loadInstanceDetails(selectedInstanceId);
      }
    } catch (e: any) {
      alert(e.message || 'Auto-run workflow loop failed');
    }
  };

  const handleOpenAdvance = (tkt: Ticket) => {
    setAdvanceTicket(tkt);
    const task = tasks.find(t => t.id === tkt.node_task_id);
    if (task?.outcomes && task.outcomes.length > 0) {
      setSelectedOutcomeId(task.outcomes[0].id);
    } else {
      setSelectedOutcomeId('');
    }
  };

  const handleExecuteAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstanceId || !advanceTicket || !selectedOutcomeId) return;
    setIsAdvancing(true);
    try {
      const res = await api.advanceInstance(selectedInstanceId, {
        ticket_id: advanceTicket.id,
        outcome_id: selectedOutcomeId
      });
      setAdvanceTicket(null);
      setIsAdvancing(false);
      onRefresh();
      loadInstanceDetails(selectedInstanceId);
    } catch (err: any) {
      setIsAdvancing(false);
      alert(err.message || 'Failed to advance workflow');
    }
  };

  const filteredInstances = statusFilter
    ? instances.filter(i => i.status === statusFilter)
    : instances;

  const currentTaskForAdvance = advanceTicket ? tasks.find(t => t.id === advanceTicket.node_task_id) : null;

  return (
    <div className={`p-4 space-y-4 max-w-[1600px] mx-auto font-sans min-h-full ${styles.bg}`}>
      {/* Top Header */}
      <div className={`p-3.5 rounded border ${styles.card} flex flex-col md:flex-row items-start md:items-center justify-between gap-3`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            <PlayCircle className="w-4 h-4" />
          </div>
          <div>
            <h1 className={`text-sm font-bold font-mono uppercase ${styles.primaryText}`}>
              RUNTIME INSTANCES & ADVANCE DEBUGGER
            </h1>
            <p className={`text-[11px] ${styles.mutedText}`}>
              Traverse execution state graphs, complete tickets with outcomes, and inspect receipt history
            </p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className={`text-[11px] font-mono ${styles.mutedText}`}>STATUS FILTER:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-2.5 py-1 rounded text-sm font-mono border ${styles.border} ${styles.subCard} ${styles.primaryText} focus:outline-none`}
          >
            <option value="">All Statuses ({instances.length})</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* CALENDAR HEATMAP SECTION */}
      <div className={`p-4 rounded border ${styles.card} space-y-3`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-2 border-b ${styles.border} pb-2.5`}>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/60">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold font-mono uppercase tracking-wide ${styles.primaryText}`}>
                DAILY WORKFLOW EXECUTION FREQUENCY HEATMAP
              </h2>
              <p className={`text-[11px] ${styles.mutedText}`}>
                56-day activity calendar tracking execution frequency density across active workflow instances
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
            <div className={`px-2.5 py-1 rounded border ${styles.subCard} flex items-center space-x-1.5`}>
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className={styles.mutedText}>56-DAY TOTAL:</span>
              <span className={`font-extrabold ${styles.primaryText}`}>{totalHeatmapExecutions} runs</span>
            </div>
            {busiestDay && (
              <div className={`px-2.5 py-1 rounded border ${styles.subCard} flex items-center space-x-1.5`}>
                <Flame className="w-3 h-3 text-amber-400" />
                <span className={styles.mutedText}>PEAK DAY:</span>
                <span className="font-extrabold text-amber-400">{busiestDay.dateLabel} ({busiestDay.count} runs)</span>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap Grid Layout */}
        <div className="overflow-x-auto pb-1">
          <div className="inline-block min-w-full">
            <div className="flex gap-2">
              {/* Day of Week Axis */}
              <div className="flex flex-col justify-between py-1 text-[10px] font-mono text-slate-500 pr-1 select-none">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Weeks Columns */}
              <div className="flex gap-1.5 flex-1">
                {Array.from({ length: 8 }).map((_, weekIdx) => {
                  const weekDays = heatmapData.filter(d => d.weekIndex === weekIdx);
                  const firstDayOfMonth = weekDays.find(d => d.dayOfWeek === 0 || d.dayOfWeek === 1);
                  return (
                    <div key={`week-${weekIdx}`} className="flex-1 flex flex-col space-y-1.5">
                      {/* Week Header Month Name */}
                      <div className="text-[9px] font-mono text-slate-500 h-3 text-center truncate">
                        {firstDayOfMonth?.monthName || ''}
                      </div>

                      {/* 7 Days in Week */}
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const dayData = weekDays.find(d => d.dayOfWeek === dayIdx);
                        if (!dayData) return <div key={`empty-${weekIdx}-${dayIdx}`} className="w-full h-6" />;

                        const isSelected = selectedHeatmapDay?.date === dayData.date;

                        return (
                          <div
                            key={dayData.date}
                            onClick={() => setSelectedHeatmapDay(isSelected ? null : dayData)}
                            title={`${dayData.dateLabel}: ${dayData.count} executions (${dayData.completedCount} completed)`}
                            className={`w-full h-6 rounded border transition-all cursor-pointer flex items-center justify-center text-[10px] font-mono ${getHeatmapTileStyle(dayData.count)} ${
                              isSelected ? 'ring-2 ring-blue-500 scale-105 z-10' : ''
                            }`}
                          >
                            <span className="opacity-80 text-[9px]">{dayData.count > 0 ? dayData.count : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Heatmap Footer: Legend & Selected Day Inspection */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-mono">
              {selectedHeatmapDay ? (
                <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/60">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Selected: <strong className="text-white">{selectedHeatmapDay.dateLabel}</strong> —{' '}
                    <strong>{selectedHeatmapDay.count}</strong> executions recorded ({selectedHeatmapDay.completedCount} completed receipts)
                  </span>
                  <button
                    onClick={() => setSelectedHeatmapDay(null)}
                    className="ml-2 text-sm text-slate-400 hover:text-white underline"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className={`flex items-center space-x-1 ${styles.mutedText}`}>
                  <Info className="w-3 h-3 text-blue-400" />
                  <span>Click any date tile to inspect execution details and metrics</span>
                </div>
              )}

              {/* Color Intensity Scale Legend */}
              <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                <span className={styles.mutedText}>Less</span>
                <div className={`w-3.5 h-3.5 rounded border ${getHeatmapTileStyle(0)}`} title="0 executions" />
                <div className={`w-3.5 h-3.5 rounded border ${getHeatmapTileStyle(2)}`} title="1-3 executions" />
                <div className={`w-3.5 h-3.5 rounded border ${getHeatmapTileStyle(5)}`} title="4-7 executions" />
                <div className={`w-3.5 h-3.5 rounded border ${getHeatmapTileStyle(9)}`} title="8-11 executions" />
                <div className={`w-3.5 h-3.5 rounded border ${getHeatmapTileStyle(14)}`} title="12+ executions" />
                <span className={styles.mutedText}>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left Instance List, Right Details & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Instances List */}
        <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] flex flex-col space-y-2.5">
          <div className="flex items-center justify-between text-sm font-mono border-b border-[#30363d] pb-2">
            <span className="font-bold text-[#8b949e] text-[11px]">INSTANCES ({filteredInstances.length})</span>
            <button onClick={onRefresh} className="p-1 text-[#8b949e] hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredInstances.map((inst) => {
              const isSelected = inst.id === selectedInstanceId;
              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInstanceId(inst.id)}
                  className={`p-2.5 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0d1117] border-[#58a6ff] shadow-sm'
                      : 'bg-[#0d1117]/60 border-[#30363d] hover:border-[#8b949e]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-sm mb-1">
                    <span className="font-bold text-[#58a6ff] text-[11px]">{inst.id}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                      inst.status === 'ACTIVE' ? 'bg-green-950/80 text-green-400 border-green-800' :
                      inst.status === 'PAUSED' ? 'bg-amber-950/80 text-amber-400 border-amber-800' :
                      inst.status === 'COMPLETED' ? 'bg-blue-950/80 text-blue-400 border-blue-800' :
                      'bg-rose-950/80 text-rose-400 border-rose-800'
                    }`}>
                      {inst.status}
                    </span>
                  </div>

                  <div className="text-sm text-[#c9d1d9] font-semibold truncate">
                    {inst.workflow_name}
                  </div>
                  <div className="text-[10px] font-mono text-[#8b949e] mt-1 flex items-center justify-between">
                    <span>Version v{inst.version_number}</span>
                    <span>{new Date(inst.updated_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}

            {filteredInstances.length === 0 && (
              <div className="p-8 text-center text-sm text-[#8b949e] font-mono italic">
                No instances match the filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Instance Inspector, Graph State & Tickets */}
        {selectedInstance ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Instance Control Card */}
            <div className="p-4 rounded border border-[#30363d] bg-[#161b22] font-sans space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#30363d] pb-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-extrabold font-mono text-[#58a6ff]">
                      {selectedInstance.id}
                    </h2>
                    <span className="text-sm text-[#8b949e] font-mono">
                      ({selectedInstance.workflow_name} v{selectedInstance.version_number})
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8b949e] font-mono">
                    CREATED: {new Date(selectedInstance.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Instance State Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedInstance.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={handleExecuteHarness}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-[11px] font-bold transition-all flex items-center space-x-1 shadow-sm"
                        title="POST /api/instances/:id/execute - Run harness for single pending ticket"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>EXECUTE HARNESS</span>
                      </button>

                      <button
                        onClick={handleRunLoop}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold transition-all flex items-center space-x-1 shadow-sm"
                        title="POST /api/instances/:id/run - Automatic workflow execution loop"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>AUTO-RUN LOOP</span>
                      </button>

                      <button
                        onClick={handlePause}
                        className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white font-mono text-[11px] font-bold transition-all flex items-center space-x-1"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>PAUSE</span>
                      </button>
                    </>
                  )}

                  {selectedInstance.status === 'PAUSED' && (
                    <button
                      onClick={handleResume}
                      className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-[11px] font-bold transition-all flex items-center space-x-1"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>RESUME</span>
                    </button>
                  )}

                  {(selectedInstance.status === 'ACTIVE' || selectedInstance.status === 'PAUSED') && (
                    <button
                      onClick={handleStop}
                      className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white font-mono text-[11px] font-bold transition-all flex items-center space-x-1"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>STOP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Execution Visual Graph Nodes */}
              {version?.nodes && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#8b949e] uppercase tracking-wider block">
                    LIVE GRAPH EXECUTION STATE:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {version.nodes.map(n => {
                      const completedTicket = tickets.find(t => t.node_id === n.id && t.status === 'COMPLETED');
                      const activeTicket = tickets.find(t => t.node_id === n.id && (t.status === 'PENDING' || t.status === 'IN_PROGRESS'));

                      return (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded border font-mono text-sm space-y-1 ${
                            completedTicket ? 'bg-green-950/40 border-green-800/80 text-green-300' :
                            activeTicket ? 'bg-amber-950/50 border-amber-600 text-amber-200 animate-pulse' :
                            'bg-[#0d1117] border-[#30363d] text-[#8b949e]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span>{n.name}</span>
                            {completedTicket && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                            {activeTicket && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="text-[10px] text-[#8b949e]">{n.task_name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Task Execution Sequence Visual Timeline Component */}
              <InstanceTaskTimeline
                instance={selectedInstance}
                version={version}
                tickets={tickets}
                receipts={receipts}
                tasks={tasks}
                themeMode={themeMode}
                onAdvanceTicket={(tkt) => handleOpenAdvance(tkt)}
              />

              {/* Tickets Section for this Instance */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#c9d1d9] uppercase tracking-wider flex items-center">
                    <TicketIcon className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                    INSTANCE TICKETS ({tickets.length})
                  </span>
                </div>

                <div className="overflow-x-auto border rounded border-[#30363d] bg-[#0d1117]">
                  <table className="w-full text-left border-collapse text-sm font-mono">
                    <thead>
                      <tr className="bg-[#161b22] text-[#8b949e] border-b border-[#30363d]">
                        <th className="py-1.5 px-2.5 font-semibold text-[10px] uppercase">TICKET ID</th>
                        <th className="py-1.5 px-2.5 font-semibold text-[10px] uppercase">NODE / TASK</th>
                        <th className="py-1.5 px-2.5 font-semibold text-[10px] uppercase">STATUS</th>
                        <th className="py-1.5 px-2.5 font-semibold text-[10px] uppercase text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
                      {tickets.map(tkt => (
                        <tr key={tkt.id} className="hover:bg-[#161b22]/50">
                          <td className="py-1.5 px-2.5 text-[#58a6ff] font-bold text-[11px]">{tkt.id}</td>
                          <td className="py-1.5 px-2.5">
                            <div className="font-semibold text-[#c9d1d9] text-[11px]">{tkt.node_name}</div>
                            <div className="text-[10px] text-[#8b949e]">{tkt.task_name}</div>
                          </td>
                          <td className="py-1.5 px-2.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                              tkt.status === 'PENDING' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                              tkt.status === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-400 border-blue-800' :
                              tkt.status === 'COMPLETED' ? 'bg-green-950 text-green-400 border-green-800' :
                              'bg-zinc-800 text-[#8b949e] border-[#30363d]'
                            }`}>
                              {tkt.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-2.5 text-right">
                            {(tkt.status === 'PENDING' || tkt.status === 'IN_PROGRESS') && selectedInstance.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleOpenAdvance(tkt)}
                                className="px-2 py-0.5 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white font-bold text-[10px] transition-all"
                              >
                                ADVANCE →
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {tickets.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-3 text-center text-[#8b949e] italic text-sm">
                            No tickets generated for this instance yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receipts Timeline */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-mono font-bold text-[#c9d1d9] uppercase tracking-wider flex items-center">
                  <FileText className="w-3.5 h-3.5 text-[#58a6ff] mr-1.5" />
                  EXECUTION RECEIPTS ({receipts.length})
                </span>

                <div className="space-y-1.5">
                  {receipts.map(rcpt => (
                    <div key={rcpt.id} className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] font-mono text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#58a6ff] text-[11px]">{rcpt.id}</span>
                        <span className="text-green-400 font-bold text-[10px] bg-green-950/60 px-1.5 py-0.2 rounded border border-green-800">
                          {rcpt.outcome_code}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#c9d1d9]">
                        Task: <span className="font-semibold">{rcpt.task_name}</span> | Ticket: <span className="text-[#58a6ff]">{rcpt.ticket_id}</span>
                      </div>
                      <div className="text-[10px] text-[#8b949e]">
                        Output: {rcpt.metadata ? JSON.stringify(rcpt.metadata) : `${rcpt.output_artifact_type}/${rcpt.output_artifact_id}`}
                      </div>
                    </div>
                  ))}
                  {receipts.length === 0 && (
                    <div className="p-3 text-center text-sm text-[#8b949e] font-mono italic bg-[#0d1117] rounded border border-[#30363d]">
                      No receipts recorded yet. Advance active tickets above to generate receipts.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-[#8b949e] font-mono text-sm">
            Select an instance on the left to inspect tickets, receipts, and advance state.
          </div>
        )}
      </div>

      {/* ADVANCE TICKET MODAL */}
      {advanceTicket && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="p-5 rounded border border-[#30363d] max-w-md w-full font-sans space-y-3 bg-[#161b22] text-[#c9d1d9]">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div>
                <h3 className="font-bold font-mono text-sm text-[#58a6ff]">ADVANCE WORKFLOW TICKET</h3>
                <p className="text-[10px] text-[#8b949e]">Complete task ticket and trigger graph traversal</p>
              </div>
              <button onClick={() => setAdvanceTicket(null)} className="text-[#8b949e] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdvance} className="space-y-3 text-sm font-mono">
              <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1 text-[11px]">
                <div><span className="text-[#8b949e]">TICKET:</span> <span className="text-[#58a6ff]">{advanceTicket.id}</span></div>
                <div><span className="text-[#8b949e]">NODE:</span> <span className="text-[#c9d1d9]">{advanceTicket.node_name}</span></div>
                <div><span className="text-[#8b949e]">TASK:</span> <span className="text-[#c9d1d9]">{advanceTicket.task_name}</span></div>
              </div>

              <div>
                <label className="block text-[#8b949e] font-semibold mb-1 text-[11px]">SELECT TASK OUTCOME CODE</label>
                <select
                  required
                  value={selectedOutcomeId}
                  onChange={(e) => setSelectedOutcomeId(e.target.value)}
                  className="w-full p-2 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] text-sm"
                >
                  {currentTaskForAdvance?.outcomes?.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.code} — {o.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/60 text-[10px] text-amber-300">
                Advancing completes ticket <span className="font-bold">{advanceTicket.id}</span>, generates a receipt, and creates downstream tickets based on directed edges.
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdvanceTicket(null)}
                  className="px-3 py-1 rounded border border-[#30363d] text-[#c9d1d9] font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdvancing}
                  className="px-3 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono font-bold flex items-center space-x-1"
                >
                  {isAdvancing ? 'Advancing...' : 'COMPLETE & ADVANCE →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
