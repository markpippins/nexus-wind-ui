import { mockBackend } from './mockBackend';
import {
  ApiLog, Outcome, Task, Workflow, WorkflowVersion, WorkflowNode, WorkflowEdge
} from '../types/wind';
import {
  PromptTemplate, RoleTaskAssignment, RoleMemoryProcedure, RoleToolAccess, ScheduledAgent
} from '../types/tackle';

export type ApiMode = 'MOCK' | 'LIVE';

class ApiService {
  // The environment-selected mode is authoritative at startup: the systemd
  // unit runs VITE_WIND_MODE=live (process env beats .env in Vite), so the
  // client boots LIVE instead of defaulting to MOCK or honoring a stale
  // localStorage override from a previous session. The in-UI toggle still
  // switches mode for the current session.
  private mode: ApiMode = (import.meta as any).env?.VITE_WIND_MODE === 'live' ? 'LIVE' : 'MOCK';
  // T25 2.4 (R-A-2026-08-15-003 collision resolution): runtime lookup with
  // env-var fallback. Resolution precedence:
  //   localStorage (explicit user override) > runtime lookup (terrain
  //   /api/v1/lookup/{unit}) > $<UNIT>_TARGET env > legacy localhost literal.
  // The env/legacy value is set synchronously so callers always have a URL;
  // the lookup refines it once it returns (3s timeout, silent on failure).
  private lookupUrl: string = (import.meta as any).env?.VITE_LOOKUP_URL || 'http://localhost:8084';
  // wind-srv — serves /api/* and /health (default :3300)
  private baseUrl: string = (import.meta as any).env?.VITE_WIND_SRV_TARGET || 'http://localhost:3300';
  // tackle-srv — serves /config/ai/*, /sessions, /scheduler, /memory/*,
  // /prompts/*, /tasks/*, /config/failure-recovery (default :3410)
  private tackleBaseUrl: string = (import.meta as any).env?.VITE_TACKLE_SRV_TARGET || 'http://localhost:3410';
  private logs: ApiLog[] = [];
  private listeners: ((logs: ApiLog[]) => void)[] = [];

  constructor() {
    // URL overrides from a previous session still apply (T25 collision
    // resolution), but mode is NOT restored from localStorage — env wins.
    const savedUrl = localStorage.getItem('wind_api_base_url');
    if (savedUrl) {
      this.baseUrl = savedUrl;
    }
    const savedTackleUrl = localStorage.getItem('wind_tackle_base_url');
    if (savedTackleUrl) {
      this.tackleBaseUrl = savedTackleUrl;
    }
    // Non-blocking runtime lookup — refines the URL unless the user set an
    // explicit override in localStorage.
    void this.resolveFromLookup();
  }

  private async lookupUnit(unit: string): Promise<string | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    try {
      const res = await fetch(`${this.lookupUrl}/api/v1/lookup/${unit}`, { signal: ctrl.signal });
      if (!res.ok) {
        return null;
      }
      const d = await res.json();
      const eps = d.endpoints || [];
      const e = eps.find((x: any) => x.instance === d.preferred) || eps[0];
      if (!e || !e.port) {
        return null;
      }
      return `${e.scheme || 'http'}://${e.ip || e.host}:${e.port}`;
    } catch {
      return null; // lookup down -> env/legacy fallback stays
    } finally {
      clearTimeout(t);
    }
  }

  private async resolveFromLookup(): Promise<void> {
    try {
      const [wind, tackle] = await Promise.all([
        this.lookupUnit('wind-srv'),
        this.lookupUnit('tackle-srv'),
      ]);
      if (wind && !localStorage.getItem('wind_api_base_url')) {
        this.baseUrl = wind;
      }
      if (tackle && !localStorage.getItem('wind_tackle_base_url')) {
        this.tackleBaseUrl = tackle;
      }
    } catch {
      // keep env/legacy defaults
    }
  }

  public getMode(): ApiMode {
    return this.mode;
  }

  public setMode(mode: ApiMode) {
    this.mode = mode;
    localStorage.setItem('wind_api_mode', mode);
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
    localStorage.setItem('wind_api_base_url', url);
  }

  public getTackleBaseUrl(): string {
    return this.tackleBaseUrl;
  }

  public setTackleBaseUrl(url: string) {
    this.tackleBaseUrl = url;
    localStorage.setItem('wind_tackle_base_url', url);
  }

  public getLogs(): ApiLog[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  public subscribe(fn: (logs: ApiLog[]) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn([...this.logs]));
  }

  // Route an endpoint to the service that owns it:
  // wind-srv serves /health and /api/*; tackle-srv serves everything else.
  private baseFor(endpoint: string): string {
    if (endpoint === '/health' || endpoint.startsWith('/api/')) {
      return this.baseUrl;
    }
    return this.tackleBaseUrl;
  }

  private logCall(method: string, endpoint: string, status: number, durationMs: number, reqBody?: any, resData?: any) {
    const curl = this.generateCurl(method, endpoint, reqBody);
    const log: ApiLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      status,
      durationMs,
      mode: this.mode,
      requestPayload: reqBody,
      responsePayload: resData,
      curlCommand: curl
    };
    this.logs.unshift(log);
    if (this.logs.length > 100) this.logs.pop();
    this.notify();
  }

  private generateCurl(method: string, endpoint: string, body?: any): string {
    const fullUrl = `${this.baseFor(endpoint)}${endpoint}`;
    if (method === 'GET' || method === 'DELETE') {
      return `curl -s -X ${method} "${fullUrl}"`;
    }
    return `curl -s -X ${method} "${fullUrl}" \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(body || {})}'`;
  }

  // --- Wrapper for requests ---
  private async request<T>(method: string, endpoint: string, mockFn: () => T, body?: any): Promise<T> {
    const start = performance.now();
    if (this.mode === 'MOCK') {
      await new Promise(res => setTimeout(res, 60)); // Simulate brief network tick
      try {
        const data = mockFn();
        const duration = Math.round(performance.now() - start);
        this.logCall(method, endpoint, 200, duration, body, data);
        return data;
      } catch (err: any) {
        const duration = Math.round(performance.now() - start);
        const errorMsg = err.message || 'Mock processing error';
        this.logCall(method, endpoint, 400, duration, body, { error: errorMsg });
        throw err;
      }
    } else {
      // LIVE REST Call
      try {
        const fullUrl = `${this.baseFor(endpoint)}${endpoint}`;
        const options: RequestInit = {
          method,
          headers: { 'Content-Type': 'application/json' }
        };
        if (body && (method === 'POST' || method === 'PUT')) {
          options.body = JSON.stringify(body);
        }
        const res = await fetch(fullUrl, options);
        const data = await res.json();
        const duration = Math.round(performance.now() - start);
        this.logCall(method, endpoint, res.status, duration, body, data);
        if (!res.ok) {
          throw new Error(data.message || `HTTP ${res.status}`);
        }
        return data as T;
      } catch (err: any) {
        const duration = Math.round(performance.now() - start);
        this.logCall(method, endpoint, 500, duration, body, { error: err.message });
        throw err;
      }
    }
  }

  // --- HEALTH ---
  public getHealth() {
    return this.request('GET', '/health', () => mockBackend.getHealth());
  }

  // --- ROLES ---
  public getVRoles() {
    return this.request('GET', '/api/v-roles', () => mockBackend.getVRoles());
  }

  public getVRoleByName(name: string) {
    return this.request('GET', `/api/v-roles/${encodeURIComponent(name)}`, () => mockBackend.getVRoleByName(name));
  }

  // --- OFFICES ---
  public getOffices() {
    return this.request('GET', '/api/offices', () => mockBackend.getOffices());
  }

  public getOfficeById(id: string) {
    return this.request('GET', `/api/offices/${id}`, () => mockBackend.getOfficeById(id));
  }

  public createOffice(data: { name: string; description?: string }) {
    return this.request('POST', '/api/offices', () => mockBackend.createOffice(data), data);
  }

  public updateOffice(id: string, data: Partial<{ name: string; description: string }>) {
    return this.request('PUT', `/api/offices/${id}`, () => mockBackend.updateOffice(id, data), data);
  }

  public deleteOffice(id: string) {
    return this.request('DELETE', `/api/offices/${id}`, () => mockBackend.deleteOffice(id));
  }

  // --- TITLES ---
  public getTitles(officeId?: string) {
    const url = officeId ? `/api/titles?office_id=${officeId}` : '/api/titles';
    return this.request('GET', url, () => mockBackend.getTitles(officeId));
  }

  public getTitleById(id: string) {
    return this.request('GET', `/api/titles/${id}`, () => mockBackend.getTitleById(id));
  }

  public createTitle(data: { office_id: string; role_id: string; display_name: string }) {
    return this.request('POST', '/api/titles', () => mockBackend.createTitle(data), data);
  }

  public updateTitle(id: string, data: Partial<{ role_id: string; display_name: string }>) {
    return this.request('PUT', `/api/titles/${id}`, () => mockBackend.updateTitle(id, data), data);
  }

  public deleteTitle(id: string) {
    return this.request('DELETE', `/api/titles/${id}`, () => mockBackend.deleteTitle(id));
  }

  // --- TASKS ---
  public async getTasks(officeId?: string): Promise<Task[]> {
    const url = officeId ? `/api/tasks?office_id=${officeId}` : '/api/tasks';
    const data = await this.request<Task[]>('GET', url, () => mockBackend.getTasks(officeId));
    if (this.mode === 'LIVE') {
      // wind-srv's list endpoint doesn't embed outcomes; fetch per task to
      // match the mock shape the UI was built against.
      return Promise.all(data.map(async (t) => {
        try {
          const outs = await this.request<Outcome[]>('GET', `/api/outcomes?task_id=${t.id}`, () => []);
          return { ...t, outcomes: outs };
        } catch {
          return t;
        }
      }));
    }
    return data;
  }

  public getTaskById(id: string) {
    return this.request('GET', `/api/tasks/${id}`, () => mockBackend.getTaskById(id));
  }

  public createTask(data: { office_id: string; title_id: string; name: string; description?: string; input_spec?: Record<string, any> }) {
    return this.request('POST', '/api/tasks', () => mockBackend.createTask(data), data);
  }

  public updateTask(id: string, data: Partial<{ name: string; description: string; input_spec: Record<string, any> }>) {
    return this.request('PUT', `/api/tasks/${id}`, () => mockBackend.updateTask(id, data), data);
  }

  public deleteTask(id: string) {
    return this.request('DELETE', `/api/tasks/${id}`, () => mockBackend.deleteTask(id));
  }

  // --- OUTCOMES ---
  public async getOutcomes(taskId?: string): Promise<Outcome[]> {
    if (this.mode === 'LIVE' && !taskId) {
      // wind-srv requires task_id; aggregate across tasks for parity with mock
      const tasks = await this.getTasks();
      return tasks.flatMap(t => t.outcomes || []);
    }
    const url = taskId ? `/api/outcomes?task_id=${taskId}` : '/api/outcomes';
    return this.request('GET', url, () => mockBackend.getOutcomes(taskId));
  }

  public getOutcomeById(id: string) {
    return this.request('GET', `/api/outcomes/${id}`, () => mockBackend.getOutcomeById(id));
  }

  public createOutcome(data: { task_id: string; code: string; description?: string; output_spec?: Record<string, any> }) {
    return this.request('POST', '/api/outcomes', () => mockBackend.createOutcome(data), data);
  }

  public deleteOutcome(id: string) {
    return this.request('DELETE', `/api/outcomes/${id}`, () => mockBackend.deleteOutcome(id));
  }

  // --- WORKFLOWS ---
  public async getWorkflows(): Promise<Workflow[]> {
    const data = await this.request<Workflow[]>('GET', '/api/workflows', () => mockBackend.getWorkflows());
    if (this.mode === 'LIVE') {
      // wind-srv returns version_count as a string ("1"); normalize to number
      return data.map(w => ({
        ...w,
        version_count: w.version_count != null ? parseInt(String(w.version_count), 10) : undefined,
        active_version: w.active_version != null ? Number(w.active_version) : undefined,
      }));
    }
    return data;
  }

  public getWorkflowById(id: string) {
    return this.request('GET', `/api/workflows/${id}`, () => mockBackend.getWorkflowById(id));
  }

  public createWorkflow(data: { name: string; description?: string }) {
    return this.request('POST', '/api/workflows', () => mockBackend.createWorkflow(data), data);
  }

  public updateWorkflow(id: string, data: Partial<{ name: string; description: string }>) {
    return this.request('PUT', `/api/workflows/${id}`, () => mockBackend.updateWorkflow(id, data), data);
  }

  public deleteWorkflow(id: string) {
    return this.request('DELETE', `/api/workflows/${id}`, () => mockBackend.deleteWorkflow(id));
  }

  // --- VERSIONS ---
  public async getVersions(workflowId?: string): Promise<WorkflowVersion[]> {
    const url = workflowId ? `/api/versions?workflow_id=${workflowId}` : '/api/versions';
    const data = await this.request<WorkflowVersion[]>('GET', url, () => mockBackend.getVersions(workflowId));
    if (this.mode === 'LIVE') {
      // wind-srv's list endpoint doesn't embed nodes/edges (only getVersionById
      // does); fetch per version to match the mock shape.
      return Promise.all(data.map(async (v) => {
        try {
          const [nodes, edges] = await Promise.all([
            this.request<WorkflowNode[]>('GET', `/api/nodes?version_id=${v.id}`, () => []),
            this.request<WorkflowEdge[]>('GET', `/api/edges?version_id=${v.id}`, () => []),
          ]);
          return { ...v, nodes, edges };
        } catch {
          return v;
        }
      }));
    }
    return data;
  }

  public getVersionById(id: string) {
    return this.request('GET', `/api/versions/${id}`, () => mockBackend.getVersionById(id));
  }

  public createVersion(data: { workflow_id: string }) {
    return this.request('POST', '/api/versions', () => mockBackend.createVersion(data), data);
  }

  public activateVersion(id: string) {
    return this.request('POST', `/api/versions/${id}/activate`, () => mockBackend.activateVersion(id));
  }

  public deleteVersion(id: string) {
    return this.request('DELETE', `/api/versions/${id}`, () => mockBackend.deleteVersion(id));
  }

  // --- NODES ---
  public getNodes(versionId?: string) {
    const url = versionId ? `/api/nodes?version_id=${versionId}` : '/api/nodes';
    return this.request('GET', url, () => mockBackend.getNodes(versionId));
  }

  public getNodeById(id: string) {
    return this.request('GET', `/api/nodes/${id}`, () => mockBackend.getNodeById(id));
  }

  public createNode(data: { workflow_version_id: string; task_id: string; name: string; is_entrypoint?: boolean; is_terminal?: boolean; x?: number; y?: number }) {
    return this.request('POST', '/api/nodes', () => mockBackend.createNode(data), data);
  }

  public updateNode(id: string, data: Partial<{ name: string; is_entrypoint: boolean; is_terminal: boolean; x: number; y: number }>) {
    return this.request('PUT', `/api/nodes/${id}`, () => mockBackend.updateNode(id, data), data);
  }

  public deleteNode(id: string) {
    return this.request('DELETE', `/api/nodes/${id}`, () => mockBackend.deleteNode(id));
  }

  // --- EDGES ---
  public getEdges(versionId?: string) {
    const url = versionId ? `/api/edges?version_id=${versionId}` : '/api/edges';
    return this.request('GET', url, () => mockBackend.getEdges(versionId));
  }

  public createEdge(data: { workflow_version_id: string; from_node_id: string; from_task_id: string; outcome_id: string; to_node_id: string }) {
    return this.request('POST', '/api/edges', () => mockBackend.createEdge(data), data);
  }

  public deleteEdge(id: string) {
    return this.request('DELETE', `/api/edges/${id}`, () => mockBackend.deleteEdge(id));
  }

  // --- INSTANCES (RUNTIME) ---
  public getInstances(status?: string, workflowId?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (workflowId) params.append('workflow_id', workflowId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request('GET', `/api/instances${query}`, () => mockBackend.getInstances(status, workflowId));
  }

  public getInstanceById(id: string) {
    return this.request('GET', `/api/instances/${id}`, () => mockBackend.getInstanceById(id));
  }

  public startInstance(data: { workflow_version_id: string }) {
    return this.request('POST', '/api/instances', () => mockBackend.startInstance(data), data);
  }

  public pauseInstance(id: string) {
    return this.request('POST', `/api/instances/${id}/pause`, () => mockBackend.pauseInstance(id));
  }

  public resumeInstance(id: string) {
    return this.request('POST', `/api/instances/${id}/resume`, () => mockBackend.resumeInstance(id));
  }

  public stopInstance(id: string) {
    return this.request('POST', `/api/instances/${id}/stop`, () => mockBackend.stopInstance(id));
  }

  public advanceInstance(id: string, data: { ticket_id: string; outcome_id: string }) {
    return this.request('POST', `/api/instances/${id}/advance`, () => mockBackend.advanceInstance(id, data.ticket_id, data.outcome_id), data);
  }

  // --- TICKETS ---
  public getTickets(instanceId?: string, status?: string, titleId?: string) {
    const params = new URLSearchParams();
    if (instanceId) params.append('instance_id', instanceId);
    if (status) params.append('status', status);
    if (titleId) params.append('title_id', titleId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request('GET', `/api/tickets${query}`, () => mockBackend.getTickets(instanceId, status, titleId));
  }

  public getTicketById(id: string) {
    return this.request('GET', `/api/tickets/${id}`, () => mockBackend.getTicketById(id));
  }

  public updateTicketStatus(id: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') {
    return this.request('PUT', `/api/tickets/${id}/status`, () => mockBackend.updateTicketStatus(id, status), { status });
  }

  public cancelTicket(id: string) {
    return this.request('POST', `/api/tickets/${id}/cancel`, () => mockBackend.cancelTicket(id));
  }

  // --- RECEIPTS ---
  public getReceipts(ticketId?: string) {
    const query = ticketId ? `?ticket_id=${ticketId}` : '';
    return this.request('GET', `/api/receipts${query}`, () => mockBackend.getReceipts(ticketId));
  }

  public getReceiptById(id: string) {
    return this.request('GET', `/api/receipts/${id}`, () => mockBackend.getReceiptById(id));
  }

  // --- VALIDATE ---
  public validateVersion(versionId: string) {
    return this.request('GET', `/api/validate/${versionId}`, () => mockBackend.validateGraph(versionId));
  }

  public validateVersionStructure(versionId: string) {
    return this.request('POST', `/api/validate/${versionId}/structure`, () => mockBackend.validateStructure(versionId));
  }

  // --- TACKLE-SRV: AI CONFIG REGISTRY ---
  public getAIProviders() {
    return this.request('GET', '/config/ai/providers', () => mockBackend.getAIProviders());
  }

  public upsertAIProvider(data: any) {
    return this.request('POST', '/config/ai/provider', () => mockBackend.upsertAIProvider(data), data);
  }

  public deleteAIProvider(id: string) {
    return this.request('DELETE', `/config/ai/provider/${id}`, () => mockBackend.deleteAIProvider(id));
  }

  public getAIHarnesses() {
    return this.request('GET', '/config/ai/harnesses', () => mockBackend.getAIHarnesses());
  }

  public upsertAIHarness(data: any) {
    return this.request('POST', '/config/ai/harness', () => mockBackend.upsertAIHarness(data), data);
  }

  public deleteAIHarness(id: string) {
    return this.request('DELETE', `/config/ai/harness/${id}`, () => mockBackend.deleteAIHarness(id));
  }

  public getAIModels() {
    return this.request('GET', '/config/ai/models', () => mockBackend.getAIModels());
  }

  public upsertAIModel(data: any) {
    return this.request('POST', '/config/ai/model', () => mockBackend.upsertAIModel(data), data);
  }

  public deleteAIModel(id: string) {
    return this.request('DELETE', `/config/ai/model/${id}`, () => mockBackend.deleteAIModel(id));
  }

  public getAIRoleConfigs() {
    return this.request('GET', '/config/ai/roles', () => mockBackend.getAIRoleConfigs());
  }

  public getAIRoleConfigByRole(role: string) {
    return this.request('GET', `/config/ai/role/${role}`, () => mockBackend.getAIRoleConfigByRole(role));
  }

  public upsertAIRoleConfig(data: any) {
    return this.request('POST', '/config/ai/role', () => mockBackend.upsertAIRoleConfig(data), data);
  }

  public deleteAIRoleConfigByRole(role: string) {
    return this.request('DELETE', `/config/ai/role/${role}`, () => mockBackend.deleteAIRoleConfigByRole(role));
  }

  public getAIBundles(role?: string) {
    const endpoint = role ? `/config/ai/bundles/${role}` : '/config/ai/bundles';
    return this.request('GET', endpoint, () => mockBackend.getAIBundles(role));
  }

  public upsertAIBundle(data: any) {
    return this.request('POST', '/config/ai/bundle', () => mockBackend.upsertAIBundle(data), data);
  }

  public bulkUpsertRoleBundles(role: string, bundles: any[]) {
    return this.request('POST', `/config/ai/bundles/${role}`, () => mockBackend.bulkUpsertRoleBundles(role, bundles), { bundles });
  }

  public deleteAIBundle(id: string) {
    return this.request('DELETE', `/config/ai/bundle/${id}`, () => mockBackend.deleteAIBundle(id));
  }

  public resolveRoleBundle(role: string) {
    return this.request('GET', `/config/ai/resolve/${role}`, () => mockBackend.resolveRoleBundle(role));
  }

  public validateAIConfig() {
    return this.request('GET', '/config/ai/validate', () => mockBackend.validateAIConfig());
  }

  public seedAIDefaults(force = false) {
    return this.request('POST', '/config/ai/seed-defaults', () => {
      if (force) mockBackend.resetToSeed();
      return { ok: true, seeded: true };
    }, { force });
  }

  public testAIInvocation(data: { model_id: string; test_prompt: string }) {
    return this.request('POST', '/config/ai/test', () => mockBackend.testAIInvocation(data.model_id, data.test_prompt), data);
  }

  public verifyModel(modelId: string, prompt?: string) {
    return this.request('POST', '/config/ai/verify', () => mockBackend.verifyModel(modelId, prompt), { model_id: modelId, test_prompt: prompt });
  }

  public verifyStatus(sessionId: string) {
    return this.request('GET', `/config/ai/verify/${sessionId}`, () => mockBackend.verifyStatus(sessionId));
  }

  public getVerifyLog(sessionId: string) {
    // tackle-srv exposes no separate log route; the status endpoint is the
    // closest parity (returns the session object with exit_code etc.).
    return this.request('GET', `/config/ai/verify/${sessionId}`, () => mockBackend.getVerifyLog(sessionId));
  }

  // --- SESSIONS & SCHEDULER ---
  public getSessions() {
    return this.request('GET', '/sessions', () => mockBackend.getSessions());
  }

  public killSession(sessionId: string) {
    return this.request('POST', `/sessions/${sessionId}/kill`, () => mockBackend.killSession(sessionId));
  }

  public async getScheduler(): Promise<ScheduledAgent[]> {
    if (this.mode === 'LIVE') {
      const res = await this.request<any>('GET', '/scheduler', () => mockBackend.getScheduler());
      return res?.entries ?? [];
    }
    return this.request('GET', '/scheduler', () => mockBackend.getScheduler());
  }

  public async getDueScheduler(): Promise<ScheduledAgent[]> {
    if (this.mode === 'LIVE') {
      const res = await this.request<any>('GET', '/scheduler/due', () => mockBackend.getDueScheduler());
      return res?.entries ?? [];
    }
    return this.request('GET', '/scheduler/due', () => mockBackend.getDueScheduler());
  }

  public createScheduler(data: any) {
    return this.request('POST', '/scheduler', () => mockBackend.createScheduler(data), data);
  }

  public patchScheduler(id: string, data: any) {
    return this.request('PATCH', `/scheduler/${id}`, () => mockBackend.patchScheduler(id, data), data);
  }

  public deleteScheduler(id: string) {
    return this.request('DELETE', `/scheduler/${id}`, () => mockBackend.deleteScheduler(id));
  }

  // --- MEMORY & CHECKPOINTS ---
  public async getMemoryProcedures(role: string): Promise<RoleMemoryProcedure[]> {
    if (this.mode === 'LIVE') {
      const idx = await this.request<any>('GET', `/memory/procedures/${encodeURIComponent(role)}`, () => mockBackend.getMemoryProcedures(role));
      const list = idx?.procedures ?? [];
      // The index endpoint returns only {slug, summary, tags}; fetch each full
      // card so the UI's title/body_md/version rendering isn't silently empty.
      return Promise.all(list.map(async (p: any) => {
        try {
          const card = await this.request<any>('GET', `/memory/procedure/${encodeURIComponent(p.slug)}`, () => null);
          if (card && card.body_md) {
            return {
              id: card.slug,
              role,
              slug: card.slug,
              title: card.title || card.summary || p.slug,
              body_md: card.body_md || '',
              tags: card.tags || p.tags || [],
              version: card.version ?? 1,
              as_of_dt: card.as_of_dt || ''
            };
          }
        } catch {
          // fall through to summary-only entry
        }
        return {
          id: p.slug,
          role,
          slug: p.slug,
          title: p.summary || p.slug,
          body_md: '',
          tags: p.tags || [],
          version: 1,
          as_of_dt: ''
        };
      }));
    }
    return this.request('GET', `/memory/procedures/${role}`, () => mockBackend.getMemoryProcedures(role));
  }

  public getMemoryProcedureBySlug(slug: string) {
    return this.request('GET', `/memory/procedure/${slug}`, () => mockBackend.getMemoryProcedureBySlug(slug));
  }

  public checkMemorySince(role: string, since: string) {
    return this.request('POST', '/memory/check-since', () => mockBackend.checkMemorySince(role, since), { role, since });
  }

  public refreshMemory() {
    return this.request('POST', '/memory/refresh', () => mockBackend.refreshMemory());
  }

  public getRoleCheckpoints() {
    return this.request('GET', '/memory/role-updates', () => mockBackend.getRoleCheckpoints());
  }

  // --- PROMPTS, TASKS & TOOL ACCESS ---
  public async getPrompts(role: string): Promise<PromptTemplate[]> {
    if (this.mode === 'LIVE') {
      const res = await this.request<any>('GET', `/prompts/${encodeURIComponent(role)}`, () => mockBackend.getPrompts(role));
      return res?.prompts ?? [];
    }
    return this.request('GET', `/prompts/${role}`, () => mockBackend.getPrompts(role));
  }

  public getPromptBySlug(role: string, slug: string) {
    return this.request('GET', `/prompts/${encodeURIComponent(role)}/${encodeURIComponent(slug)}`, () => mockBackend.getPromptBySlug(role, slug));
  }

  public async getRoleTasks(role: string): Promise<RoleTaskAssignment[]> {
    if (this.mode === 'LIVE') {
      // tackle-srv serves /tasks/?role= (not /tasks/:role) and wraps in {count, tasks}
      const res = await this.request<any>('GET', `/tasks/?role=${encodeURIComponent(role)}`, () => mockBackend.getRoleTasks(role));
      const rows = res?.tasks ?? [];
      return rows.map((t: any) => ({
        id: t.id,
        role: t.role,
        prompt_id: t.prompt_id,
        prompt_slug: t.prompt_slug,
        task_name: t.task_slug || t.task_name,
        description: t.scope || t.description,
        active: t.active !== false,
        created_at: t.created_at
      }));
    }
    return this.request('GET', `/tasks/${role}`, () => mockBackend.getRoleTasks(role));
  }

  public async getRoleToolAccess(role?: string): Promise<RoleToolAccess[]> {
    if (this.mode === 'LIVE') {
      const endpoint = role ? `/config/ai/tool-access/${encodeURIComponent(role)}` : '/config/ai/tool-access';
      const res = await this.request<any>('GET', endpoint, () => mockBackend.getRoleToolAccess(role));
      const rows = res?.access ?? [];
      // Live rows are the allowlist (presence = allowed); map to the UI shape.
      return rows.map((r: any) => ({
        id: r.id,
        role: r.role,
        tool_name: r.tool_slug || r.tool_name,
        allowed: true,
        restriction_rules: r.restriction_rules,
        updated_at: r.updated_at || r.created_at
      }));
    }
    const endpoint = role ? `/config/ai/tool-access/${role}` : '/config/ai/tool-access';
    return this.request('GET', endpoint, () => mockBackend.getRoleToolAccess(role));
  }

  public updateRoleToolAccess(id: string, data: any) {
    return this.request('PATCH', `/config/ai/tool-access/${id}`, () => mockBackend.updateRoleToolAccess(id, data), data);
  }

  // --- CIRCUIT BREAKER ---
  public getCircuitBreaker() {
    return this.request('GET', '/config/failure-recovery', () => mockBackend.getCircuitBreaker());
  }

  public saveCircuitBreaker(data: any) {
    return this.request('POST', '/config/failure-recovery', () => mockBackend.saveCircuitBreaker(data), data);
  }

  // --- INSTANCE HARNESS EXECUTION & AUTOMATED LOOP ---
  public executeInstanceTicket(id: string) {
    return this.request('POST', `/api/instances/${id}/execute`, () => mockBackend.executeInstanceTicket(id), {});
  }

  public runInstanceWorkflow(id: string) {
    return this.request('POST', `/api/instances/${id}/run`, () => mockBackend.runInstanceWorkflow(id), {});
  }

  // --- EVENT PIPELINE & EVENT TYPES ---
  public getEvents() {
    return this.request('GET', '/api/events', () => mockBackend.getEvents());
  }

  public getEventById(id: string) {
    return this.request('GET', `/api/events/${id}`, () => mockBackend.getEventById(id));
  }

  public createEvent(data: any) {
    return this.request('POST', '/api/events', () => mockBackend.createEvent(data), data);
  }

  public pollEvents(limit: number = 10) {
    return this.request('POST', '/api/events/poll', () => mockBackend.pollUnconsumedEvents(limit), { limit });
  }

  public getEventTypes() {
    return this.request('GET', '/api/event-types', () => mockBackend.getEventTypes());
  }

  public getEventType(eventType: string) {
    return this.request('GET', `/api/event-types/${eventType}`, () => mockBackend.getEventTypeByName(eventType));
  }

  public createEventType(data: any) {
    return this.request('POST', '/api/event-types', () => mockBackend.createEventType(data), data);
  }

  public deleteEventType(eventType: string) {
    return this.request('DELETE', `/api/event-types/${eventType}`, () => mockBackend.deleteEventType(eventType));
  }

  public resetMockData() {
    mockBackend.resetToSeed();
    this.logCall('POST', '/api/admin/reset-mock-seed', 200, 10, {}, { ok: true, message: "Reset to seed data" });
  }
}

export const api = new ApiService();
