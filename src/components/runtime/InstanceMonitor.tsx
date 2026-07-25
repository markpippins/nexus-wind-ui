import React, { useState, useEffect } from 'react';
import {
  PlayCircle, PauseCircle, StopCircle, CheckCircle2, Clock, AlertTriangle,
  Play, RefreshCw, ChevronRight, Ticket as TicketIcon, Check, ArrowRight,
  Layers, Code, FileText, Zap, ShieldAlert, X
} from 'lucide-react';
import { Instance, Ticket, Receipt, Task, Outcome, WorkflowVersion } from '../../types/wind';
import { api } from '../../services/api';

interface InstanceMonitorProps {
  instances: Instance[];
  tasks: Task[];
  isDark: boolean;
  onRefresh: () => void;
  initialSelectedInstanceId?: string;
}

export const InstanceMonitor: React.FC<InstanceMonitorProps> = ({
  instances,
  tasks,
  isDark,
  onRefresh,
  initialSelectedInstanceId
}) => {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(
    initialSelectedInstanceId || instances[0]?.id || ''
  );
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [version, setVersion] = useState<WorkflowVersion | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('');

  // Advance Ticket Modal
  const [advanceTicket, setAdvanceTicket] = useState<Ticket | null>(null);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>('');
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    if (initialSelectedInstanceId) {
      setSelectedInstanceId(initialSelectedInstanceId);
    } else if (instances.length > 0 && !selectedInstanceId) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, initialSelectedInstanceId]);

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
        setReceipts(rcpts.filter(r => r.instance_id === instId));

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

  const handleOpenAdvance = (tkt: Ticket) => {
    setAdvanceTicket(tkt);
    const task = tasks.find(t => t.id === tkt.task_id);
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

  const currentTaskForAdvance = advanceTicket ? tasks.find(t => t.id === advanceTicket.task_id) : null;

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto font-sans bg-[#0b0e14]">
      {/* Top Header */}
      <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            <PlayCircle className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold font-mono text-[#c9d1d9] uppercase">
              RUNTIME INSTANCES & ADVANCE DEBUGGER
            </h1>
            <p className="text-[11px] text-[#8b949e]">
              Traverse execution state graphs, complete tickets with outcomes, and inspect receipt history
            </p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-[#8b949e]">STATUS FILTER:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded text-xs font-mono border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
          >
            <option value="">All Statuses ({instances.length})</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Main Split Grid: Left Instance List, Right Details & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Instances List */}
        <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] flex flex-col space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono border-b border-[#30363d] pb-2">
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
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
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

                  <div className="text-xs text-[#c9d1d9] font-semibold truncate">
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
              <div className="p-8 text-center text-xs text-[#8b949e] font-mono italic">
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
                    <span className="text-xs text-[#8b949e] font-mono">
                      ({selectedInstance.workflow_name} v{selectedInstance.version_number})
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8b949e] font-mono">
                    CREATED: {new Date(selectedInstance.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Instance State Actions */}
                <div className="flex items-center space-x-2">
                  {selectedInstance.status === 'ACTIVE' && (
                    <button
                      onClick={handlePause}
                      className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white font-mono text-[11px] font-bold transition-all flex items-center space-x-1"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span>PAUSE</span>
                    </button>
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
                          className={`p-2.5 rounded border font-mono text-xs space-y-1 ${
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

              {/* Tickets Section for this Instance */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#c9d1d9] uppercase tracking-wider flex items-center">
                    <TicketIcon className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
                    INSTANCE TICKETS ({tickets.length})
                  </span>
                </div>

                <div className="overflow-x-auto border rounded border-[#30363d] bg-[#0d1117]">
                  <table className="w-full text-left border-collapse text-xs font-mono">
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
                          <td colSpan={4} className="py-3 text-center text-[#8b949e] italic text-xs">
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
                    <div key={rcpt.id} className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] font-mono text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#58a6ff] text-[11px]">{rcpt.id}</span>
                        <span className="text-green-400 font-bold text-[10px] bg-green-950/60 px-1.5 py-0.2 rounded border border-green-800">
                          {rcpt.outcome_code}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#c9d1d9]">
                        Task: <span className="font-semibold">{rcpt.task_name}</span> | Node: <span className="text-[#58a6ff]">{rcpt.node_name}</span>
                      </div>
                      <div className="text-[10px] text-[#8b949e]">
                        Output Data: {JSON.stringify(rcpt.output_data)}
                      </div>
                    </div>
                  ))}
                  {receipts.length === 0 && (
                    <div className="p-3 text-center text-xs text-[#8b949e] font-mono italic bg-[#0d1117] rounded border border-[#30363d]">
                      No receipts recorded yet. Advance active tickets above to generate receipts.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-[#8b949e] font-mono text-xs">
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
                <h3 className="font-bold font-mono text-xs text-[#58a6ff]">ADVANCE WORKFLOW TICKET</h3>
                <p className="text-[10px] text-[#8b949e]">Complete task ticket and trigger graph traversal</p>
              </div>
              <button onClick={() => setAdvanceTicket(null)} className="text-[#8b949e] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdvance} className="space-y-3 text-xs font-mono">
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
                  className="w-full p-2 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] text-xs"
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
