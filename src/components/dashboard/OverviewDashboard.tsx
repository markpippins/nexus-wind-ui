import React from 'react';
import {
  Play, Activity, Ticket, GitMerge, CheckCircle, Clock, AlertTriangle,
  Building, ShieldCheck, ArrowUpRight, BarChart3, ChevronRight, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Instance, Ticket as TicketType, Workflow, Receipt } from '../../types/wind';
import { ThemeMode, getThemeStyles } from '../../types/theme';

interface OverviewDashboardProps {
  instances: Instance[];
  tickets: TicketType[];
  workflows: Workflow[];
  receipts: Receipt[];
  isDark?: boolean;
  themeMode?: ThemeMode;
  onNavigateTab: (tab: 'workflows' | 'instances' | 'tickets' | 'tackle') => void;
  onQuickStartInstance: (versionId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  instances,
  tickets,
  workflows,
  receipts,
  isDark = true,
  themeMode = 'dark' as ThemeMode,
  onNavigateTab,
  onQuickStartInstance
}) => {
  const styles = getThemeStyles(themeMode);

  const activeInstances = instances.filter(i => i.status === 'ACTIVE');
  const pendingTickets = tickets.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const completedReceipts = receipts.length;

  // Chart 1: Status Distribution
  const statusData = [
    { name: 'ACTIVE', count: instances.filter(i => i.status === 'ACTIVE').length, color: '#10b981' },
    { name: 'PAUSED', count: instances.filter(i => i.status === 'PAUSED').length, color: '#f59e0b' },
    { name: 'COMPLETED', count: instances.filter(i => i.status === 'COMPLETED').length, color: '#06b6d4' },
    { name: 'FAILED', count: instances.filter(i => i.status === 'FAILED').length, color: '#f43f5e' },
  ];

  // Chart 2: Throughput simulation
  const throughputData = [
    { time: '08:00', tickets: 4, receipts: 3 },
    { time: '10:00', tickets: 8, receipts: 7 },
    { time: '12:00', tickets: 15, receipts: 12 },
    { time: '14:00', tickets: 22, receipts: 19 },
    { time: '16:00', tickets: 18, receipts: 17 },
    { time: '18:00', tickets: 26, receipts: 24 },
  ];

  // Chart 3: Outcome Ratios
  const outcomeCounts: Record<string, number> = {};
  receipts.forEach(r => {
    outcomeCounts[r.outcome_code] = (outcomeCounts[r.outcome_code] || 0) + 1;
  });
  if (Object.keys(outcomeCounts).length === 0) {
    outcomeCounts['build_passed'] = 8;
    outcomeCounts['sec_clean'] = 6;
    outcomeCounts['tests_passed'] = 5;
    outcomeCounts['rollout_complete'] = 3;
  }

  const outcomeData = Object.entries(outcomeCounts).map(([code, count]) => ({
    code,
    count
  }));

  const activeWorkflowsWithVersion = workflows.filter(w => w.active_version_id);

  return (
    <div className={`p-4 space-y-4 max-w-[1600px] mx-auto font-sans min-h-full ${styles.bg}`}>
      {/* Top Banner / Quick Launcher */}
      <div className={`p-3.5 rounded border ${styles.card} flex flex-col md:flex-row items-start md:items-center justify-between gap-3`}>
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <Zap className={`w-4 h-4 ${themeMode === 'steel' ? 'text-cyan-400' : 'text-[#58a6ff]'}`} />
            <h1 className={`text-sm font-bold tracking-tight font-mono uppercase ${styles.primaryText}`}>
              wind-srv Workflow Telemetry Dashboard
            </h1>
          </div>
          <p className={`text-[11px] ${styles.mutedText}`}>
            Real-time monitoring for workflow graphs, tickets, runtime instances, and execution receipts.
          </p>
        </div>

        {/* Quick Launch Dropdown */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button
            onClick={() => onNavigateTab('tackle')}
            className={`flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold font-mono transition-all shadow-sm w-full md:w-auto border ${
              themeMode === 'light'
                ? 'bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-200'
                : themeMode === 'steel'
                ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300 hover:bg-cyan-900'
                : 'bg-blue-950/80 hover:bg-blue-900 border-blue-800 text-blue-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>TACKLE AI ENGINE</span>
          </button>

          {activeWorkflowsWithVersion.length > 0 && (
            <button
              onClick={() => onQuickStartInstance(activeWorkflowsWithVersion[0].active_version_id!)}
              className={`flex items-center justify-center space-x-2 px-3 py-1.5 rounded text-xs font-bold font-mono transition-all shadow-sm active:scale-95 w-full md:w-auto ${styles.accentBtn}`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start "{activeWorkflowsWithVersion[0].name}"</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Active Instances */}
        <div
          onClick={() => onNavigateTab('instances')}
          className={`p-3.5 rounded border ${styles.card} cursor-pointer transition-all hover:border-[#58a6ff]/60`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${styles.mutedText}`}>
              Active Instances
            </span>
            <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-xl font-extrabold font-mono ${styles.primaryText}`}>
              {activeInstances.length}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center font-mono">
              Total: {instances.length}
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 2: Pending Tickets */}
        <div
          onClick={() => onNavigateTab('tickets')}
          className={`p-3.5 rounded border ${styles.card} cursor-pointer transition-all hover:border-amber-500/60`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${styles.mutedText}`}>
              Pending Tickets
            </span>
            <div className="p-1.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-400">
              <Ticket className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-xl font-extrabold font-mono ${styles.primaryText}`}>
              {pendingTickets.length}
            </span>
            <span className="text-[11px] text-amber-400 font-medium flex items-center font-mono">
              Total: {tickets.length}
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Workflow Versions */}
        <div
          onClick={() => onNavigateTab('workflows')}
          className={`p-3.5 rounded border ${styles.card} cursor-pointer transition-all hover:border-purple-500/60`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${styles.mutedText}`}>
              Defined Workflows
            </span>
            <div className="p-1.5 rounded bg-purple-950/40 border border-purple-800/40 text-purple-400">
              <GitMerge className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-xl font-extrabold font-mono ${styles.primaryText}`}>
              {workflows.length}
            </span>
            <span className="text-[11px] text-purple-400 font-medium flex items-center font-mono">
              DAG Schemas
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Execution Receipts */}
        <div
          onClick={() => onNavigateTab('instances')}
          className={`p-3.5 rounded border ${styles.card} cursor-pointer transition-all hover:border-[#58a6ff]/60`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${styles.mutedText}`}>
              Execution Receipts
            </span>
            <div className="p-1.5 rounded bg-blue-950/40 border border-blue-800/40 text-blue-400">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-xl font-extrabold font-mono ${styles.primaryText}`}>
              {completedReceipts}
            </span>
            <span className={`text-[11px] ${themeMode === 'steel' ? 'text-cyan-400' : 'text-[#58a6ff]'} font-medium flex items-center font-mono`}>
              100% Traceable
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Ticket Execution Velocity */}
        <div className={`lg:col-span-2 p-4 rounded border ${styles.card}`}>
          <div className={`flex items-center justify-between mb-3 border-b ${styles.border} pb-2`}>
            <div>
              <h2 className={`text-xs font-bold font-mono uppercase ${styles.primaryText}`}>
                TICKET & RECEIPT PROCESSING VELOCITY
              </h2>
              <p className={`text-[11px] ${styles.mutedText}`}>Created tickets vs completed receipts throughput</p>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className={`flex items-center ${themeMode === 'steel' ? 'text-cyan-400' : 'text-[#58a6ff]'}`}>
                <span className={`w-2 h-2 rounded-full mr-1 ${themeMode === 'steel' ? 'bg-cyan-400' : 'bg-[#58a6ff]'}`} /> Receipts
              </span>
              <span className="flex items-center text-purple-400"><span className="w-2 h-2 rounded-full bg-purple-400 mr-1" /> Tickets</span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData}>
                <defs>
                  <linearGradient id="receiptGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={themeMode === 'steel' ? '#38bdf8' : '#58a6ff'} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={themeMode === 'steel' ? '#38bdf8' : '#58a6ff'} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke={themeMode === 'light' ? '#64748b' : '#8b949e'} fontSize={10} tickLine={false} />
                <YAxis stroke={themeMode === 'light' ? '#64748b' : '#8b949e'} fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: themeMode === 'light' ? '#ffffff' : themeMode === 'steel' ? '#0f172a' : '#1c2128',
                    borderColor: themeMode === 'light' ? '#cbd5e1' : themeMode === 'steel' ? '#334155' : '#30363d',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: themeMode === 'light' ? '#0f172a' : '#c9d1d9'
                  }}
                />
                <Area type="monotone" dataKey="receipts" stroke={themeMode === 'steel' ? '#38bdf8' : '#58a6ff'} fillOpacity={1} fill="url(#receiptGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="tickets" stroke="#a855f7" fillOpacity={1} fill="url(#ticketGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Instance Status Ratios */}
        <div className={`p-4 rounded border ${styles.card} flex flex-col justify-between`}>
          <div>
            <h2 className={`text-xs font-bold font-mono uppercase border-b ${styles.border} pb-2 ${styles.primaryText}`}>
              INSTANCE RUNTIME STATUS
            </h2>
            <p className={`text-[11px] ${styles.mutedText} mt-1`}>Current state breakdown across instances</p>
          </div>

          <div className="h-44 my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: themeMode === 'light' ? '#ffffff' : themeMode === 'steel' ? '#0f172a' : '#1c2128',
                    borderColor: themeMode === 'light' ? '#cbd5e1' : themeMode === 'steel' ? '#334155' : '#30363d',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: themeMode === 'light' ? '#0f172a' : '#c9d1d9'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            {statusData.map(st => (
              <div key={st.name} className={`flex items-center justify-between p-1.5 rounded border ${styles.subCard}`}>
                <span className={`flex items-center text-[10px] ${styles.mutedText}`}>
                  <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: st.color }} />
                  {st.name}
                </span>
                <span className={`font-bold ${styles.primaryText}`}>{st.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Outcome Frequency & High-Density Ticket Table Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task Outcome Frequency */}
        <div className={`p-4 rounded border ${styles.card}`}>
          <h2 className={`text-xs font-bold font-mono uppercase border-b ${styles.border} pb-2 ${styles.primaryText}`}>
            TASK OUTCOME FREQUENCY
          </h2>
          <p className={`text-[11px] ${styles.mutedText} my-2`}>Distribution of completed task codes</p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomeData} layout="vertical">
                <XAxis type="number" stroke={themeMode === 'light' ? '#64748b' : '#8b949e'} fontSize={10} hide />
                <YAxis dataKey="code" type="category" stroke={themeMode === 'light' ? '#64748b' : '#8b949e'} fontSize={10} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: themeMode === 'light' ? '#ffffff' : themeMode === 'steel' ? '#0f172a' : '#1c2128',
                    borderColor: themeMode === 'light' ? '#cbd5e1' : themeMode === 'steel' ? '#334155' : '#30363d',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: themeMode === 'light' ? '#0f172a' : '#c9d1d9'
                  }}
                />
                <Bar dataKey="count" fill={themeMode === 'steel' ? '#06b6d4' : '#38bdf8'} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High-Contrast Dense Active Tickets List */}
        <div className={`lg:col-span-2 p-4 rounded border ${styles.card} flex flex-col justify-between`}>
          <div>
            <div className={`flex items-center justify-between mb-2 border-b ${styles.border} pb-2`}>
              <div>
                <h2 className={`text-xs font-bold font-mono uppercase ${styles.primaryText}`}>
                  LIVE WORKFLOW TICKETS MATRIX
                </h2>
                <p className={`text-[11px] ${styles.mutedText}`}>High-density pending work assignments across titles</p>
              </div>
              <button
                onClick={() => onNavigateTab('tickets')}
                className={`text-[11px] font-mono font-bold flex items-center hover:underline ${themeMode === 'steel' ? 'text-cyan-400' : 'text-[#58a6ff]'}`}
              >
                VIEW QUEUE <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            {/* Dense Data Table */}
            <div className={`overflow-x-auto border rounded ${styles.border} ${styles.subCard}`}>
              <table className="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                  <tr className={`border-b ${styles.border} text-[10px] font-semibold uppercase ${styles.mutedText}`}>
                    <th className="py-1.5 px-3">TICKET ID</th>
                    <th className="py-1.5 px-3">WORKFLOW / NODE</th>
                    <th className="py-1.5 px-3">ROLE / TITLE</th>
                    <th className="py-1.5 px-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${styles.border} ${styles.primaryText}`}>
                  {tickets.slice(0, 4).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-500/10 transition-colors">
                      <td className={`py-1.5 px-3 font-mono ${themeMode === 'steel' ? 'text-cyan-400' : 'text-[#58a6ff]'}`}>{t.id}</td>
                      <td className="py-1.5 px-3">
                        <div className={`font-semibold ${styles.primaryText}`}>{t.workflow_name || 'Workflow'}</div>
                        <div className={`text-[10px] ${styles.mutedText}`}>node: {t.node_name}</div>
                      </td>
                      <td className={`py-1.5 px-3 ${styles.mutedText}`}>{t.title_name || 'Assigned Title'}</td>
                      <td className="py-1.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          t.status === 'PENDING' ? 'bg-amber-900/30 text-amber-400 border-amber-800' :
                          t.status === 'IN_PROGRESS' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                          t.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400 border-green-800' :
                          'bg-gray-700 text-gray-300 border-gray-600'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan={4} className={`py-6 text-center italic ${styles.mutedText}`}>
                        No active tickets in queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
