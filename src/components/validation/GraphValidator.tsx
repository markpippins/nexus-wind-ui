import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, GitMerge,
  HelpCircle, Layers, ArrowRight, Zap, Check, X
} from 'lucide-react';
import { Workflow, GraphValidationResult, StructuralValidationResult } from '../../types/wind';
import { api } from '../../services/api';

interface GraphValidatorProps {
  workflows: Workflow[];
  isDark: boolean;
  onRefresh: () => void;
}

export const GraphValidator: React.FC<GraphValidatorProps> = ({
  workflows,
  isDark,
  onRefresh
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || '');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [graphResult, setGraphResult] = useState<GraphValidationResult | null>(null);
  const [structResult, setStructResult] = useState<StructuralValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflowId) {
      setSelectedWorkflowId(workflows[0].id);
    }
  }, [workflows]);

  useEffect(() => {
    if (selectedWorkflowId) {
      loadVersions(selectedWorkflowId);
    }
  }, [selectedWorkflowId]);

  useEffect(() => {
    if (selectedVersionId) {
      runValidation(selectedVersionId);
    }
  }, [selectedVersionId]);

  const loadVersions = async (wfId: string) => {
    try {
      const vers = await api.getVersions(wfId);
      if (vers.length > 0) {
        const active = vers.find(v => v.is_active) || vers[0];
        setSelectedVersionId(active.id);
      } else {
        setSelectedVersionId('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runValidation = async (verId: string) => {
    setIsValidating(true);
    try {
      const graph = await api.validateVersion(verId);
      setGraphResult(graph);
      const struct = await api.validateVersionStructure(verId);
      setStructResult(struct);
    } catch (e) {
      console.error(e);
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualRun = () => {
    if (selectedVersionId) runValidation(selectedVersionId);
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto font-sans bg-[#0b0e14]">
      {/* Top Header */}
      <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold font-mono text-[#c9d1d9] uppercase">
              GRAPH INTEGRITY & STRUCTURAL VALIDATION
            </h1>
            <p className="text-[11px] text-[#8b949e]">
              Validate DAG health, unreachable state checks, missing edge analysis, and single entrypoint constraints
            </p>
          </div>
        </div>

        {/* Workflow / Version Selector */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
            className="px-2.5 py-1 rounded text-xs font-mono border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
          >
            {workflows.map(wf => (
              <option key={wf.id} value={wf.id}>{wf.name}</option>
            ))}
          </select>

          <button
            onClick={handleManualRun}
            className="px-2.5 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-bold transition-all flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            <span>RUN VALIDATION</span>
          </button>
        </div>
      </div>

      {/* Main Validation Suite Dashboard */}
      {selectedVersionId ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1: Graph Integrity Check */}
          <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className={`w-4 h-4 ${graphResult?.valid ? 'text-green-400' : 'text-amber-400'}`} />
                <h2 className="font-mono text-xs font-bold text-[#c9d1d9]">GRAPH INTEGRITY REPORT</h2>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                graphResult?.valid
                  ? 'bg-green-950/80 text-green-400 border-green-800'
                  : 'bg-amber-950/80 text-amber-400 border-amber-800'
              }`}>
                {graphResult?.valid ? '100% VALID' : `${graphResult?.issue_count || 0} ISSUES`}
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="text-[#8b949e] text-[11px]">
                Endpoint: <span className="text-[#58a6ff]">GET /api/validate/{selectedVersionId}</span>
              </div>

              {graphResult?.issues && graphResult.issues.length > 0 ? (
                <div className="space-y-1.5">
                  {graphResult.issues.map((iss, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-[#0d1117] border border-[#30363d] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 flex items-center text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          {iss.type.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-[#8b949e] uppercase">{iss.severity}</span>
                      </div>
                      <p className="text-[10px] text-[#c9d1d9]">{iss.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-[#0d1117] rounded border border-[#30363d] text-green-400 space-y-1.5">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-green-400" />
                  <p className="font-bold text-xs">Zero graph issues detected.</p>
                  <p className="text-[10px] text-[#8b949e]">Every outcome code is properly handled by a directed edge, and all nodes are reachable.</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Structural Checks */}
          <div className="p-3.5 rounded border border-[#30363d] bg-[#161b22] space-y-3">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
              <div className="flex items-center space-x-2">
                <Layers className={`w-4 h-4 ${structResult?.valid ? 'text-green-400' : 'text-rose-400'}`} />
                <h2 className="font-mono text-xs font-bold text-[#c9d1d9]">STRUCTURAL SPECIFICATION CHECKS</h2>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                structResult?.valid
                  ? 'bg-green-950/80 text-green-400 border-green-800'
                  : 'bg-rose-950/80 text-rose-400 border-rose-800'
              }`}>
                {structResult?.valid ? 'PASSED' : 'DEFECTIVE'}
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="text-[#8b949e] text-[11px]">
                Endpoint: <span className="text-[#58a6ff]">POST /api/validate/{selectedVersionId}/structure</span>
              </div>

              <div className="space-y-1.5">
                {structResult?.checks.map((chk, idx) => (
                  <div key={idx} className={`p-2.5 rounded border flex items-center justify-between ${
                    chk.pass
                      ? 'bg-[#0d1117] border-green-900/60 text-green-300'
                      : 'bg-[#0d1117] border-rose-900/60 text-rose-300'
                  }`}>
                    <div className="space-y-0.5">
                      <span className="font-bold uppercase block text-[11px]">{chk.check}</span>
                      <span className="text-[10px] text-[#8b949e]">{chk.detail}</span>
                    </div>
                    {chk.pass ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-rose-400" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-[#8b949e] font-mono text-xs italic">
          Select a workflow above to run graph integrity and structural validation tests.
        </div>
      )}
    </div>
  );
};
