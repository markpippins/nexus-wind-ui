import React, { useState } from 'react';
import {
  Building2, Users, CheckSquare, Plus, Trash2, Edit, Code2, ChevronRight,
  X, Save, FileJson, AlertCircle, Shield
} from 'lucide-react';
import { Office, Title, Task, Outcome, Role } from '../../types/wind';
import { api } from '../../services/api';

interface OfficeManagerProps {
  offices: Office[];
  titles: Title[];
  tasks: Task[];
  outcomes: Outcome[];
  roles: Role[];
  isDark: boolean;
  onRefresh: () => void;
}

export const OfficeManager: React.FC<OfficeManagerProps> = ({
  offices,
  titles,
  tasks,
  outcomes,
  roles,
  isDark,
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'offices' | 'titles' | 'tasks'>('offices');

  // Modals
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [officeName, setOfficeName] = useState('');
  const [officeDesc, setOfficeDesc] = useState('');

  const [showTitleModal, setShowTitleModal] = useState(false);
  const [titleOfficeId, setTitleOfficeId] = useState('');
  const [titleRoleId, setTitleRoleId] = useState('');
  const [titleName, setTitleName] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskOfficeId, setTaskOfficeId] = useState('');
  const [taskTitleId, setTaskTitleId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskInputSpecJson, setTaskInputSpecJson] = useState('{\n  "branch": "string"\n}');

  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [outcomeTaskId, setOutcomeTaskId] = useState('');
  const [outcomeCode, setOutcomeCode] = useState('');
  const [outcomeDesc, setOutcomeDesc] = useState('');
  const [outcomeOutputSpecJson, setOutcomeOutputSpecJson] = useState('{\n  "passed": true\n}');

  // Selected Task for viewing outcomes
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Office Handlers
  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeName.trim()) return;
    try {
      await api.createOffice({ name: officeName.trim(), description: officeDesc });
      setShowOfficeModal(false);
      setOfficeName('');
      setOfficeDesc('');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to create office');
    }
  };

  const handleDeleteOffice = async (id: string) => {
    if (!confirm('Delete this office? This will cascade delete its titles, tasks, and outcomes.')) return;
    try {
      await api.deleteOffice(id);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to delete office');
    }
  };

  // Title Handlers
  const handleCreateTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleOfficeId || !titleRoleId || !titleName.trim()) return;
    try {
      await api.createTitle({ office_id: titleOfficeId, role_id: titleRoleId, display_name: titleName.trim() });
      setShowTitleModal(false);
      setTitleOfficeId('');
      setTitleRoleId('');
      setTitleName('');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to create title');
    }
  };

  const handleDeleteTitle = async (id: string) => {
    if (!confirm('Delete this title?')) return;
    try {
      await api.deleteTitle(id);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to delete title');
    }
  };

  // Task Handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskOfficeId || !taskTitleId || !taskName.trim()) return;
    try {
      let parsedSpec = {};
      try {
        parsedSpec = JSON.parse(taskInputSpecJson);
      } catch (err) {
        alert('Invalid JSON for input_spec!');
        return;
      }

      await api.createTask({
        office_id: taskOfficeId,
        title_id: taskTitleId,
        name: taskName.trim(),
        description: taskDesc,
        input_spec: parsedSpec
      });
      setShowTaskModal(false);
      setTaskOfficeId('');
      setTaskTitleId('');
      setTaskName('');
      setTaskDesc('');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to create task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task? This will cascade delete its outcomes.')) return;
    try {
      await api.deleteTask(id);
      if (selectedTask?.id === id) setSelectedTask(null);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to delete task');
    }
  };

  // Outcome Handlers
  const handleCreateOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeTaskId || !outcomeCode.trim()) return;
    try {
      let parsedOutput = {};
      try {
        parsedOutput = JSON.parse(outcomeOutputSpecJson);
      } catch (err) {
        alert('Invalid JSON for output_spec!');
        return;
      }

      await api.createOutcome({
        task_id: outcomeTaskId,
        code: outcomeCode.trim(),
        description: outcomeDesc,
        output_spec: parsedOutput
      });
      setShowOutcomeModal(false);
      setOutcomeCode('');
      setOutcomeDesc('');
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to create outcome');
    }
  };

  const handleDeleteOutcome = async (id: string) => {
    try {
      await api.deleteOutcome(id);
      onRefresh();
    } catch (e: any) {
      alert(e.message || 'Failed to delete outcome');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto font-sans bg-[#0b0e14]">
      {/* Top Header */}
      <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-blue-950/40 text-blue-400 border border-blue-800/40">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold font-mono text-[#c9d1d9] uppercase">
              OFFICES, TITLES & TASK SCHEMAS
            </h1>
            <p className="text-[11px] text-[#8b949e]">
              Define organization offices, role bindings via v-roles, tasks and outcome contracts
            </p>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center space-x-1.5 font-mono text-xs">
          <button
            onClick={() => setActiveSubTab('offices')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
              activeSubTab === 'offices'
                ? 'bg-[#1f6feb] text-white border-[#388bfd]'
                : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
            }`}
          >
            OFFICES ({offices.length})
          </button>

          <button
            onClick={() => setActiveSubTab('titles')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
              activeSubTab === 'titles'
                ? 'bg-[#1f6feb] text-white border-[#388bfd]'
                : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
            }`}
          >
            TITLES ({titles.length})
          </button>

          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
              activeSubTab === 'tasks'
                ? 'bg-[#1f6feb] text-white border-[#388bfd]'
                : 'bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:text-white'
            }`}
          >
            TASKS & OUTCOMES ({tasks.length})
          </button>
        </div>
      </div>

      {/* SUB TAB 1: OFFICES */}
      {activeSubTab === 'offices' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-mono font-bold text-[#8b949e] uppercase">OFFICES REGISTRY</span>
            <button
              onClick={() => setShowOfficeModal(true)}
              className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold font-mono flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW OFFICE</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {offices.map(off => (
              <div key={off.id} className="p-3.5 rounded border border-[#30363d] bg-[#161b22] font-sans space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#58a6ff]">{off.id}</span>
                  <button
                    onClick={() => handleDeleteOffice(off.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#8b949e] hover:text-rose-400 transition-opacity"
                    title="Delete office"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-[#c9d1d9]">{off.name}</h3>
                  <p className="text-[11px] text-[#8b949e] mt-0.5">{off.description || 'No description provided'}</p>
                </div>

                <div className="pt-2 border-t border-[#30363d] text-[10px] font-mono text-[#8b949e] flex justify-between">
                  <span>Titles: {titles.filter(t => t.office_id === off.id).length}</span>
                  <span>Tasks: {tasks.filter(t => t.office_id === off.id).length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB TAB 2: TITLES */}
      {activeSubTab === 'titles' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-mono font-bold text-[#8b949e] uppercase">ROLE-BOUND TITLES (nebula.roles JOIN)</span>
            <button
              onClick={() => {
                if (offices.length === 0) {
                  alert('Create an office first!');
                  return;
                }
                setTitleOfficeId(offices[0].id);
                setTitleRoleId(roles[0]?.id || '');
                setShowTitleModal(true);
              }}
              className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold font-mono flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW TITLE</span>
            </button>
          </div>

          <div className="rounded border border-[#30363d] bg-[#161b22] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[#1c2128] text-[#8b949e] border-b border-[#30363d] text-[10px]">
                  <th className="py-2 px-3 font-semibold uppercase">TITLE ID</th>
                  <th className="py-2 px-3 font-semibold uppercase">DISPLAY NAME</th>
                  <th className="py-2 px-3 font-semibold uppercase">OFFICE NAME</th>
                  <th className="py-2 px-3 font-semibold uppercase">ROLE (nebula.roles)</th>
                  <th className="py-2 px-3 font-semibold uppercase text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d] text-[#c9d1d9]">
                {titles.map(t => (
                  <tr key={t.id} className="hover:bg-[#1f242d]">
                    <td className="py-1.5 px-3 text-[#58a6ff] font-bold text-[11px]">{t.id}</td>
                    <td className="py-1.5 px-3 font-bold text-[#c9d1d9]">{t.display_name}</td>
                    <td className="py-1.5 px-3 text-[#c9d1d9]">{t.office_name}</td>
                    <td className="py-1.5 px-3">
                      <span className="px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800 font-bold text-[9px]">
                        {t.role_name}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      <button onClick={() => handleDeleteTitle(t.id)} className="text-[#8b949e] hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 3: TASKS & OUTCOMES */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-mono font-bold text-[#8b949e] uppercase">TASKS & CONTRACT SPECIFICATIONS</span>
            <button
              onClick={() => {
                if (offices.length === 0 || titles.length === 0) {
                  alert('Create offices and titles first!');
                  return;
                }
                setTaskOfficeId(offices[0].id);
                setTaskTitleId(titles[0].id);
                setShowTaskModal(true);
              }}
              className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold font-mono flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW TASK</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Task List */}
            <div className="lg:col-span-2 p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-2.5">
              <span className="text-[11px] font-mono font-bold text-[#8b949e] uppercase block border-b border-[#30363d] pb-2">
                TASKS ({tasks.length})
              </span>

              <div className="space-y-2">
                {tasks.map(tsk => (
                  <div
                    key={tsk.id}
                    onClick={() => setSelectedTask(tsk)}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedTask?.id === tsk.id
                        ? 'bg-[#0d1117] border-[#58a6ff] shadow-sm'
                        : 'bg-[#0d1117]/60 border-[#30363d] hover:border-[#8b949e]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-[#58a6ff] text-[11px]">{tsk.id}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(tsk.id); }} className="text-[#8b949e] hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-bold text-xs text-[#c9d1d9] mt-0.5">{tsk.name}</h4>
                    <p className="text-[11px] text-[#8b949e] mt-0.5">{tsk.description}</p>

                    <div className="mt-2 pt-2 border-t border-[#30363d] flex items-center justify-between text-[10px] font-mono text-[#8b949e]">
                      <span>Office: {tsk.office_name}</span>
                      <span>Outcomes: {tsk.outcomes?.length || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Task Details & Outcomes Editor */}
            {selectedTask ? (
              <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3">
                <div className="flex items-center justify-between border-b border-[#30363d] pb-2 font-mono text-xs">
                  <span className="font-bold text-[#58a6ff] text-[11px]">INPUT SPEC: {selectedTask.name}</span>
                  <button
                    onClick={() => {
                      setOutcomeTaskId(selectedTask.id);
                      setShowOutcomeModal(true);
                    }}
                    className="px-2 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-[10px]"
                  >
                    + ADD OUTCOME
                  </button>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <span className="text-[#8b949e] font-semibold block text-[11px]">input_spec JSON:</span>
                  <pre className="p-2 rounded bg-[#0d1117] text-green-400 overflow-x-auto text-[10px] border border-[#30363d]">
                    {JSON.stringify(selectedTask.input_spec || {}, null, 2)}
                  </pre>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#30363d]">
                  <span className="text-[11px] font-mono font-bold text-[#c9d1d9] uppercase block">
                    TASK OUTCOMES ({selectedTask.outcomes?.length || 0})
                  </span>

                  <div className="space-y-1.5">
                    {selectedTask.outcomes?.map(out => (
                      <div key={out.id} className="p-2 rounded bg-[#0d1117] border border-[#30363d] font-mono text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-green-400 text-[11px]">{out.code}</span>
                          <button onClick={() => handleDeleteOutcome(out.id)} className="text-[#8b949e] hover:text-rose-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-[#8b949e]">{out.description}</p>
                        <div className="text-[10px] text-[#8b949e] font-mono">
                          output_spec: {JSON.stringify(out.output_spec)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded border border-[#30363d] bg-[#161b22] text-center text-[#8b949e] font-mono text-xs italic">
                Select a task on the left to view input_spec and add outcome codes.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE OFFICE MODAL */}
      {showOfficeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 font-mono text-xs">
          <div className="p-5 rounded border border-[#30363d] max-w-md w-full bg-[#161b22] text-[#c9d1d9] space-y-3">
            <h3 className="font-bold text-xs text-[#58a6ff]">CREATE OFFICE</h3>
            <form onSubmit={handleCreateOffice} className="space-y-3">
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">OFFICE NAME</label>
                <input
                  type="text"
                  required
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
                />
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">DESCRIPTION</label>
                <textarea
                  rows={3}
                  value={officeDesc}
                  onChange={(e) => setOfficeDesc(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button type="button" onClick={() => setShowOfficeModal(false)} className="px-3 py-1 border border-[#30363d] rounded">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-[#238636] hover:bg-[#2ea043] rounded font-bold text-white">Create Office</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TITLE MODAL */}
      {showTitleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 font-mono text-xs">
          <div className="p-5 rounded border border-[#30363d] max-w-md w-full bg-[#161b22] text-[#c9d1d9] space-y-3">
            <h3 className="font-bold text-xs text-[#58a6ff]">CREATE TITLE</h3>
            <form onSubmit={handleCreateTitle} className="space-y-3">
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">OFFICE</label>
                <select
                  value={titleOfficeId}
                  onChange={(e) => setTitleOfficeId(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
                >
                  {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">ROLE (nebula.roles)</label>
                <select
                  value={titleRoleId}
                  onChange={(e) => setTitleRoleId(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
                >
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">DISPLAY NAME</label>
                <input
                  type="text"
                  required
                  value={titleName}
                  onChange={(e) => setTitleName(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button type="button" onClick={() => setShowTitleModal(false)} className="px-3 py-1 border border-[#30363d] rounded">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-[#238636] hover:bg-[#2ea043] rounded font-bold text-white">Create Title</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 font-mono text-xs">
          <div className="p-5 rounded border border-[#30363d] max-w-md w-full bg-[#161b22] text-[#c9d1d9] space-y-3">
            <h3 className="font-bold text-xs text-[#58a6ff]">CREATE TASK</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">OFFICE</label>
                <select
                  value={taskOfficeId}
                  onChange={(e) => setTaskOfficeId(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
                >
                  {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">TITLE</label>
                <select
                  value={taskTitleId}
                  onChange={(e) => setTaskTitleId(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
                >
                  {titles.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">TASK NAME</label>
                <input
                  type="text"
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
                />
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">input_spec (JSON)</label>
                <textarea
                  rows={4}
                  value={taskInputSpecJson}
                  onChange={(e) => setTaskInputSpecJson(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-green-400 font-mono"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-3 py-1 border border-[#30363d] rounded">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-[#238636] hover:bg-[#2ea043] rounded font-bold text-white">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE OUTCOME MODAL */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 font-mono text-xs">
          <div className="p-5 rounded border border-[#30363d] max-w-md w-full bg-[#161b22] text-[#c9d1d9] space-y-3">
            <h3 className="font-bold text-xs text-[#58a6ff]">ADD TASK OUTCOME CODE</h3>
            <form onSubmit={handleCreateOutcome} className="space-y-3">
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">OUTCOME CODE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. build_passed"
                  value={outcomeCode}
                  onChange={(e) => setOutcomeCode(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
                />
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">DESCRIPTION</label>
                <input
                  type="text"
                  value={outcomeDesc}
                  onChange={(e) => setOutcomeDesc(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
                />
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1 text-[11px]">output_spec (JSON)</label>
                <textarea
                  rows={3}
                  value={outcomeOutputSpecJson}
                  onChange={(e) => setOutcomeOutputSpecJson(e.target.value)}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-green-400 font-mono"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button type="button" onClick={() => setShowOutcomeModal(false)} className="px-3 py-1 border border-[#30363d] rounded">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-[#238636] hover:bg-[#2ea043] rounded font-bold text-white">Save Outcome</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
