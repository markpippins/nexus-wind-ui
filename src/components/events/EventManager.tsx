import React, { useState, useEffect } from 'react';
import {
  Radio, Zap, Layers, RefreshCw, Plus, Trash2, CheckCircle2, Clock, AlertCircle,
  Play, Send, Terminal, FileCode, Check, X, Search, ShieldCheck, ArrowRight
} from 'lucide-react';
import { EventItem, EventType, Workflow } from '../../types/wind';
import { ThemeMode, getThemeStyles } from '../../types/theme';
import { api } from '../../services/api';

interface EventManagerProps {
  themeMode?: ThemeMode;
  onNavigateToInstance?: (instanceId: string) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'fail') => void;
}

export const EventManager: React.FC<EventManagerProps> = ({
  themeMode = 'dark' as ThemeMode,
  onNavigateToInstance,
  onToast
}) => {
  const styles = getThemeStyles(themeMode);

  const [activeSubTab, setActiveSubTab] = useState<'events' | 'event-types' | 'publish'>('events');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterConsumed, setFilterConsumed] = useState<'ALL' | 'UNCONSUMED' | 'CONSUMED'>('ALL');

  // Selected event for payload modal
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // New Event Type Form State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [newTypeName, setNewTypeName] = useState<string>('');
  const [newTypeDesc, setNewTypeDesc] = useState<string>('');
  const [newTypeWfId, setNewTypeWfId] = useState<string>('');
  const [newTypeDedup, setNewTypeDedup] = useState<string>('');
  const [newTypeSchemaStr, setNewTypeSchemaStr] = useState<string>('{\n  "source_id": "string",\n  "severity": "string"\n}');

  // Publish Event Form State
  const [pubEventType, setPubEventType] = useState<string>('');
  const [pubSubject, setPubSubject] = useState<string>('');
  const [pubSource, setPubSource] = useState<string>('cli-event-publisher');
  const [pubPayloadStr, setPubPayloadStr] = useState<string>('{\n  "action": "TRIGGER_PIPELINE",\n  "environment": "staging"\n}');
  const [pubResult, setPubResult] = useState<{ event: EventItem; triggered_instance_id?: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evts, types, wfs] = await Promise.all([
        api.getEvents(),
        api.getEventTypes(),
        api.getWorkflows()
      ]);
      setEvents(evts || []);
      setEventTypes(types || []);
      setWorkflows(wfs || []);
      if (types && types.length > 0 && !pubEventType) {
        setPubEventType(types[0].event_type);
      }
    } catch (err: any) {
      console.error('Failed loading events data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePollUnconsumed = async () => {
    try {
      const polled = await api.pollEvents(10);
      if (onToast) {
        onToast(`Polled & consumed ${polled.length} unconsumed events (FOR UPDATE SKIP LOCKED)`, 'success');
      }
      loadData();
    } catch (err: any) {
      if (onToast) onToast(`Polling failed: ${err.message}`, 'fail');
    }
  };

  const handleRegisterType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    try {
      let parsedSchema = {};
      try {
        parsedSchema = JSON.parse(newTypeSchemaStr);
      } catch (e) {
        if (onToast) onToast('Invalid JSON schema format', 'fail');
        return;
      }

      await api.createEventType({
        event_type: newTypeName.trim(),
        description: newTypeDesc.trim(),
        workflow_id: newTypeWfId || null,
        schema: parsedSchema,
        dedup_key_template: newTypeDedup.trim() || `dedup-{{payload.id}}`,
        enabled: true
      });

      if (onToast) onToast(`Registered event type [${newTypeName.trim()}]`, 'success');
      setShowRegisterModal(false);
      setNewTypeName('');
      setNewTypeDesc('');
      loadData();
    } catch (err: any) {
      if (onToast) onToast(`Error registering event type: ${err.message}`, 'fail');
    }
  };

  const handleDeleteType = async (eventType: string) => {
    if (!window.confirm(`Are you sure you want to remove event type '${eventType}'?`)) return;
    try {
      await api.deleteEventType(eventType);
      if (onToast) onToast(`Removed event type [${eventType}]`, 'info');
      loadData();
    } catch (err: any) {
      if (onToast) onToast(`Error deleting event type: ${err.message}`, 'fail');
    }
  };

  const handlePublishEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubEventType.trim()) return;

    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(pubPayloadStr);
      } catch (e) {
        if (onToast) onToast('Invalid JSON payload format', 'fail');
        return;
      }

      const res = await api.createEvent({
        event_type: pubEventType.trim(),
        subject: pubSubject.trim() || `Event: ${pubEventType.trim()}`,
        source: pubSource.trim() || 'event-publisher',
        payload: parsedPayload
      });

      setPubResult(res);
      if (onToast) {
        if (res.triggered_instance_id) {
          onToast(`Event published & auto-triggered Workflow Instance #${res.triggered_instance_id}!`, 'success');
        } else {
          onToast(`Event published successfully [ID: ${res.event.id}]`, 'success');
        }
      }
      loadData();
    } catch (err: any) {
      if (onToast) onToast(`Failed publishing event: ${err.message}`, 'fail');
    }
  };

  const filteredEvents = events.filter(evt => {
    const matchesSearch =
      evt.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.source.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterConsumed === 'UNCONSUMED') return matchesSearch && !evt.consumed_at;
    if (filterConsumed === 'CONSUMED') return matchesSearch && !!evt.consumed_at;
    return matchesSearch;
  });

  const unconsumedCount = events.filter(e => !e.consumed_at).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Header */}
      <div className={`p-5 rounded-lg border ${styles.card} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl`}>
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-400 shadow-inner">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className={`text-base font-bold font-mono uppercase tracking-wider ${styles.primaryText}`}>
                EVENT STORE & PIPELINE TRIGGERS
              </h1>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                NATS / BUS INTEGRATED
              </span>
            </div>
            <p className={`text-sm ${styles.mutedText}`}>
              Event-driven spine routing published messages to automated workflow execution graphs
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-2 text-sm font-mono">
          <div className={`px-3 py-2 rounded border ${styles.subCard} text-center`}>
            <div className={styles.mutedText}>EVENT TYPES</div>
            <div className="text-sm font-extrabold text-blue-400">{eventTypes.length}</div>
          </div>
          <div className={`px-3 py-2 rounded border ${styles.subCard} text-center`}>
            <div className={styles.mutedText}>UNCONSUMED</div>
            <div className="text-sm font-extrabold text-amber-400">{unconsumedCount}</div>
          </div>
          <div className={`px-3 py-2 rounded border ${styles.subCard} text-center`}>
            <div className={styles.mutedText}>TOTAL EVENTS</div>
            <div className="text-sm font-extrabold text-emerald-400">{events.length}</div>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all"
            title="Refresh Events"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('events')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-t font-mono text-sm font-bold transition-all border-b-2 ${
              activeSubTab === 'events'
                ? 'border-blue-500 bg-blue-950/40 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>EVENT STORE STREAM ({events.length})</span>
            {unconsumedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[9px] font-extrabold">
                {unconsumedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('event-types')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-t font-mono text-sm font-bold transition-all border-b-2 ${
              activeSubTab === 'event-types'
                ? 'border-blue-500 bg-blue-950/40 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>EVENT TYPES REGISTRY ({eventTypes.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('publish')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-t font-mono text-sm font-bold transition-all border-b-2 ${
              activeSubTab === 'publish'
                ? 'border-blue-500 bg-blue-950/40 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>PUBLISH TEST EVENT</span>
          </button>
        </div>

        {activeSubTab === 'events' && (
          <button
            onClick={handlePollUnconsumed}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-mono text-sm transition-all shadow-md"
            title="FOR UPDATE SKIP LOCKED"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>POLL UNCONSUMED (SKIP LOCKED)</span>
          </button>
        )}

        {activeSubTab === 'event-types' && (
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-sm transition-all shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>REGISTER EVENT TYPE</span>
          </button>
        )}
      </div>

      {/* TAB 1: EVENT STORE STREAM */}
      {activeSubTab === 'events' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22] p-3 rounded-lg border border-[#30363d]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search event_type, subject, source..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded pl-9 pr-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 text-sm font-mono">
              <span className="text-slate-400">STATUS:</span>
              {(['ALL', 'UNCONSUMED', 'CONSUMED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterConsumed(st)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                    filterConsumed === st
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-[#0d1117] border-[#30363d] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-2">
            {filteredEvents.map(evt => {
              const isConsumed = !!evt.consumed_at;
              return (
                <div
                  key={evt.id}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isConsumed
                      ? 'bg-[#161b22]/60 border-[#30363d]/80 text-slate-300'
                      : 'bg-amber-950/20 border-amber-800/80 text-slate-100 shadow-md'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 p-1.5 rounded border ${isConsumed ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-amber-950 border-amber-700 text-amber-400'}`}>
                      {isConsumed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-pulse" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                          {evt.event_type}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${isConsumed ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-amber-900/80 text-amber-300 border-amber-700'}`}>
                          {isConsumed ? 'CONSUMED' : 'UNCONSUMED'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: {evt.id}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200">
                        {evt.subject}
                      </h4>
                      <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
                        <span>SOURCE: {evt.source}</span>
                        <span>PUBLISHED: {new Date(evt.created_at).toLocaleString()}</span>
                        {evt.consumed_at && (
                          <span className="text-emerald-400">CONSUMED: {new Date(evt.consumed_at).toLocaleTimeString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedEvent(evt)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[11px] font-bold transition-all flex items-center space-x-1"
                    >
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>INSPECT PAYLOAD</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="p-8 text-center text-sm font-mono text-slate-500 bg-[#161b22] border border-[#30363d] rounded-lg">
                No events found matching current search filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EVENT TYPES REGISTRY */}
      {activeSubTab === 'event-types' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventTypes.map(type => (
              <div
                key={type.event_type}
                className={`p-4 rounded-lg border ${styles.card} space-y-3 relative shadow-lg`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-extrabold text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-800">
                        {type.event_type}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${type.enabled ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {type.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-2 font-sans">
                      {type.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteType(type.event_type)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-all"
                    title="Delete event type"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">BOUND WORKFLOW:</span>
                    <span className="font-bold text-cyan-400">
                      {type.workflow_name || type.workflow_id || 'None (Unbound)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">DEDUP TEMPLATE:</span>
                    <span className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                      {type.dedup_key_template || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>REGISTERED: {new Date(type.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => {
                      setPubEventType(type.event_type);
                      setActiveSubTab('publish');
                    }}
                    className="text-blue-400 hover:underline flex items-center space-x-1 font-bold"
                  >
                    <span>EMIT TEST EVENT</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PUBLISH TEST EVENT FORM */}
      {activeSubTab === 'publish' && (
        <div className={`p-5 rounded-lg border ${styles.card} max-w-2xl mx-auto space-y-4 shadow-2xl`}>
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
            <Send className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                PUBLISH PIPELINE EVENT (NATS DISPATCH)
              </h3>
              <p className="text-sm text-slate-400 font-mono">
                Emit event message to test automatic workflow triggers
              </p>
            </div>
          </div>

          <form onSubmit={handlePublishEvent} className="space-y-4 font-mono text-sm">
            <div className="space-y-1">
              <label className="text-slate-300 font-bold">EVENT TYPE:</label>
              <select
                value={pubEventType}
                onChange={e => setPubEventType(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-slate-200 font-mono focus:border-blue-500"
                required
              >
                {eventTypes.map(t => (
                  <option key={t.event_type} value={t.event_type}>
                    {t.event_type} ({t.workflow_name || 'No Workflow'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold">EVENT SUBJECT:</label>
              <input
                type="text"
                value={pubSubject}
                onChange={e => setPubSubject(e.target.value)}
                placeholder="e.g. PR #104: Hotfix deployment ready"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-slate-200 font-mono focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold">EVENT SOURCE / SENDER:</label>
              <input
                type="text"
                value={pubSource}
                onChange={e => setPubSource(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-slate-200 font-mono focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold">JSON PAYLOAD BODY:</label>
              <textarea
                value={pubPayloadStr}
                onChange={e => setPubPayloadStr(e.target.value)}
                rows={5}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-slate-200 font-mono focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-sm transition-all flex items-center justify-center space-x-2 shadow-lg"
            >
              <Send className="w-4 h-4" />
              <span>PUBLISH EVENT TO BUS</span>
            </button>
          </form>

          {pubResult && (
            <div className="p-3.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 space-y-2 font-mono text-sm">
              <div className="flex items-center space-x-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>EVENT EMITTED SUCCESSFULLY</span>
              </div>
              <p>Event ID: {pubResult.event.id}</p>
              {pubResult.triggered_instance_id ? (
                <div className="p-2 rounded bg-emerald-900/60 border border-emerald-700 flex items-center justify-between">
                  <span>Auto-spawned Workflow Instance #{pubResult.triggered_instance_id}</span>
                  {onNavigateToInstance && (
                    <button
                      onClick={() => onNavigateToInstance(pubResult.triggered_instance_id!)}
                      className="px-2 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] hover:bg-emerald-400"
                    >
                      VIEW INSTANCE
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">No workflow was auto-triggered by this event type.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* REGISTER EVENT TYPE MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-lg p-5 shadow-2xl space-y-4 font-mono text-sm text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Radio className="w-4 h-4 text-blue-400" />
                <span>REGISTER NEW EVENT TYPE</span>
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterType} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">EVENT TYPE SLUG:</label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  placeholder="e.g. github.push.main or secops.alert"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-slate-200 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">DESCRIPTION:</label>
                <input
                  type="text"
                  value={newTypeDesc}
                  onChange={e => setNewTypeDesc(e.target.value)}
                  placeholder="Purpose of this event stream..."
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">AUTO-TRIGGER WORKFLOW BINDING:</label>
                <select
                  value={newTypeWfId}
                  onChange={e => setNewTypeWfId(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-slate-200 focus:border-blue-500"
                >
                  <option value="">None (Standalone Event)</option>
                  {workflows.map(wf => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name} ({wf.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">DEDUP KEY TEMPLATE:</label>
                <input
                  type="text"
                  value={newTypeDedup}
                  onChange={e => setNewTypeDedup(e.target.value)}
                  placeholder="e.g. pr-{{payload.repository}}-{{payload.pr_id}}"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">JSON SCHEMA SPECIFICATION:</label>
                <textarea
                  value={newTypeSchemaStr}
                  onChange={e => setNewTypeSchemaStr(e.target.value)}
                  rows={4}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-slate-200 focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-md"
                >
                  REGISTER TYPE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT PAYLOAD INSPECTION MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-[#161b22] border border-[#30363d] rounded-lg p-5 shadow-2xl space-y-4 font-mono text-sm text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>INSPECT EVENT PAYLOAD #{selectedEvent.id}</span>
              </h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded bg-[#0d1117] border border-[#30363d]">
                <div><span className="text-slate-400">TYPE:</span> {selectedEvent.event_type}</div>
                <div><span className="text-slate-400">SOURCE:</span> {selectedEvent.source}</div>
                <div><span className="text-slate-400">CONSUMED:</span> {selectedEvent.consumed_at ? 'YES' : 'NO'}</div>
                <div><span className="text-slate-400">PUBLISHED:</span> {new Date(selectedEvent.created_at).toLocaleTimeString()}</div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold">PAYLOAD BODY JSON:</span>
                <pre className="p-3 rounded bg-[#0d1117] border border-[#30363d] text-[11px] text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>

              {selectedEvent.metadata && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold">METADATA & TRACE INFO:</span>
                  <pre className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded bg-slate-800 text-slate-200 font-bold hover:bg-slate-700"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
