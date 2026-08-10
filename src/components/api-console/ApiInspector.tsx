import React, { useState, useEffect } from 'react';
import {
  Terminal, Copy, Check, Trash2, RefreshCw, Play, Code2, Database,
  Search, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { ApiLog } from '../../types/wind';
import { api } from '../../services/api';

interface ApiInspectorProps {
  isDark: boolean;
  onRefreshAll: () => void;
}

export const ApiInspector: React.FC<ApiInspectorProps> = ({ isDark, onRefreshAll }) => {
  const [logs, setLogs] = useState<ApiLog[]>(api.getLogs());
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [methodFilter, setMethodFilter] = useState<string>('');

  useEffect(() => {
    const unsub = api.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
      if (!selectedLog && updatedLogs.length > 0) {
        setSelectedLog(updatedLogs[0]);
      }
    });
    return () => unsub();
  }, [selectedLog]);

  const handleCopyCurl = (log: ApiLog) => {
    navigator.clipboard.writeText(log.curlCommand);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleClearLogs = () => {
    api.clearLogs();
    setSelectedLog(null);
  };

  const handleResetMockData = () => {
    if (!confirm('Reset in-memory mock database to initial seed data?')) return;
    api.resetMockData();
    onRefreshAll();
  };

  const filteredLogs = methodFilter ? logs.filter(l => l.method === methodFilter) : logs;

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto font-sans bg-[#0b0e14]">
      {/* Top Header */}
      <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-cyan-950/40 text-[#58a6ff] border border-cyan-800/40">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold font-mono text-[#c9d1d9] uppercase">
              IDE REST API CONSOLE & REQUEST LOGS
            </h1>
            <p className="text-[11px] text-[#8b949e]">
              Inspect real-time wind-srv API calls, cURL command parameters, and reset mock state
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          <button
            onClick={handleResetMockData}
            className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 font-bold transition-all flex items-center space-x-1"
            title="Reset mock database to default seed state"
          >
            <Database className="w-3.5 h-3.5" />
            <span>RESET MOCK SEED</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="px-2.5 py-1 rounded border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] hover:text-white transition-all flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR LOGS</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono text-xs">
        {/* Left Col: Request Stream */}
        <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] flex flex-col space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
            <span className="font-bold text-[#8b949e] text-[11px]">REQUEST LOGS ({filteredLogs.length})</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2 py-0.5 rounded text-[10px] border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredLogs.map(log => {
              const isSelected = selectedLog?.id === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-2 rounded border cursor-pointer transition-all space-y-1 ${
                    isSelected
                      ? 'bg-[#0d1117] border-[#58a6ff] shadow-sm'
                      : 'bg-[#0d1117]/60 border-[#30363d] hover:border-[#8b949e]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        log.method === 'GET' ? 'bg-blue-950/80 text-blue-300 border border-blue-800' :
                        log.method === 'POST' ? 'bg-green-950/80 text-green-300 border border-green-800' :
                        log.method === 'PUT' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                        'bg-rose-950/80 text-rose-300 border border-rose-800'
                      }`}>
                        {log.method}
                      </span>
                      <span className="font-semibold text-[#c9d1d9] truncate max-w-[140px] text-[11px]">{log.endpoint}</span>
                    </div>

                    <span className={`text-[10px] font-bold ${
                      log.status >= 200 && log.status < 300 ? 'text-green-400' : 'text-rose-400'
                    }`}>
                      {log.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
                    <span>{log.durationMs}ms</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="p-8 text-center text-[#8b949e] italic text-xs">
                No request logs recorded yet. Interact with the application to stream calls.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Selected Log Detail & cURL Copy */}
        {selectedLog ? (
          <div className="lg:col-span-2 p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#58a6ff] text-xs">{selectedLog.method}</span>
                <span className="font-bold text-[#c9d1d9] text-xs select-all">{selectedLog.endpoint}</span>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                selectedLog.status < 300 ? 'bg-green-950 text-green-400 border-green-800' : 'bg-rose-950 text-rose-400 border-rose-800'
              }`}>
                HTTP {selectedLog.status} ({selectedLog.durationMs}ms)
              </span>
            </div>

            {/* cURL Command Generator */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[#8b949e] text-[11px]">
                <span className="font-semibold">EQUIVALENT cURL COMMAND:</span>
                <button
                  onClick={() => handleCopyCurl(selectedLog)}
                  className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-[10px] font-bold flex items-center space-x-1 border border-[#30363d]"
                >
                  {copiedId === selectedLog.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === selectedLog.id ? 'COPIED' : 'COPY cURL'}</span>
                </button>
              </div>

              <pre className="p-2.5 rounded bg-[#0d1117] text-green-400 border border-[#30363d] overflow-x-auto text-[10px] leading-relaxed">
                {selectedLog.curlCommand}
              </pre>
            </div>

            {/* Request Payload */}
            {selectedLog.requestPayload && (
              <div className="space-y-1">
                <span className="text-[#8b949e] font-semibold block text-[11px]">REQUEST BODY:</span>
                <pre className="p-2.5 rounded bg-[#0d1117] text-[#58a6ff] border border-[#30363d] overflow-x-auto text-[10px]">
                  {JSON.stringify(selectedLog.requestPayload, null, 2)}
                </pre>
              </div>
            )}

            {/* Response Payload */}
            <div className="space-y-1">
              <span className="text-[#8b949e] font-semibold block text-[11px]">RESPONSE PAYLOAD:</span>
              <pre className="p-2.5 rounded bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] overflow-x-auto text-[10px] max-h-60">
                {JSON.stringify(selectedLog.responsePayload, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 rounded border border-[#30363d] bg-[#161b22] text-center text-[#8b949e] italic text-xs">
            Select a log entry on the left to inspect cURL payload, duration, and response body.
          </div>
        )}
      </div>
    </div>
  );
};
