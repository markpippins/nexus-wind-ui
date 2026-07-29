import { mockBackend } from './mockBackend';
import { ApiLog } from '../types/wind';

export type ApiMode = 'MOCK' | 'LIVE';

class ApiService {
  private mode: ApiMode = 'MOCK';
  private baseUrl: string = 'http://localhost:3300';
  private logs: ApiLog[] = [];
  private listeners: ((logs: ApiLog[]) => void)[] = [];

  constructor() {
    const savedMode = localStorage.getItem('wind_api_mode');
    if (savedMode === 'LIVE' || savedMode === 'MOCK') {
      this.mode = savedMode;
    }
    const savedUrl = localStorage.getItem('wind_api_base_url');
    if (savedUrl) {
      this.baseUrl = savedUrl;
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
    const fullUrl = `${this.baseUrl}${endpoint}`;
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
        const fullUrl = `${this.baseUrl}${endpoint}`;
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
  public getTasks(officeId?: string) {
    const url = officeId ? `/api/tasks?office_id=${officeId}` : '/api/tasks';
    return this.request('GET', url, () => mockBackend.getTasks(officeId));
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
  public getOutcomes(taskId?: string) {
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
  public getWorkflows() {
    return this.request('GET', '/api/workflows', () => mockBackend.getWorkflows());
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
  public getVersions(workflowId?: string) {
    const url = workflowId ? `/api/versions?workflow_id=${workflowId}` : '/api/versions';
    return this.request('GET', url, () => mockBackend.getVersions(workflowId));
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

  // --- SESSIONS & SCHEDULER ---
  public getSessions() {
    return this.request('GET', '/sessions', () => mockBackend.getSessions());
  }

  public killSession(sessionId: string) {
    return this.request('POST', `/sessions/${sessionId}/kill`, () => mockBackend.killSession(sessionId));
  }

  public getScheduler() {
    return this.request('GET', '/scheduler', () => mockBackend.getScheduler());
  }

  public getDueScheduler() {
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
  public getMemoryProcedures(role: string) {
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
    return this.request('GET', '/api/mcp/memory/role-updates', () => mockBackend.getRoleCheckpoints());
  }

  // --- PROMPTS, TASKS & TOOL ACCESS ---
  public getPrompts(role: string) {
    return this.request('GET', `/prompts/${role}`, () => mockBackend.getPrompts(role));
  }

  public getPromptBySlug(role: string, slug: string) {
    return this.request('GET', `/prompt/${role}/${slug}`, () => mockBackend.getPromptBySlug(role, slug));
  }

  public getRoleTasks(role: string) {
    return this.request('GET', `/tasks/${role}`, () => mockBackend.getRoleTasks(role));
  }

  public getRoleToolAccess(role?: string) {
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
