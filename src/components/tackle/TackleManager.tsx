import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu, Server, Key, Shield, Terminal, Play, Square, RefreshCw, AlertTriangle,
  FileCode, Database, Settings, Plus, Trash2, Check, X, ShieldAlert, Zap,
  Layers, Lock, CheckCircle2, ListFilter, Activity, Clock, ArrowUp, ArrowDown,
  Sliders, AlertOctagon, RotateCcw
} from 'lucide-react';
import {
  AIProvider, AIHarness, AIModel, AIRoleConfig, AIConfigBundle,
  AgentSession, ScheduledAgent, RoleMemoryProcedure, PromptTemplate,
  RoleTaskAssignment, RoleToolAccess, CircuitBreakerConfig, AIConfigValidation
} from '../../types/tackle';
import { api } from '../../services/api';

type TackleSubTab = 'ai-config' | 'tool-access' | 'sessions-scheduler' | 'memory-prompts' | 'failure-recovery';

interface TackleManagerProps {
  isDark: boolean;
  onRefreshAll?: () => void;
}

export const TackleManager: React.FC<TackleManagerProps> = ({ isDark, onRefreshAll }) => {
  const [activeTab, setActiveTab] = useState<TackleSubTab>('ai-config');

  // Core Tackle States
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [harnesses, setHarnesses] = useState<AIHarness[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [roleConfigs, setRoleConfigs] = useState<AIRoleConfig[]>([]);
  const [bundles, setBundles] = useState<AIConfigBundle[]>([]);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [scheduledAgents, setScheduledAgents] = useState<ScheduledAgent[]>([]);
  const [roleMemories, setRoleMemories] = useState<RoleMemoryProcedure[]>([]);
  const [checkpoints, setCheckpoints] = useState<Record<string, { role: string; last_active: string }>>({});
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [roleTasks, setRoleTasks] = useState<RoleTaskAssignment[]>([]);
  const [toolAccess, setToolAccess] = useState<RoleToolAccess[]>([]);
  const [circuitBreaker, setCircuitBreaker] = useState<CircuitBreakerConfig | null>(null);
  const [validation, setValidation] = useState<AIConfigValidation | null>(null);

  // Selected Filter Roles
  const [selectedRole, setSelectedRole] = useState<string>('engineer');
  const [resolvedBundle, setResolvedBundle] = useState<AIConfigBundle | null>(null);

  // Test Invocation State
  const [testModelId, setTestModelId] = useState<string>('model-gemini-3.6-flash');
  const [testPrompt, setTestPrompt] = useState<string>('Check role tool allowlist and run graph validation sweep.');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Fallback Simulation State
  const [failoverLog, setFailoverLog] = useState<string[]>([]);
  const [isSimulatingFailover, setIsSimulatingFailover] = useState<boolean>(false);

  // Modal / Form States
  const [showProviderModal, setShowProviderModal] = useState<boolean>(false);
  const [newProvider, setNewProvider] = useState({ name: '', type: 'gemini' as AIProvider['type'], endpoint_url: '', api_key: '' });

  const [showModelModal, setShowModelModal] = useState<boolean>(false);
  const [newModel, setNewModel] = useState({ name: '', harness_id: '', provider_id: '', model_identifier: '' });

  // Bundle Assignment Modal State
  const [showBundleModal, setShowBundleModal] = useState<boolean>(false);
  const [editingBundle, setEditingBundle] = useState<Partial<AIConfigBundle>>({
    name: '',
    role: 'engineer',
    model_id: '',
    provider_id: '',
    harness_id: '',
    priority: 10,
    invocation_mode: 'sync',
    timeout_ms: 60000,
    is_active: true,
    metadata: { failover_trigger: 'rate_limit_429' }
  });

  const [loading, setLoading] = useState<boolean>(false);

  const loadTackleData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        provs, harns, mdls, rCfgs, bndls, sess, scheds, mems, chkpts, prmpts, tsks, tools, cb, val
      ] = await Promise.all([
        api.getAIProviders(),
        api.getAIHarnesses(),
        api.getAIModels(),
        api.getAIRoleConfigs(),
        api.getAIBundles(),
        api.getSessions(),
        api.getScheduler(),
        api.getMemoryProcedures(selectedRole),
        api.getRoleCheckpoints(),
        api.getPrompts(selectedRole),
        api.getRoleTasks(selectedRole),
        api.getRoleToolAccess(),
        api.getCircuitBreaker(),
        api.validateAIConfig()
      ]);

      setProviders(provs || []);
      setHarnesses(harns || []);
      setModels(mdls || []);
      setRoleConfigs(rCfgs || []);
      setBundles(bndls || []);
      setSessions(sess || []);
      setScheduledAgents(scheds || []);
      setRoleMemories(mems || []);
      setCheckpoints(chkpts || {});
      setPrompts(prmpts || []);
      setRoleTasks(tsks || []);
      setToolAccess(tools || []);
      setCircuitBreaker(cb || null);
      setValidation(val || null);

      // Resolve bundle for selected role
      const resB = await api.resolveRoleBundle(selectedRole);
      setResolvedBundle(resB || null);
    } catch (e) {
      console.error('Error loading Tackle server data', e);
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    loadTackleData();
  }, [loadTackleData]);

  // Handlers
  const handleKillSession = async (sessionId: string) => {
    try {
      await api.killSession(sessionId);
      await loadTackleData();
    } catch (e: any) {
      alert(e.message || 'Failed to kill session');
    }
  };

  const handleTestInvocation = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testAIInvocation({ model_id: testModelId, test_prompt: testPrompt });
      setTestResult(res);
      await loadTackleData();
    } catch (e: any) {
      alert(e.message || 'Test invocation error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSimulateFailover = async () => {
    setIsSimulatingFailover(true);
    setFailoverLog([]);
    const roleBundles = bundles
      .filter(b => b.role.toLowerCase() === selectedRole.toLowerCase())
      .sort((a, b) => b.priority - a.priority);

    const logs: string[] = [];
    logs.push(`[10:38:00] Initiating agent request for role: "${selectedRole}"`);

    if (roleBundles.length === 0) {
      logs.push(`[10:38:01] ❌ FATAL: No config bundles assigned to role "${selectedRole}"! Execution aborted.`);
      setFailoverLog(logs);
      setIsSimulatingFailover(false);
      return;
    }

    const primary = roleBundles[0];
    logs.push(`[10:38:01] 🎯 Selected Primary Tier (Priority ${primary.priority}): "${primary.name}" [${primary.model_id}]`);
    logs.push(`[10:38:02] ⚠️ HTTP 429 TOO MANY REQUESTS: Provider rate limit / quota exhausted on "${primary.model_id}"`);
    logs.push(`[10:38:02] ⚡ Circuit Breaker triggered: Stepping to next priority fallback in role fallback chain...`);

    const fallbacks = roleBundles.slice(1).filter(b => b.is_active);

    if (fallbacks.length > 0) {
      const fallback = fallbacks[0];
      logs.push(`[10:38:03] 🔄 Failover Step 1 -> Activated Fallback Tier (Priority ${fallback.priority}): "${fallback.name}" [${fallback.model_id}]`);
      logs.push(`[10:38:04] ✅ HTTP 200 SUCCESS: Request processed seamlessly by fallback bundle "${fallback.name}" in 310ms.`);
      logs.push(`[10:38:04] 📝 Receipt recorded: Execution fallback successful. Session status: RUNNING.`);
    } else {
      logs.push(`[10:38:03] ❌ No active secondary fallback bundles available in priority chain for role "${selectedRole}".`);
      logs.push(`[10:38:03] 🚨 Ticket pushed back to PENDING state per circuit breaker rules.`);
    }

    setFailoverLog(logs);
    setIsSimulatingFailover(false);
  };

  const handleToggleToolAccess = async (id: string, currentAllowed: boolean) => {
    try {
      await api.updateRoleToolAccess(id, { allowed: !currentAllowed });
      await loadTackleData();
    } catch (e: any) {
      alert('Failed to update tool access');
    }
  };

  const handleSaveCircuitBreaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circuitBreaker) return;
    try {
      await api.saveCircuitBreaker(circuitBreaker);
      alert('Circuit breaker configuration updated');
      await loadTackleData();
    } catch (e: any) {
      alert('Failed to save circuit breaker');
    }
  };

  const handleRefreshMemory = async () => {
    try {
      await api.refreshMemory();
      await loadTackleData();
    } catch (e: any) {
      alert('Failed to refresh memory procedures');
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvider.name) return;
    try {
      await api.upsertAIProvider(newProvider);
      setShowProviderModal(false);
      setNewProvider({ name: '', type: 'gemini', endpoint_url: '', api_key: '' });
      await loadTackleData();
    } catch (e: any) {
      alert('Failed to create AI Provider');
    }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.name || !newModel.model_identifier) return;
    try {
      await api.upsertAIModel({
        name: newModel.name,
        harness_id: newModel.harness_id || harnesses[0]?.id || 'harness-opencode',
        provider_id: newModel.provider_id || providers[0]?.id || 'prov-gemini',
        model_identifier: newModel.model_identifier
      });
      setShowModelModal(false);
      setNewModel({ name: '', harness_id: '', provider_id: '', model_identifier: '' });
      await loadTackleData();
    } catch (e: any) {
      alert('Failed to create AI Model');
    }
  };

  // Bundle Assignment Actions
  const handleOpenAssignBundleModal = (bundleToEdit?: AIConfigBundle) => {
    if (bundleToEdit) {
      setEditingBundle(bundleToEdit);
    } else {
      setEditingBundle({
        name: `${selectedRole.toUpperCase()} Config Bundle #${bundles.filter(b => b.role.toLowerCase() === selectedRole.toLowerCase()).length + 1}`,
        role: selectedRole,
        model_id: models[0]?.id || 'model-gemini-3.6-flash',
        provider_id: providers[0]?.id || 'prov-gemini',
        harness_id: harnesses[0]?.id || 'harness-opencode',
        priority: 5,
        invocation_mode: 'sync',
        timeout_ms: 60000,
        is_active: true,
        metadata: { failover_trigger: 'rate_limit_429' }
      });
    }
    setShowBundleModal(true);
  };

  const handleSaveBundleModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBundle.name || !editingBundle.model_id) return;
    try {
      await api.upsertAIBundle({
        ...editingBundle,
        role: selectedRole
      });
      setShowBundleModal(false);
      await loadTackleData();
    } catch (e: any) {
      alert('Failed to assign config bundle');
    }
  };

  const handleToggleBundleActive = async (bundle: AIConfigBundle) => {
    try {
      await api.upsertAIBundle({
        ...bundle,
        is_active: !bundle.is_active
      });
      await loadTackleData();
    } catch (e: any) {
      alert('Failed to toggle bundle status');
    }
  };

  const handleAdjustBundlePriority = async (bundle: AIConfigBundle, delta: number) => {
    try {
      const newPriority = Math.max(1, (bundle.priority || 10) + delta);
      await api.upsertAIBundle({
        ...bundle,
        priority: newPriority
      });
      await loadTackleData();
    } catch (e: any) {
      alert('Failed to adjust bundle priority');
    }
  };

  const handleDeleteBundle = async (id: string) => {
    if (!confirm('Are you sure you want to remove this bundle from the role?')) return;
    try {
      await api.deleteAIBundle(id);
      await loadTackleData();
    } catch (e: any) {
      alert('Failed to delete config bundle');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await api.seedAIDefaults(true);
      await loadTackleData();
      if (onRefreshAll) onRefreshAll();
    } catch (e: any) {
      alert('Failed to seed defaults');
    }
  };

  // Get active bundles for selected role sorted by priority descending
  const currentRoleBundles = bundles
    .filter(b => b.role.toLowerCase() === selectedRole.toLowerCase())
    .sort((a, b) => b.priority - a.priority);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto font-sans bg-[#0b0e14]">
      {/* Top Header */}
      <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-blue-950/40 text-[#58a6ff] border border-blue-800/40">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xs font-bold font-mono text-[#c9d1d9] uppercase">
                TACKLE-SRV AI CONFIG REGISTRY & CONTEXT ENGINE
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950/80 text-blue-300 border border-blue-800">
                PORT 3410
              </span>
            </div>
            <p className="text-[11px] text-[#8b949e]">
              Source-of-truth registry for providers, harnesses, models, role configs, fallback bundles, tool access, and Redis memory cache
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSeedDefaults}
            className="px-2.5 py-1 rounded border border-[#30363d] bg-[#0d1117] text-amber-300 hover:text-white font-mono text-xs font-bold transition-all flex items-center space-x-1"
            title="Seed default providers, models, bundles, and roles"
          >
            <Database className="w-3.5 h-3.5" />
            <span>SEED DEFAULTS</span>
          </button>

          <button
            onClick={loadTackleData}
            className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-bold transition-all flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 border-b border-[#30363d] pb-2 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('ai-config')}
          className={`px-3 py-1.5 rounded flex items-center space-x-1.5 transition-all ${
            activeTab === 'ai-config'
              ? 'bg-[#21262d] text-[#58a6ff] border-b-2 border-[#58a6ff] font-bold'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>AI Config & Fallback Chains</span>
        </button>

        <button
          onClick={() => setActiveTab('tool-access')}
          className={`px-3 py-1.5 rounded flex items-center space-x-1.5 transition-all ${
            activeTab === 'tool-access'
              ? 'bg-[#21262d] text-[#58a6ff] border-b-2 border-[#58a6ff] font-bold'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Role Tool Access</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions-scheduler')}
          className={`px-3 py-1.5 rounded flex items-center space-x-1.5 transition-all ${
            activeTab === 'sessions-scheduler'
              ? 'bg-[#21262d] text-[#58a6ff] border-b-2 border-[#58a6ff] font-bold'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Sessions & Scheduler</span>
        </button>

        <button
          onClick={() => setActiveTab('memory-prompts')}
          className={`px-3 py-1.5 rounded flex items-center space-x-1.5 transition-all ${
            activeTab === 'memory-prompts'
              ? 'bg-[#21262d] text-[#58a6ff] border-b-2 border-[#58a6ff] font-bold'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Memory & Prompts</span>
        </button>

        <button
          onClick={() => setActiveTab('failure-recovery')}
          className={`px-3 py-1.5 rounded flex items-center space-x-1.5 transition-all ${
            activeTab === 'failure-recovery'
              ? 'bg-[#21262d] text-[#58a6ff] border-b-2 border-[#58a6ff] font-bold'
              : 'text-[#8b949e] hover:text-[#c9d1d9]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Circuit Breaker</span>
        </button>
      </div>

      {/* TAB 1: AI CONFIG REGISTRY & ROLE BUNDLE FALLBACK ASSIGNMENTS */}
      {activeTab === 'ai-config' && (
        <div className="space-y-4">
          {/* Validation Banner */}
          {validation && (
            <div className={`p-3 rounded border flex items-center justify-between font-mono text-xs ${
              validation.valid ? 'bg-green-950/30 border-green-800/60 text-green-300' : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
            }`}>
              <div className="flex items-center space-x-2">
                {validation.valid ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                <span className="font-bold">
                  {validation.valid ? 'AI CONFIG VALIDATED (GET /config/ai/validate)' : `${validation.warnings.length} CONFIG WARNINGS`}
                </span>
              </div>
              {validation.warnings.length > 0 && (
                <div className="text-[11px] text-amber-200 truncate max-w-[600px]">
                  {validation.warnings.join(' | ')}
                </div>
              )}
            </div>
          )}

          {/* Top Row: Providers, Harnesses, Models */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Providers */}
            <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-[#58a6ff]" />
                  <span className="font-bold text-[#c9d1d9]">PROVIDERS ({providers.length})</span>
                </div>
                <button
                  onClick={() => setShowProviderModal(true)}
                  className="px-2 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[10px] font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>ADD</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {providers.map(p => (
                  <div key={p.id} className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#c9d1d9] text-[11px]">{p.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-950 text-blue-300 border border-blue-800">
                        {p.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8b949e] truncate">{p.endpoint_url || 'Default Endpoint'}</div>
                    <div className="text-[10px] text-[#8b949e] flex items-center justify-between">
                      <span>API Key: {p.api_key ? '●●●●●●●●' : 'None'}</span>
                      <button
                        onClick={() => api.deleteAIProvider(p.id).then(loadTackleData)}
                        className="text-rose-400 hover:underline text-[10px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Harnesses */}
            <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-[#c9d1d9]">HARNESSES ({harnesses.length})</span>
                </div>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {harnesses.map(h => (
                  <div key={h.id} className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#c9d1d9] text-[11px]">{h.name}</span>
                      <span className="text-[10px] text-[#8b949e] font-mono">{h.id}</span>
                    </div>
                    <p className="text-[10px] text-green-300 font-mono bg-black/40 p-1 rounded overflow-x-auto">
                      {h.invocation_semantics}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Models */}
            <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-[#c9d1d9]">MODELS ({models.length})</span>
                </div>
                <button
                  onClick={() => setShowModelModal(true)}
                  className="px-2 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[10px] font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>ADD</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {models.map(m => (
                  <div key={m.id} className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#c9d1d9] text-[11px]">{m.name}</span>
                      <span className="text-[10px] text-purple-300 font-bold">{m.model_identifier}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                      <span>Harness: {m.harness_id}</span>
                      <button
                        onClick={() => api.deleteAIModel(m.id).then(loadTackleData)}
                        className="text-rose-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN PROMINENT SECTION: ROLE CONFIG BUNDLE ASSIGNMENTS & FALLBACK CHAIN */}
          <div className="p-4 rounded border border-[#30363d] bg-[#161b22] space-y-4 font-mono text-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#30363d] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded bg-amber-950/50 border border-amber-800/60 text-amber-300">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-[#c9d1d9]">
                    ROLE CONFIG BUNDLE ASSIGNMENTS & FALLBACK CHAIN MATRIX
                  </h2>
                  <p className="text-[11px] text-[#8b949e]">
                    Assign multiple config bundles to a role to form an ordered fallback cascade for rate-limiting, subscription exhaustion, & model failures.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-[11px] text-[#8b949e] font-bold">SELECT ROLE:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-1.5 rounded border border-blue-800 bg-[#0d1117] text-[#58a6ff] font-bold text-xs"
                >
                  <option value="engineer">engineer</option>
                  <option value="inspector">inspector</option>
                  <option value="operator">operator</option>
                </select>

                <button
                  onClick={() => handleOpenAssignBundleModal()}
                  className="px-3 py-1.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ASSIGN BUNDLE TO ROLE</span>
                </button>
              </div>
            </div>

            {/* Fallback Chain Items */}
            <div className="space-y-3">
              {currentRoleBundles.map((b, idx) => {
                const modelInfo = models.find(m => m.id === b.model_id);
                const isPrimary = idx === 0;

                return (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded border transition-all ${
                      isPrimary
                        ? 'bg-gradient-to-r from-[#0d1117] via-[#161b22] to-[#0d1117] border-green-800/80 shadow-md'
                        : b.is_active
                        ? 'bg-[#0d1117] border-[#30363d]'
                        : 'bg-[#0d1117]/60 border-zinc-800 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      {/* Left Side: Priority Rank & Info */}
                      <div className="flex items-start space-x-3">
                        <div className="flex flex-col items-center justify-center min-w-20 p-2 rounded bg-black/40 border border-[#30363d]">
                          <span className="text-[9px] text-[#8b949e] font-bold uppercase">
                            {isPrimary ? 'PRIMARY TIER' : `FALLBACK #${idx}`}
                          </span>
                          <span className={`text-sm font-bold ${isPrimary ? 'text-green-400' : 'text-amber-300'}`}>
                            PRIORITY {b.priority}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[#c9d1d9] text-xs">{b.name}</span>
                            <span className="text-[10px] text-[#8b949e]">({b.id})</span>
                            {isPrimary && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-green-950 text-green-300 border border-green-800">
                                ACTIVE WINNER
                              </span>
                            )}
                            {!b.is_active && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                DISABLED
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8b949e]">
                            <div>Model: <span className="text-purple-300 font-bold">{modelInfo?.name || b.model_id}</span></div>
                            <div>•</div>
                            <div>Provider: <span className="text-[#58a6ff]">{b.provider_id || 'Default'}</span></div>
                            <div>•</div>
                            <div>Harness: <span className="text-emerald-400">{b.harness_id || 'Default'}</span></div>
                            <div>•</div>
                            <div>Mode: <span className="text-amber-300">{b.invocation_mode || 'sync'}</span></div>
                            <div>•</div>
                            <div>Timeout: <span className="text-cyan-300">{b.timeout_ms}ms</span></div>
                          </div>

                          {b.metadata && (
                            <div className="text-[10px] text-zinc-400 bg-black/40 px-2 py-0.5 rounded inline-block font-mono">
                              Trigger Policy: {JSON.stringify(b.metadata)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Reordering & Actions */}
                      <div className="flex items-center space-x-1.5 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleAdjustBundlePriority(b, 2)}
                          className="p-1.5 rounded border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-zinc-300 hover:text-white"
                          title="Increase Priority (Move Up in Fallback Chain)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAdjustBundlePriority(b, -2)}
                          className="p-1.5 rounded border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-zinc-300 hover:text-white"
                          title="Decrease Priority (Move Down in Fallback Chain)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleBundleActive(b)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border ${
                            b.is_active
                              ? 'bg-green-950/60 border-green-800 text-green-300 hover:bg-green-900'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {b.is_active ? 'ENABLED' : 'DISABLED'}
                        </button>

                        <button
                          onClick={() => handleOpenAssignBundleModal(b)}
                          className="p-1.5 rounded border border-[#30363d] bg-[#161b22] hover:bg-[#21262d] text-blue-300"
                          title="Edit Bundle Settings"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteBundle(b.id)}
                          className="p-1.5 rounded border border-rose-900/50 bg-rose-950/30 hover:bg-rose-900 text-rose-300"
                          title="Unassign Bundle from Role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {currentRoleBundles.length === 0 && (
                <div className="p-8 rounded border border-dashed border-[#30363d] text-center space-y-2">
                  <AlertOctagon className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="text-[#8b949e] font-bold text-xs">
                    No Config Bundles assigned to role "{selectedRole}".
                  </p>
                  <p className="text-[11px] text-[#8b949e]">
                    Assign a primary bundle and fallback bundles to enable resilient model failover for this role.
                  </p>
                  <button
                    onClick={() => handleOpenAssignBundleModal()}
                    className="mt-2 px-3 py-1.5 rounded bg-[#238636] text-white text-xs font-bold inline-flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign First Config Bundle</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Grid: Resolved Winner & Interactive Failover Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
            {/* Active Config Bundle Resolver Output */}
            <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-[#c9d1d9]">LIVE RESOLVED BUNDLE (/config/ai/resolve/{selectedRole})</span>
                </div>
              </div>

              {resolvedBundle ? (
                <div className="p-3 rounded bg-[#0d1117] border border-green-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-300 text-xs">{resolvedBundle.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-950 text-green-400 border border-green-800">
                      WINNING PRIORITY {resolvedBundle.priority}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[#8b949e]">
                    <div>Model: <span className="text-purple-300 font-bold">{resolvedBundle.model_id}</span></div>
                    <div>Mode: <span className="text-[#58a6ff]">{resolvedBundle.invocation_mode}</span></div>
                    <div>Timeout: <span className="text-cyan-300">{resolvedBundle.timeout_ms}ms</span></div>
                    <div>Active Status: <span className="text-green-400 font-bold">ACTIVE</span></div>
                  </div>
                  {resolvedBundle.metadata && (
                    <pre className="p-2 rounded bg-black/60 text-[10px] text-zinc-300 overflow-x-auto">
                      {JSON.stringify(resolvedBundle.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-[#8b949e] italic border border-dashed border-[#30363d] rounded">
                  No active config bundle resolved for role "{selectedRole}".
                </div>
              )}
            </div>

            {/* Interactive Failover & Rate Limit Simulator */}
            <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-[#c9d1d9]">SIMULATE RATE LIMIT & FAILOVER CASCADE</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-[#8b949e]">
                  Test how the Tackle Context Engine automatically fails over from Priority Tier 1 to secondary fallback bundles when rate limits or model failures occur.
                </p>

                <button
                  onClick={handleSimulateFailover}
                  disabled={isSimulatingFailover}
                  className="w-full py-2 rounded bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold transition-all flex items-center justify-center space-x-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isSimulatingFailover ? 'animate-spin' : ''}`} />
                  <span>SIMULATE PRIMARY RATE LIMIT (429) & CASCADE</span>
                </button>

                {failoverLog.length > 0 && (
                  <div className="p-3 rounded bg-black/80 border border-[#30363d] space-y-1 font-mono text-[10px] text-green-400 max-h-48 overflow-y-auto">
                    {failoverLog.map((log, idx) => (
                      <div key={idx} className={log.includes('429') || log.includes('❌') ? 'text-amber-300 font-bold' : log.includes('✅') ? 'text-green-300 font-bold' : ''}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE TOOL ACCESS ALLOWLIST */}
      {activeTab === 'tool-access' && (
        <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-[#58a6ff]" />
              <h2 className="font-bold text-[#c9d1d9]">
                DEFAULT-DENY ROLE TOOL ALLOWLIST (`tackle.role_tool_access`)
              </h2>
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-2 py-1 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
            >
              <option value="engineer">engineer</option>
              <option value="inspector">inspector</option>
              <option value="operator">operator</option>
            </select>
          </div>

          <div className="space-y-2">
            {toolAccess
              .filter(ta => ta.role.toLowerCase() === selectedRole.toLowerCase())
              .map(ta => (
                <div key={ta.id} className="p-3 rounded bg-[#0d1117] border border-[#30363d] flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#c9d1d9] text-[11px]">{ta.tool_name}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        ta.allowed ? 'bg-green-950 text-green-400 border border-green-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {ta.allowed ? 'ALLOWED' : 'DENIED'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8b949e]">{ta.restriction_rules}</p>
                  </div>

                  <button
                    onClick={() => handleToggleToolAccess(ta.id, ta.allowed)}
                    className={`px-3 py-1 rounded font-bold text-[10px] transition-all flex items-center space-x-1 ${
                      ta.allowed ? 'bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800' : 'bg-green-950 text-green-300 hover:bg-green-900 border border-green-800'
                    }`}
                  >
                    {ta.allowed ? <Lock className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    <span>{ta.allowed ? 'REVOKE' : 'ALLOW'}</span>
                  </button>
                </div>
              ))}

            {toolAccess.filter(ta => ta.role.toLowerCase() === selectedRole.toLowerCase()).length === 0 && (
              <div className="p-8 text-center text-[#8b949e] italic">
                No tool access rules configured for role "{selectedRole}". Default security posture is DENY ALL.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SESSIONS LEDGER & AGENT SCHEDULER */}
      {activeTab === 'sessions-scheduler' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
          {/* Active Sessions Ledger */}
          <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-[#58a6ff]" />
                <span className="font-bold text-[#c9d1d9]">SESSION LEDGER (/sessions)</span>
              </div>
              <span className="text-[10px] text-[#8b949e]">{sessions.length} sessions recorded</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.map(s => (
                <div key={s.id} className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#c9d1d9]">{s.id}</span>
                      <span className="text-[10px] text-[#8b949e]">PID {s.pid}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        s.status === 'RUNNING' ? 'bg-green-950 text-green-400 border border-green-800' :
                        s.status === 'KILLED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}>
                        {s.status}
                      </span>

                      {s.status === 'RUNNING' && (
                        <button
                          onClick={() => handleKillSession(s.id)}
                          className="px-2 py-0.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] font-bold border border-rose-800 flex items-center space-x-1"
                        >
                          <Square className="w-3 h-3" />
                          <span>KILL (SIGKILL)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {s.logs && s.logs.length > 0 && (
                    <div className="p-2 rounded bg-black/60 text-[10px] text-green-400 space-y-0.5 max-h-24 overflow-y-auto font-mono">
                      {s.logs.map((l, idx) => (
                        <div key={idx}>{l}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Agent Scheduler */}
          <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-[#c9d1d9]">AGENT SCHEDULER (/scheduler)</span>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scheduledAgents.map(sc => (
                <div key={sc.id} className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#c9d1d9] text-[11px]">ROLE: {sc.role.toUpperCase()}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      sc.enabled ? 'bg-green-950 text-green-400 border border-green-800' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {sc.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[#8b949e]">
                    <div>Type: <span className="text-[#58a6ff]">{sc.schedule_type}</span></div>
                    <div>Value: <span className="text-[#58a6ff]">{sc.schedule_value}</span></div>
                    <div>Model: <span className="text-purple-300">{sc.model_id}</span></div>
                    <div>Dir: <span className="text-zinc-300 truncate">{sc.project_dir}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEMORY PROCEDURES & PROMPTS */}
      {activeTab === 'memory-prompts' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Controls Bar */}
          <div className="p-3 rounded border border-[#30363d] bg-[#161b22] flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-[11px] text-[#8b949e]">ROLE FILTER:</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-2 py-1 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              >
                <option value="engineer">engineer</option>
                <option value="inspector">inspector</option>
                <option value="operator">operator</option>
              </select>
            </div>

            <button
              onClick={handleRefreshMemory}
              className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SYNC PG → REDIS (/memory/refresh)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Memory Procedures */}
            <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <span className="font-bold text-[#c9d1d9]">ROLE MEMORY PROCEDURES (Redis mem:*)</span>
                <span className="text-[10px] text-[#8b949e]">{roleMemories.length} procedures</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {roleMemories.map(m => (
                  <div key={m.id} className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#58a6ff]">{m.title}</span>
                      <span className="text-[10px] text-[#8b949e]">v{m.version}</span>
                    </div>
                    <p className="text-[10px] text-[#8b949e]">Slug: {m.slug}</p>
                    <pre className="p-2 rounded bg-black/50 text-[10px] text-zinc-300 font-sans whitespace-pre-wrap">
                      {m.body_md}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompts & Tasks */}
            <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <span className="font-bold text-[#c9d1d9]">VERSIONED PROMPTS & TASKS (`tackle.prompts`)</span>
                <span className="text-[10px] text-[#8b949e]">{prompts.length} prompts</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {prompts.map(pr => (
                  <div key={pr.id} className="p-3 rounded bg-[#0d1117] border border-[#30363d] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">{pr.slug}</span>
                      <span className="text-[10px] text-[#8b949e]">v{pr.version}</span>
                    </div>
                    <pre className="p-2 rounded bg-black/50 text-[10px] text-zinc-300 font-sans whitespace-pre-wrap">
                      {pr.body_md}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FAILURE RECOVERY & CIRCUIT BREAKER */}
      {activeTab === 'failure-recovery' && circuitBreaker && (
        <div className="p-4 rounded border border-[#30363d] bg-[#161b22] space-y-4 max-w-2xl mx-auto font-mono text-xs">
          <div className="flex items-center space-x-2 border-b border-[#30363d] pb-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="font-bold text-[#c9d1d9]">CIRCUIT BREAKER & FAILURE RECOVERY CONFIGURATION</h2>
          </div>

          <form onSubmit={handleSaveCircuitBreaker} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] text-[#8b949e] block">MAX RETRIES PER MODEL:</label>
              <input
                type="number"
                value={circuitBreaker.max_retries_per_model}
                onChange={(e) => setCircuitBreaker({ ...circuitBreaker, max_retries_per_model: parseInt(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#8b949e] block">RETRY DELAY SECONDS:</label>
              <input
                type="number"
                value={circuitBreaker.retry_delay_seconds}
                onChange={(e) => setCircuitBreaker({ ...circuitBreaker, retry_delay_seconds: parseInt(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#8b949e] block">MAX FALLBACKS:</label>
              <input
                type="number"
                value={circuitBreaker.max_fallbacks}
                onChange={(e) => setCircuitBreaker({ ...circuitBreaker, max_fallbacks: parseInt(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="pushback"
                checked={circuitBreaker.push_back_to_pending}
                onChange={(e) => setCircuitBreaker({ ...circuitBreaker, push_back_to_pending: e.target.checked })}
                className="rounded border-[#30363d] bg-[#0d1117]"
              />
              <label htmlFor="pushback" className="text-[11px] text-[#c9d1d9]">
                PUSH BACK FAILED TICKETS TO PENDING STATUS
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-bold transition-all"
            >
              SAVE CIRCUIT BREAKER CONFIGURATION
            </button>
          </form>
        </div>
      )}

      {/* Modal: New Provider */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 font-mono text-xs">
          <div className="p-4 rounded border border-[#30363d] bg-[#161b22] w-full max-w-md space-y-3">
            <h3 className="font-bold text-[#c9d1d9] text-sm">ADD AI PROVIDER</h3>
            <form onSubmit={handleCreateProvider} className="space-y-2">
              <input
                type="text"
                placeholder="Provider Name (e.g. Ollama Local)"
                value={newProvider.name}
                onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              />
              <select
                value={newProvider.type}
                onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              >
                <option value="gemini">gemini</option>
                <option value="anthropic">anthropic</option>
                <option value="openai">openai</option>
                <option value="ollama">ollama</option>
                <option value="custom">custom</option>
              </select>
              <input
                type="text"
                placeholder="Endpoint URL (optional)"
                value={newProvider.endpoint_url}
                onChange={(e) => setNewProvider({ ...newProvider, endpoint_url: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              />
              <input
                type="password"
                placeholder="API Key (optional)"
                value={newProvider.api_key}
                onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProviderModal(false)}
                  className="px-3 py-1 rounded border border-[#30363d] text-[#8b949e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-[#238636] text-white font-bold"
                >
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Model */}
      {showModelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 font-mono text-xs">
          <div className="p-4 rounded border border-[#30363d] bg-[#161b22] w-full max-w-md space-y-3">
            <h3 className="font-bold text-[#c9d1d9] text-sm">ADD AI MODEL</h3>
            <form onSubmit={handleCreateModel} className="space-y-2">
              <input
                type="text"
                placeholder="Model Display Name (e.g. Gemini 3.6 Flash)"
                value={newModel.name}
                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              />
              <input
                type="text"
                placeholder="Model Identifier (e.g. models/gemini-3.6-flash)"
                value={newModel.model_identifier}
                onChange={(e) => setNewModel({ ...newModel, model_identifier: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModelModal(false)}
                  className="px-3 py-1 rounded border border-[#30363d] text-[#8b949e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-[#238636] text-white font-bold"
                >
                  Save Model
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign / Edit Config Bundle on Role */}
      {showBundleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 font-mono text-xs">
          <div className="p-5 rounded border border-[#30363d] bg-[#161b22] w-full max-w-lg space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <h3 className="font-bold text-[#c9d1d9] text-sm">
                {editingBundle.id ? 'EDIT CONFIG BUNDLE' : `ASSIGN CONFIG BUNDLE TO ROLE: "${selectedRole.toUpperCase()}"`}
              </h3>
              <button
                onClick={() => setShowBundleModal(false)}
                className="text-[#8b949e] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBundleModal} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-[#8b949e] block font-bold">BUNDLE NAME:</label>
                <input
                  type="text"
                  required
                  value={editingBundle.name || ''}
                  onChange={(e) => setEditingBundle({ ...editingBundle, name: e.target.value })}
                  placeholder="e.g. Engineering Fallback Claude Bundle"
                  className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#8b949e] block font-bold">MODEL:</label>
                  <select
                    value={editingBundle.model_id || ''}
                    onChange={(e) => setEditingBundle({ ...editingBundle, model_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
                  >
                    {models.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.model_identifier})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#8b949e] block font-bold">PRIORITY (FALLBACK RANK):</label>
                  <input
                    type="number"
                    required
                    value={editingBundle.priority ?? 10}
                    onChange={(e) => setEditingBundle({ ...editingBundle, priority: parseInt(e.target.value) || 1 })}
                    className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
                  />
                  <p className="text-[9px] text-[#8b949e]">Higher = Higher Priority (Primary first)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#8b949e] block font-bold">PROVIDER:</label>
                  <select
                    value={editingBundle.provider_id || ''}
                    onChange={(e) => setEditingBundle({ ...editingBundle, provider_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
                  >
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#8b949e] block font-bold">HARNESS:</label>
                  <select
                    value={editingBundle.harness_id || ''}
                    onChange={(e) => setEditingBundle({ ...editingBundle, harness_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
                  >
                    {harnesses.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#8b949e] block font-bold">INVOCATION MODE:</label>
                  <select
                    value={editingBundle.invocation_mode || 'sync'}
                    onChange={(e) => setEditingBundle({ ...editingBundle, invocation_mode: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
                  >
                    <option value="sync">sync</option>
                    <option value="async">async</option>
                    <option value="stream">stream</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#8b949e] block font-bold">TIMEOUT (MS):</label>
                  <input
                    type="number"
                    value={editingBundle.timeout_ms || 60000}
                    onChange={(e) => setEditingBundle({ ...editingBundle, timeout_ms: parseInt(e.target.value) || 10000 })}
                    className="w-full px-2.5 py-1.5 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="bundleActiveToggle"
                  checked={editingBundle.is_active ?? true}
                  onChange={(e) => setEditingBundle({ ...editingBundle, is_active: e.target.checked })}
                  className="rounded border-[#30363d] bg-[#0d1117]"
                />
                <label htmlFor="bundleActiveToggle" className="text-[11px] text-[#c9d1d9] font-bold">
                  ENABLE THIS BUNDLE IN ROLE FALLBACK CHAIN
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setShowBundleModal(false)}
                  className="px-3 py-1.5 rounded border border-[#30363d] text-[#8b949e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#238636] text-white font-bold"
                >
                  Save Config Bundle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
