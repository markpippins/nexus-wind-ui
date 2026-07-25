import React, { useState } from 'react';
import {
  Ticket, Search, Filter, Play, CheckCircle2, XCircle, Clock,
  Maximize2, Minimize2, ChevronRight, Check, RefreshCw
} from 'lucide-react';
import { Ticket as TicketType, Title, Task } from '../../types/wind';
import { api } from '../../services/api';

interface TicketQueueProps {
  tickets: TicketType[];
  titles: Title[];
  tasks: Task[];
  isDark: boolean;
  onRefresh: () => void;
  onNavigateInstance: (instanceId: string) => void;
}

export const TicketQueue: React.FC<TicketQueueProps> = ({
  tickets,
  titles,
  tasks,
  isDark,
  onRefresh,
  onNavigateInstance
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [titleFilter, setTitleFilter] = useState<string>('');
  const [isCompact, setIsCompact] = useState(true);

  // Status Change handlers
  const handleSetStatus = async (ticketId: string, status: 'IN_PROGRESS' | 'CANCELLED') => {
    try {
      if (status === 'CANCELLED') {
        await api.cancelTicket(ticketId);
      } else {
        await api.updateTicketStatus(ticketId, status);
      }
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to update ticket status');
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (titleFilter && t.title_id !== titleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.id.toLowerCase().includes(q) ||
        (t.node_name && t.node_name.toLowerCase().includes(q)) ||
        (t.task_name && t.task_name.toLowerCase().includes(q)) ||
        (t.title_name && t.title_name.toLowerCase().includes(q)) ||
        (t.instance_id && t.instance_id.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto font-sans bg-[#0b0e14]">
      {/* Header & Controls Bar */}
      <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold font-mono text-[#c9d1d9] uppercase">
              HIGH-CONTRAST TICKET EXECUTION QUEUE
            </h1>
            <p className="text-[11px] text-[#8b949e]">
              Filter work assignments by role title, claim tickets, and trigger advance handlers
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="px-2 py-1 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] hover:text-white text-xs font-mono font-semibold flex items-center space-x-1"
            title="Toggle Row Density"
          >
            {isCompact ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCompact ? 'COMPACT' : 'EXPANDED'}</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-1 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] hover:text-white"
            title="Refresh Tickets"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2.5 rounded border border-[#30363d] bg-[#161b22] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#8b949e]" />
            <input
              type="text"
              placeholder="Search ID, task, title or instance..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded text-xs font-mono border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded text-xs font-mono border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
          >
            <option value="">All Statuses ({tickets.length})</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="px-2.5 py-1 rounded text-xs font-mono border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
          >
            <option value="">All Assigned Titles</option>
            {titles.map(t => (
              <option key={t.id} value={t.id}>
                {t.display_name} ({t.office_name})
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] font-mono text-[#8b949e]">
          SHOWING: <span className="font-bold text-[#58a6ff]">{filteredTickets.length}</span> / {tickets.length} TICKETS
        </div>
      </div>

      {/* High Density High Contrast Data Table */}
      <div className="rounded border border-[#30363d] bg-[#161b22] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-[#1c2128] text-[#8b949e] border-b border-[#30363d] select-none text-[10px]">
                <th className="py-2 px-3 font-bold uppercase tracking-wider">TICKET ID</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider">INSTANCE</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider">NODE & TASK</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider">TITLE / ROLE</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider">STATUS</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider">CREATED</th>
                <th className="py-2 px-3 font-bold uppercase tracking-wider text-right">QUICK ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
              {filteredTickets.map(tkt => (
                <tr key={tkt.id} className={`hover:bg-[#1f242d] transition-colors ${
                  tkt.status === 'IN_PROGRESS' ? 'bg-amber-950/20' : ''
                }`}>
                  <td className={`${isCompact ? 'py-1' : 'py-2.5'} px-3 font-bold text-[#58a6ff] select-all`}>
                    {tkt.id}
                  </td>

                  <td className={`${isCompact ? 'py-1' : 'py-2.5'} px-3 font-semibold`}>
                    <button
                      onClick={() => onNavigateInstance(tkt.instance_id)}
                      className="text-[#c9d1d9] hover:text-[#58a6ff] flex items-center underline decoration-[#30363d] underline-offset-2"
                    >
                      {tkt.instance_id}
                      <ChevronRight className="w-3 h-3 ml-0.5 text-[#8b949e]" />
                    </button>
                  </td>

                  <td className={`${isCompact ? 'py-1' : 'py-2.5'} px-3`}>
                    <div className="font-bold text-[#c9d1d9]">{tkt.node_name}</div>
                    <div className="text-[10px] text-[#8b949e]">{tkt.task_name}</div>
                  </td>

                  <td className={`${isCompact ? 'py-1' : 'py-2.5'} px-3 text-[#c9d1d9]`}>
                    {tkt.title_name || 'Assigned Title'}
                  </td>

                  <td className={`${isCompact ? 'py-1' : 'py-2.5'} px-3`}>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                      tkt.status === 'PENDING' ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                      tkt.status === 'IN_PROGRESS' ? 'bg-blue-950/80 text-blue-300 border-blue-800' :
                      tkt.status === 'COMPLETED' ? 'bg-green-950/80 text-green-300 border-green-800' :
                      'bg-rose-950/80 text-rose-300 border-rose-800'
                    }`}>
                      {tkt.status}
                    </span>
                  </td>

                  <td className={`${isCompact ? 'py-1' : 'py-2.5'} px-3 text-[10px] text-[#8b949e]`}>
                    {new Date(tkt.created_at).toLocaleTimeString()}
                  </td>

                  <td className={`${isCompact ? 'py-1' : 'py-2.5'} px-3 text-right space-x-1.5`}>
                    {tkt.status === 'PENDING' && (
                      <button
                        onClick={() => handleSetStatus(tkt.id, 'IN_PROGRESS')}
                        className="px-2 py-0.5 rounded bg-blue-700 hover:bg-blue-600 text-white font-bold text-[10px]"
                        title="Mark IN_PROGRESS"
                      >
                        CLAIM
                      </button>
                    )}

                    {(tkt.status === 'PENDING' || tkt.status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => onNavigateInstance(tkt.instance_id)}
                        className="px-2 py-0.5 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white font-bold text-[10px]"
                      >
                        ADVANCE
                      </button>
                    )}

                    {(tkt.status === 'PENDING' || tkt.status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => handleSetStatus(tkt.id, 'CANCELLED')}
                        className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-300 font-bold text-[10px] border border-rose-800"
                        title="Cancel ticket"
                      >
                        CANCEL
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8b949e] italic text-xs">
                    No tickets found matching the search and filter constraints.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
