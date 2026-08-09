import React, { useState, useEffect, useMemo } from 'react';
import {
  GitMerge, Plus, Play, CheckCircle2, ShieldCheck, AlertTriangle,
  X, Trash2, ArrowRight, Zap, Layers, RefreshCw, Eye, Edit3, Code2,
  ListTree, ChevronDown, ChevronRight, Folder, FolderOpen, GitBranch,
  Search, Filter, Maximize2, Minimize2, Sparkles, Terminal, FileCode, Check
} from 'lucide-react';
import {
  Workflow, WorkflowVersion, WorkflowNode, WorkflowEdge, Task, Outcome,
  GraphValidationResult, StructuralValidationResult, Instance
} from '../../types/wind';
import { api } from '../../services/api';

interface WorkflowManagerProps {
  workflows: Workflow[];
  tasks: Task[];
  instances?: Instance[];
  isDark: boolean;
  onRefresh: () => void;
  onStartInstance: (versionId: string) => void;
}

export const WorkflowManager: React.FC<WorkflowManagerProps> = ({
  workflows,
  tasks,
  instances: propInstances,
  isDark,
  onRefresh,
  onStartInstance
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || '');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<WorkflowVersion | null>(null);

  const [validationResult, setValidationResult] = useState<GraphValidationResult | null>(null);
  const [structuralResult, setStructuralResult] = useState<StructuralValidationResult | null>(null);

  // Modals state
  const [showCreateWfModal, setShowCreateWfModal] = useState(false);
  const [wfName, setWfName] = useState('');
  const [wfDesc, setWfDesc] = useState('');

  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [nodeTaskId, setNodeTaskId] = useState('');
  const [nodeName, setNodeName] = useState('');
  const [isEntrypoint, setIsEntrypoint] = useState(false);
  const [isTerminal, setIsTerminal] = useState(false);

  const [showAddEdgeModal, setShowAddEdgeModal] = useState(false);
  const [fromNodeId, setFromNodeId] = useState('');
  const [fromTaskId, setFromTaskId] = useState('');
  const [outcomeId, setOutcomeId] = useState('');
  const [toNodeId, setToNodeId] = useState('');

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  // Hierarchical Tree View Sidebar States
  const [treeSearchTerm, setTreeSearchTerm] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [expandedTreeNodes, setExpandedTreeNodes] = useState<Record<string, boolean>>({});
  const [versionsMap, setVersionsMap] = useState<Record<string, WorkflowVersion[]>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [instances, setInstances] = useState<Instance[]>(propInstances || []);

  const loadHistoricalInstances = async () => {
    try {
      const instList = await api.getInstances();
      setInstances(instList || []);
    } catch (e) {
      console.error('Failed to load historical instances for badge:', e);
    }
  };

  useEffect(() => {
    if (propInstances) {
      setInstances(propInstances);
    } else {
      loadHistoricalInstances();
    }
  }, [propInstances, workflows]);

  const { countsByWfId, maxExecutionCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let maxCount = 0;
    workflows.forEach(wf => {
      const wfVers = versionsMap[wf.id] || wf.versions || [];
      const verIds = new Set(wfVers.map(v => v.id));
      const count = instances.filter(inst => {
        if (inst.workflow_name && inst.workflow_name === wf.name) return true;
        return verIds.has(inst.workflow_version_id);
      }).length;
      counts[wf.id] = count;
      if (count > maxCount) {
        maxCount = count;
      }
    });
    return { countsByWfId: counts, maxExecutionCount: maxCount };
  }, [workflows, instances, versionsMap]);

  const refreshVersionsMap = async () => {
    const map: Record<string, WorkflowVersion[]> = {};
    for (const wf of workflows) {
      try {
        const vers = await api.getVersions(wf.id);
        map[wf.id] = vers;
      } catch (e) {
        console.error(e);
      }
    }
    setVersionsMap(map);
    loadHistoricalInstances();
  };

  useEffect(() => {
    if (workflows.length > 0) {
      refreshVersionsMap();
    }
  }, [workflows]);

  useEffect(() => {
    if (selectedWorkflowId) {
      setExpandedTreeNodes(prev => ({
        ...prev,
        [`wf-${selectedWorkflowId}`]: true,
        [`ver-${selectedVersionId}`]: true
      }));
    }
  }, [selectedWorkflowId, selectedVersionId]);

  const toggleTreeNode = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedTreeNodes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAllTreeNodes = () => {
    const newExpanded: Record<string, boolean> = {};
    workflows.forEach(wf => {
      newExpanded[`wf-${wf.id}`] = true;
      const vers = versionsMap[wf.id] || [];
      vers.forEach(v => {
        newExpanded[`ver-${v.id}`] = true;
        v.nodes?.forEach(n => {
          newExpanded[`node-${n.id}`] = true;
        });
      });
    });
    setExpandedTreeNodes(newExpanded);
  };

  const collapseAllTreeNodes = () => {
    setExpandedTreeNodes({});
  };

  useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflowId) {
      setSelectedWorkflowId(workflows[0].id);
    }
  }, [workflows]);

  useEffect(() => {
    if (selectedWorkflowId) {
      loadVersionsForWorkflow(selectedWorkflowId);
    }
  }, [selectedWorkflowId]);

  useEffect(() => {
    if (selectedVersionId) {
      loadVersionDetails(selectedVersionId);
    }
  }, [selectedVersionId]);

  const loadVersionsForWorkflow = async (wfId: string) => {
    try {
      const vers = await api.getVersions(wfId);
      if (vers.length > 0) {
        const active = vers.find(v => v.is_active) || vers[0];
        setSelectedVersionId(active.id);
      } else {
        setSelectedVersionId('');
        setSelectedVersion(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadVersionDetails = async (verId: string) => {
    try {
      const ver = await api.getVersionById(verId);
      setSelectedVersion(ver);
      if (ver) {
        const graphVal = await api.validateVersion(verId);
        setValidationResult(graphVal);
        const structVal = await api.validateVersionStructure(verId);
        setStructuralResult(structVal);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) return;
    try {
      const created = await api.createWorkflow({ name: wfName, description: wfDesc });
      setShowCreateWfModal(false);
      setWfName('');
      setWfDesc('');
      onRefresh();
      setSelectedWorkflowId(created.id);
      refreshVersionsMap();
    } catch (err: any) {
      alert(err.message || 'Failed to create workflow');
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedWorkflowId) return;
    try {
      const newVer = await api.createVersion({ workflow_id: selectedWorkflowId });
      onRefresh();
      setSelectedVersionId(newVer.id);
      refreshVersionsMap();
    } catch (err: any) {
      alert(err.message || 'Failed to create version');
    }
  };

  const handleActivateVersion = async (verId: string) => {
    try {
      await api.activateVersion(verId);
      onRefresh();
      loadVersionDetails(verId);
      refreshVersionsMap();
    } catch (err: any) {
      alert(err.message || 'Failed to activate version');
    }
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || !nodeTaskId || !nodeName.trim()) return;
    try {
      // Position calculation based on existing nodes
      const count = selectedVersion?.nodes?.length || 0;
      const x = 120 + (count % 3) * 260;
      const y = 140 + Math.floor(count / 3) * 160;

      await api.createNode({
        workflow_version_id: selectedVersionId,
        task_id: nodeTaskId,
        name: nodeName.trim(),
        is_entrypoint: isEntrypoint,
        is_terminal: isTerminal,
        x,
        y
      });
      setShowAddNodeModal(false);
      setNodeTaskId('');
      setNodeName('');
      setIsEntrypoint(false);
      setIsTerminal(false);
      loadVersionDetails(selectedVersionId);
      refreshVersionsMap();
    } catch (err: any) {
      alert(err.message || 'Failed to create node');
    }
  };

  const handleAddEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || !fromNodeId || !outcomeId || !toNodeId) return;
    try {
      await api.createEdge({
        workflow_version_id: selectedVersionId,
        from_node_id: fromNodeId,
        from_task_id: fromTaskId,
        outcome_id: outcomeId,
        to_node_id: toNodeId
      });
      setShowAddEdgeModal(false);
      setFromNodeId('');
      setFromTaskId('');
      setOutcomeId('');
      setToNodeId('');
      loadVersionDetails(selectedVersionId);
      refreshVersionsMap();
    } catch (err: any) {
      alert(err.message || 'Failed to create edge');
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Delete this node and all connected edges?')) return;
    try {
      await api.deleteNode(nodeId);
      if (selectedNode?.id === nodeId) setSelectedNode(null);
      loadVersionDetails(selectedVersionId);
      refreshVersionsMap();
    } catch (err: any) {
      alert(err.message || 'Failed to delete node');
    }
  };

  const handleDeleteEdge = async (edgeId: string) => {
    try {
      await api.deleteEdge(edgeId);
      loadVersionDetails(selectedVersionId);
      refreshVersionsMap();
    } catch (err: any) {
      alert(err.message || 'Failed to delete edge');
    }
  };

  const activeWorkflow = workflows.find(w => w.id === selectedWorkflowId);
  const selectedTaskForEdge = tasks.find(t => t.id === fromTaskId);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto font-sans bg-[#0b0e14]">
      {/* Top Header & Selector Bar */}
      <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-purple-950/40 text-purple-400 border border-purple-800/40">
            <GitMerge className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-mono text-[#c9d1d9] uppercase flex items-center space-x-2">
              <span>WORKFLOW GRAPH & DAG EDITOR</span>
              <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded font-mono border border-purple-800">
                TREE EXPLORER
              </span>
            </h1>
            <p className="text-[11px] text-[#8b949e]">
              Define state machines, task bindings, outcome routes and graph validation rules with hierarchical tree navigation
            </p>
          </div>
        </div>

        {/* Workflow & Version Selectors */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-2.5 py-1 rounded text-sm font-mono font-bold border transition-all flex items-center space-x-1.5 ${
              isSidebarOpen ? 'bg-purple-900/40 border-purple-600 text-purple-300' : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white'
            }`}
            title="Toggle Hierarchical Tree Sidebar"
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>{isSidebarOpen ? 'HIDE TREE' : 'SHOW TREE'}</span>
          </button>

          {/* Workflow Picker */}
          <select
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            className="px-2.5 py-1 rounded text-sm font-mono border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
          >
            {workflows.map(wf => {
              const execCount = countsByWfId[wf.id] || 0;
              const isMostExecuted = maxExecutionCount > 0 && execCount === maxExecutionCount;
              return (
                <option key={wf.id} value={wf.id}>
                  {wf.name} ({wf.version_count || 1} vers) {isMostExecuted ? `★ Most Executed (${execCount} runs)` : execCount > 0 ? `(${execCount} runs)` : ''}
                </option>
              );
            })}
          </select>

          {/* New Workflow Button */}
          <button
            onClick={() => setShowCreateWfModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded text-sm font-bold font-mono bg-purple-700 hover:bg-purple-600 text-white transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WORKFLOW</span>
          </button>
        </div>
      </div>

      {/* Main Split View: Tree Sidebar + Main Canvas */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Interactive Hierarchical Tree View Sidebar */}
        <div className={`${isSidebarOpen ? 'w-full lg:w-80 shrink-0' : 'hidden'} transition-all duration-300`}>
          <div className="p-3 rounded border border-[#30363d] bg-[#161b22] font-mono text-sm space-y-3 shadow-md">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div className="flex items-center space-x-2">
                <ListTree className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-[#c9d1d9] text-sm uppercase tracking-wide">
                  WORKFLOW TREE
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowCreateWfModal(true)}
                  className="p-1 text-[#8b949e] hover:text-purple-300 rounded hover:bg-[#21262d] transition-colors"
                  title="Create New Workflow"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 text-[#8b949e] hover:text-white rounded hover:bg-[#21262d] transition-colors"
                  title="Collapse Sidebar"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search & Filter Controls Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8b949e]" />
                <input
                  type="text"
                  placeholder="Filter workflows, versions & tasks..."
                  value={treeSearchTerm}
                  onChange={(e) => setTreeSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded text-[11px] bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] placeholder-[#484f58]"
                />
                {treeSearchTerm && (
                  <button
                    onClick={() => setTreeSearchTerm('')}
                    className="absolute right-2 top-2 text-[#8b949e] hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#8b949e] pt-1 border-b border-[#30363d] pb-1.5">
                <label className="flex items-center space-x-1.5 cursor-pointer hover:text-[#c9d1d9]">
                  <input
                    type="checkbox"
                    checked={filterActiveOnly}
                    onChange={(e) => setFilterActiveOnly(e.target.checked)}
                    className="accent-purple-500 rounded"
                  />
                  <span>Active Only</span>
                </label>

                <div className="flex items-center space-x-2 font-mono">
                  <button
                    onClick={expandAllTreeNodes}
                    className="hover:text-purple-400 transition-colors"
                    title="Expand all tree items"
                  >
                    Expand All
                  </button>
                  <span>|</span>
                  <button
                    onClick={collapseAllTreeNodes}
                    className="hover:text-amber-400 transition-colors"
                    title="Collapse all tree items"
                  >
                    Collapse
                  </button>
                </div>
              </div>
            </div>

            {/* Tree View Hierarchy Content */}
            <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
              {workflows.filter(wf => {
                if (filterActiveOnly) {
                  const vers = versionsMap[wf.id] || [];
                  if (!vers.some(v => v.is_active)) return false;
                }
                if (!treeSearchTerm.trim()) return true;
                const term = treeSearchTerm.toLowerCase();
                if (wf.name.toLowerCase().includes(term)) return true;
                const vers = versionsMap[wf.id] || [];
                return vers.some(v =>
                  v.nodes?.some(n => n.name.toLowerCase().includes(term) || n.task_name.toLowerCase().includes(term))
                );
              }).map(wf => {
                const isWfSelected = selectedWorkflowId === wf.id;
                const isWfExpanded = !!expandedTreeNodes[`wf-${wf.id}`];
                const wfVersions = versionsMap[wf.id] || wf.versions || [];
                const activeVer = wfVersions.find(v => v.is_active);
                const execCount = countsByWfId[wf.id] || 0;
                const isMostExecuted = maxExecutionCount > 0 && execCount === maxExecutionCount;

                return (
                  <div key={wf.id} className="rounded border border-[#21262d] bg-[#0d1117] overflow-hidden">
                    {/* Level 1: Workflow Item */}
                    <div
                      onClick={() => {
                        setSelectedWorkflowId(wf.id);
                        toggleTreeNode(`wf-${wf.id}`);
                      }}
                      className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                        isWfSelected ? 'bg-purple-950/40 text-white font-bold border-l-2 border-purple-500' : 'hover:bg-[#161b22] text-[#c9d1d9]'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <button
                          onClick={(e) => toggleTreeNode(`wf-${wf.id}`, e)}
                          className="text-[#8b949e] hover:text-white shrink-0"
                        >
                          {isWfExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                        {isWfExpanded ? (
                          <FolderOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        ) : (
                          <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        )}
                        <span className="truncate text-sm">{wf.name}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 text-[9px]">
                        {isMostExecuted ? (
                          <span
                            className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold flex items-center space-x-1 shadow-sm"
                            title={`Most Executed Workflow based on historical instance data (${execCount} runs)`}
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                            <span>Most Executed</span>
                            <span className="text-[8px] bg-amber-950/80 px-1 py-0.2 rounded border border-amber-700/60 font-mono">
                              {execCount}
                            </span>
                          </span>
                        ) : execCount > 0 ? (
                          <span
                            className="px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] font-mono text-[9px]"
                            title={`Historical executions (${execCount} runs)`}
                          >
                            {execCount} {execCount === 1 ? 'run' : 'runs'}
                          </span>
                        ) : null}

                        {activeVer ? (
                          <span className="px-1.5 py-0.2 rounded bg-green-900/40 text-green-300 border border-green-800 font-extrabold">
                            v{activeVer.version_number}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[#8b949e]">
                            {wfVersions.length} v
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Level 2: Nested Versions */}
                    {isWfExpanded && (
                      <div className="pl-4 pr-1 py-1 space-y-1 bg-[#161b22]/60 border-t border-[#21262d]">
                        {wfVersions.map(ver => {
                          const isVerSelected = selectedVersionId === ver.id;
                          const isVerExpanded = !!expandedTreeNodes[`ver-${ver.id}`];

                          return (
                            <div key={ver.id} className="space-y-1">
                              {/* Version Item Header */}
                              <div
                                onClick={() => {
                                  setSelectedWorkflowId(wf.id);
                                  setSelectedVersionId(ver.id);
                                  toggleTreeNode(`ver-${ver.id}`);
                                }}
                                className={`p-1.5 rounded flex items-center justify-between cursor-pointer text-[11px] transition-colors ${
                                  isVerSelected
                                    ? 'bg-[#1f2937] text-cyan-300 font-bold border-l-2 border-cyan-400'
                                    : 'hover:bg-[#0d1117] text-[#8b949e] hover:text-[#c9d1d9]'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5 min-w-0">
                                  <button
                                    onClick={(e) => toggleTreeNode(`ver-${ver.id}`, e)}
                                    className="text-[#8b949e] hover:text-white shrink-0"
                                  >
                                    {isVerExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  </button>
                                  <GitBranch className="w-3 h-3 text-cyan-400 shrink-0" />
                                  <span className="font-mono">v{ver.version_number}</span>
                                  {ver.is_active && (
                                    <span className="text-[8px] bg-green-900/50 text-green-300 px-1 py-0.2 rounded font-extrabold border border-green-800/80">
                                      ACTIVE
                                    </span>
                                  )}
                                </div>

                                <span className="text-[9px] text-[#8b949e] font-mono">
                                  {ver.nodes?.length || 0} nodes
                                </span>
                              </div>

                              {/* Level 3: Nested Nodes / Bound Tasks */}
                              {isVerExpanded && ver.nodes && (
                                <div className="pl-4 space-y-1 border-l border-slate-700/60 ml-2.5 my-1">
                                  {ver.nodes.map(node => {
                                    const isNodeSelected = selectedNode?.id === node.id;
                                    const isNodeExpanded = !!expandedTreeNodes[`node-${node.id}`];
                                    const outgoing = ver.edges?.filter(e => e.from_node_id === node.id) || [];

                                    return (
                                      <div key={node.id} className="space-y-0.5">
                                        {/* Node Header Row */}
                                        <div
                                          onClick={() => {
                                            setSelectedWorkflowId(wf.id);
                                            setSelectedVersionId(ver.id);
                                            setSelectedNode(node);
                                            toggleTreeNode(`node-${node.id}`);
                                          }}
                                          className={`p-1.5 rounded flex items-center justify-between cursor-pointer text-[10px] transition-all ${
                                            isNodeSelected
                                              ? 'bg-amber-950/40 text-amber-300 font-bold border-l-2 border-amber-400'
                                              : 'hover:bg-[#0d1117] text-[#c9d1d9]'
                                          }`}
                                        >
                                          <div className="flex items-center space-x-1.5 min-w-0">
                                            {outgoing.length > 0 && (
                                              <button
                                                onClick={(e) => toggleTreeNode(`node-${node.id}`, e)}
                                                className="text-[#8b949e] hover:text-white shrink-0"
                                              >
                                                {isNodeExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                              </button>
                                            )}
                                            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                                            <span className="truncate font-semibold">{node.name}</span>
                                          </div>

                                          <span className={`text-[8px] font-mono px-1 py-0.2 rounded ${
                                            node.is_entrypoint ? 'bg-amber-900/40 text-amber-300 border border-amber-800' :
                                            node.is_terminal ? 'bg-purple-900/40 text-purple-300 border border-purple-800' :
                                            'bg-blue-900/40 text-blue-300 border border-blue-800'
                                          }`}>
                                            {node.is_entrypoint ? 'ENTRY' : node.is_terminal ? 'END' : 'STEP'}
                                          </span>
                                        </div>

                                        {/* Subtask Info */}
                                        <div className="pl-5 text-[9px] text-[#8b949e] truncate flex items-center space-x-1">
                                          <span>task:</span>
                                          <span className="text-[#58a6ff] font-medium truncate">{node.task_name}</span>
                                        </div>

                                        {/* Level 4: Outcome Task Routes / Dependencies */}
                                        {isNodeExpanded && outgoing.length > 0 && (
                                          <div className="pl-5 pr-1 py-0.5 space-y-0.5 border-l border-amber-500/30 ml-2">
                                            {outgoing.map(edge => (
                                              <div
                                                key={edge.id}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedWorkflowId(wf.id);
                                                  setSelectedVersionId(ver.id);
                                                  const targetNode = ver.nodes?.find(n => n.id === edge.to_node_id);
                                                  if (targetNode) setSelectedNode(targetNode);
                                                }}
                                                className="p-1 rounded bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff] cursor-pointer flex items-center justify-between text-[9px] font-mono group"
                                              >
                                                <span className="text-green-400 font-bold">{edge.outcome_code}</span>
                                                <ArrowRight className="w-2.5 h-2.5 text-[#8b949e] group-hover:text-white" />
                                                <span className="text-[#58a6ff] truncate max-w-[90px]">{edge.to_node_name}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {(!ver.nodes || ver.nodes.length === 0) && (
                                    <div className="text-[10px] text-[#8b949e] italic pl-2 py-0.5">
                                      No nodes in version
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {wfVersions.length === 0 && (
                          <div className="text-[10px] text-[#8b949e] italic pl-2 py-0.5">
                            No versions available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {workflows.length === 0 && (
                <div className="text-center py-6 text-[#8b949e] text-sm">
                  No workflows found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Area: Versions, Integrity Checks & DAG Visual Canvas */}
        <div className="flex-1 w-full space-y-4">
          {/* Version Tab Bar & Action Controls */}
          {activeWorkflow && (
            <div className="p-2.5 rounded border border-[#30363d] bg-[#161b22] flex flex-wrap items-center justify-between gap-2.5">
              {/* Version Pills */}
              <div className="flex items-center space-x-2 font-mono text-sm overflow-x-auto">
                <span className="text-[#8b949e] font-bold text-[10px] uppercase mr-1 flex items-center space-x-1.5">
                  <span>VERSIONS:</span>
                  {(() => {
                    const execCount = countsByWfId[activeWorkflow.id] || 0;
                    const isMostExecuted = maxExecutionCount > 0 && execCount === maxExecutionCount;
                    if (isMostExecuted) {
                      return (
                        <span
                          className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold flex items-center space-x-1 shadow-sm normal-case text-[10px]"
                          title={`Most Executed Workflow based on historical instance data (${execCount} runs)`}
                        >
                          <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span>Most Executed</span>
                          <span className="text-[8px] bg-amber-950/80 px-1 py-0.2 rounded border border-amber-700/60 font-mono">
                            {execCount}
                          </span>
                        </span>
                      );
                    } else if (execCount > 0) {
                      return (
                        <span
                          className="px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d] font-mono text-[9px] normal-case"
                          title={`Historical executions (${execCount} runs)`}
                        >
                          {execCount} {execCount === 1 ? 'run' : 'runs'}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </span>
                {activeWorkflow.versions?.map((ver) => (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className={`px-2.5 py-0.5 rounded text-[11px] transition-all flex items-center space-x-1.5 ${
                      selectedVersionId === ver.id
                        ? 'bg-[#1f2937] text-white font-bold border-l-2 border-blue-500'
                        : 'bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d]'
                    }`}
                  >
                    <span>v{ver.version_number}</span>
                    {ver.is_active && (
                      <span className="px-1 py-0.2 text-[9px] bg-green-900/40 text-green-300 rounded font-bold border border-green-800">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}

                <button
                  onClick={handleCreateVersion}
                  className="px-2 py-0.5 rounded bg-[#0d1117] text-[#8b949e] hover:text-white border border-[#30363d] text-[10px]"
                  title="Auto-increment version number"
                >
                  + New Version
                </button>
              </div>

              {/* Controls */}
              {selectedVersion && (
                <div className="flex items-center space-x-2">
                  {!selectedVersion.is_active && (
                    <button
                      onClick={() => handleActivateVersion(selectedVersion.id)}
                      className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[11px] font-bold font-mono transition-all flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ACTIVATE VERSION</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowAddNodeModal(true)}
                    className="px-2.5 py-1 rounded bg-[#0d1117] hover:bg-[#21262d] text-white text-[11px] font-bold font-mono border border-[#30363d] transition-all flex items-center space-x-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#58a6ff]" />
                    <span>ADD NODE</span>
                  </button>

                  <button
                    onClick={() => {
                      if ((selectedVersion.nodes?.length || 0) < 2) {
                        alert('Need at least 2 nodes to draw an edge!');
                        return;
                      }
                      setShowAddEdgeModal(true);
                    }}
                    className="px-2.5 py-1 rounded bg-[#0d1117] hover:bg-[#21262d] text-white text-[11px] font-bold font-mono border border-[#30363d] transition-all flex items-center space-x-1 shadow-sm"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                    <span>ADD EDGE</span>
                  </button>

                  <button
                    onClick={() => onStartInstance(selectedVersion.id)}
                    className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[11px] font-bold font-mono transition-all flex items-center space-x-1 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>START INSTANCE</span>
                  </button>
                </div>
              )}
            </div>
          )}

      {/* Graph Integrity & Structural Validation Alerts */}
      {selectedVersion && (validationResult || structuralResult) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono">
          {/* Integrity validation */}
          <div className={`p-2.5 rounded border ${
            validationResult?.valid
              ? 'bg-green-950/20 border-green-800/60 text-green-300'
              : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
          }`}>
            <div className="flex items-center space-x-2 font-bold mb-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GRAPH INTEGRITY CHECK: {validationResult?.valid ? 'PASSED' : 'ISSUES DETECTED'}</span>
            </div>
            {validationResult?.issues.map((iss, i) => (
              <div key={i} className="text-[10px] text-[#8b949e] mt-1 flex items-start space-x-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>{iss.message}</span>
              </div>
            ))}
            {validationResult?.issues.length === 0 && (
              <p className="text-[10px] text-green-400">All task outcomes are properly routed with zero unreachable nodes.</p>
            )}
          </div>

          {/* Structural validation */}
          <div className={`p-2.5 rounded border ${
            structuralResult?.valid
              ? 'bg-green-950/20 border-green-800/60 text-green-300'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
          }`}>
            <div className="flex items-center space-x-2 font-bold mb-1 text-[11px]">
              <Layers className="w-3.5 h-3.5" />
              <span>STRUCTURAL CHECKS: {structuralResult?.valid ? 'VALID DAG' : 'STRUCTURAL DEFECT'}</span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] mt-1">
              {structuralResult?.checks.map((chk, i) => (
                <span key={i} className={`px-1.5 py-0.5 rounded border ${
                  chk.pass ? 'bg-green-900/30 border-green-800 text-green-300' : 'bg-rose-900/30 border-rose-800 text-rose-300'
                }`}>
                  {chk.check}: {chk.detail}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Visual Visualizer / DAG Canvas */}
      {selectedVersion ? (
        <div className="p-4 rounded border border-[#30363d] bg-[#0d1117] relative min-h-[480px] overflow-auto select-none">
          {/* Background Grid Accent */}
          <div className="absolute inset-0 bg-[radial-gradient(#30363d_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e] border-b border-[#30363d] pb-2">
              <span>CANVAS // NODE COUNT: {selectedVersion.nodes?.length || 0} | EDGE COUNT: {selectedVersion.edges?.length || 0}</span>
              <span className="text-[#58a6ff]">Click node to inspect input spec & outcome routes</span>
            </div>

            {/* Nodes Render Grid / Visual Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedVersion.nodes?.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const outgoingEdges = selectedVersion.edges?.filter(e => e.from_node_id === node.id) || [];
                const task = tasks.find(t => t.id === node.task_id);

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3.5 rounded border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[#161b22] border-[#58a6ff] shadow-md'
                        : 'bg-[#161b22] border-[#30363d] hover:border-[#8b949e]'
                    }`}
                  >
                    {/* Node Badges */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        {node.is_entrypoint && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-900/30 text-amber-300 border border-amber-800 rounded">
                            ENTRYPOINT
                          </span>
                        )}
                        {node.is_terminal && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-purple-900/30 text-purple-300 border border-purple-800 rounded">
                            TERMINAL
                          </span>
                        )}
                        {!node.is_entrypoint && !node.is_terminal && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-900/30 text-blue-300 border border-blue-800 rounded">
                            STEP
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#8b949e] hover:text-rose-400 transition-opacity"
                        title="Delete node"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Node Title & Task name */}
                    <div className="space-y-0.5">
                      <h3 className="font-bold font-mono text-sm text-[#58a6ff] tracking-tight">
                        {node.name}
                      </h3>
                      <p className="text-[11px] text-[#c9d1d9] flex items-center font-medium">
                        <Zap className="w-3 h-3 text-[#58a6ff] mr-1" />
                        {node.task_name}
                      </p>
                    </div>

                    {/* Outgoing Routes */}
                    <div className="mt-3 pt-2.5 border-t border-[#30363d] space-y-1">
                      <span className="text-[9px] font-mono text-[#8b949e] uppercase tracking-wider block">
                        OUTGOING EDGES ({outgoingEdges.length}):
                      </span>
                      {outgoingEdges.length > 0 ? (
                        outgoingEdges.map(edge => (
                          <div key={edge.id} className="flex items-center justify-between text-[10px] font-mono bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                            <span className="text-green-400 font-semibold">{edge.outcome_code}</span>
                            <ArrowRight className="w-3 h-3 text-[#8b949e]" />
                            <span className="text-[#58a6ff]">{edge.to_node_name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEdge(edge.id);
                              }}
                              className="text-[#8b949e] hover:text-rose-400 ml-1"
                              title="Delete edge"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-[#8b949e] italic block">
                          {node.is_terminal ? 'Terminal node (end)' : 'No outgoing edges configured'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {selectedVersion.nodes?.length === 0 && (
                <div className="col-span-full py-16 text-center text-[#8b949e] space-y-3">
                  <GitMerge className="w-10 h-10 mx-auto text-[#484f58]" />
                  <p className="font-mono text-sm">No nodes defined in Version v{selectedVersion.version_number}.</p>
                  <button
                    onClick={() => setShowAddNodeModal(true)}
                    className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white font-bold rounded text-sm font-mono"
                  >
                    + Add First Node
                  </button>
                </div>
              )}
            </div>

            {/* Selected Node Details Drawer */}
            {selectedNode && (
              <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] font-mono text-sm space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-[#58a6ff]" />
                    <span className="font-bold text-[#c9d1d9] text-sm">NODE INSPECTOR: {selectedNode.name}</span>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-[#8b949e] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#8b949e] block mb-1 font-semibold text-[11px]">TASK INPUT SPEC:</span>
                    <pre className="p-2 rounded bg-[#0d1117] text-green-400 overflow-x-auto text-[10px] border border-[#30363d]">
                      {JSON.stringify(selectedNode.task_input_spec || {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[#8b949e] block mb-1 font-semibold text-[11px]">TASK OUTCOMES FOR ROUTING:</span>
                    <div className="space-y-1">
                      {tasks.find(t => t.id === selectedNode.task_id)?.outcomes?.map(o => (
                        <div key={o.id} className="p-1.5 rounded bg-[#0d1117] border border-[#30363d] flex items-center justify-between">
                          <span className="font-bold text-green-400 text-[10px]">{o.code}</span>
                          <span className="text-[#8b949e] text-[10px] truncate max-w-[200px]">{o.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-[#8b949e] font-mono text-sm flex-1 w-full bg-[#161b22] border border-[#30363d] rounded">
          Select a workflow above or create one to begin building graph nodes.
        </div>
      )}
        </div>
      </div>

      {/* CREATE WORKFLOW MODAL */}
      {showCreateWfModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="p-5 rounded border border-[#30363d] max-w-md w-full font-sans space-y-3 bg-[#161b22] text-[#c9d1d9]">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <h3 className="font-bold font-mono text-sm text-white">CREATE WORKFLOW PIPELINE</h3>
              <button onClick={() => setShowCreateWfModal(false)} className="text-[#8b949e] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-3 text-sm">
              <div>
                <label className="block text-[#8b949e] font-mono font-semibold mb-1 text-[11px]">WORKFLOW NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated Hotfix Rollout"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  className="w-full p-2 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#8b949e] font-mono font-semibold mb-1 text-[11px]">DESCRIPTION</label>
                <textarea
                  rows={3}
                  placeholder="Purpose of this execution pipeline..."
                  value={wfDesc}
                  onChange={(e) => setWfDesc(e.target.value)}
                  className="w-full p-2 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWfModal(false)}
                  className="px-3 py-1 rounded border border-[#30363d] text-[#c9d1d9] font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono font-bold"
                >
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NODE MODAL */}
      {showAddNodeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="p-5 rounded border border-[#30363d] max-w-md w-full font-sans space-y-3 bg-[#161b22] text-[#c9d1d9]">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <h3 className="font-bold font-mono text-sm text-white">ADD GRAPH NODE</h3>
              <button onClick={() => setShowAddNodeModal(false)} className="text-[#8b949e] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNode} className="space-y-3 text-sm">
              <div>
                <label className="block text-[#8b949e] font-mono font-semibold mb-1 text-[11px]">NODE NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. compile_task"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  className="w-full p-2 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#8b949e] font-mono font-semibold mb-1 text-[11px]">BOUND TASK</label>
                <select
                  required
                  value={nodeTaskId}
                  onChange={(e) => setNodeTaskId(e.target.value)}
                  className="w-full p-2 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] font-mono"
                >
                  <option value="">-- Select Task --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.office_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-6 py-2">
                <label className="flex items-center space-x-2 cursor-pointer font-mono">
                  <input
                    type="checkbox"
                    checked={isEntrypoint}
                    onChange={(e) => setIsEntrypoint(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>Is Entrypoint</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer font-mono">
                  <input
                    type="checkbox"
                    checked={isTerminal}
                    onChange={(e) => setIsTerminal(e.target.checked)}
                    className="accent-purple-500 rounded"
                  />
                  <span>Is Terminal</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddNodeModal(false)}
                  className="px-3 py-1 rounded border border-[#30363d] text-[#c9d1d9] font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono font-bold"
                >
                  Add Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EDGE MODAL */}
      {showAddEdgeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="p-5 rounded border border-[#30363d] max-w-md w-full font-sans space-y-3 bg-[#161b22] text-[#c9d1d9]">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <h3 className="font-bold font-mono text-sm text-white">CONNECT DIRECTED EDGE</h3>
              <button onClick={() => setShowAddEdgeModal(false)} className="text-[#8b949e] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEdge} className="space-y-3 text-sm">
              <div>
                <label className="block text-[#8b949e] font-mono font-semibold mb-1 text-[11px]">FROM NODE</label>
                <select
                  required
                  value={fromNodeId}
                  onChange={(e) => {
                    const nid = e.target.value;
                    setFromNodeId(nid);
                    const n = selectedVersion?.nodes?.find(x => x.id === nid);
                    if (n) setFromTaskId(n.task_id);
                  }}
                  className="w-full p-2 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] font-mono"
                >
                  <option value="">-- Select Source Node --</option>
                  {selectedVersion?.nodes?.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.task_name})</option>
                  ))}
                </select>
              </div>

              {fromTaskId && (
                <div>
                  <label className="block text-[#8b949e] font-mono font-semibold mb-1 text-[11px]">TRIGGER OUTCOME</label>
                  <select
                    required
                    value={outcomeId}
                    onChange={(e) => setOutcomeId(e.target.value)}
                    className="w-full p-2 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] font-mono"
                  >
                    <option value="">-- Select Outcome Code --</option>
                    {selectedTaskForEdge?.outcomes?.map(o => (
                      <option key={o.id} value={o.id}>{o.code} - {o.description}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[#8b949e] font-mono font-semibold mb-1 text-[11px]">TO NODE</label>
                <select
                  required
                  value={toNodeId}
                  onChange={(e) => setToNodeId(e.target.value)}
                  className="w-full p-2 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] font-mono"
                >
                  <option value="">-- Select Target Node --</option>
                  {selectedVersion?.nodes?.filter(n => n.id !== fromNodeId).map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddEdgeModal(false)}
                  className="px-3 py-1 rounded border border-[#30363d] text-[#c9d1d9] font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono font-bold"
                >
                  Connect Edge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
