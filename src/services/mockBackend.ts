import {
  Office, Title, Task, Outcome, Workflow, WorkflowVersion, WorkflowNode,
  WorkflowEdge, Instance, Ticket, Receipt, Role, GraphValidationResult, StructuralValidationResult
} from '../types/wind';
import {
  AIProvider, AIHarness, AIModel, AIRoleConfig, AIConfigBundle,
  AgentSession, SessionKillResult, ScheduledAgent, RoleMemoryProcedure,
  RoleCheckpoint, PromptTemplate, RoleTaskAssignment, RoleToolAccess,
  CircuitBreakerConfig, AIConfigValidation, TestInvocationResult
} from '../types/tackle';
import {
  INITIAL_OFFICES, INITIAL_TITLES, INITIAL_TASKS, INITIAL_OUTCOMES,
  INITIAL_WORKFLOWS, INITIAL_VERSIONS, INITIAL_NODES, INITIAL_EDGES,
  INITIAL_INSTANCES, INITIAL_TICKETS, INITIAL_RECEIPTS, INITIAL_ROLES
} from './mockData';
import {
  INITIAL_AI_PROVIDERS, INITIAL_AI_HARNESSES, INITIAL_AI_MODELS,
  INITIAL_AI_CONFIG_BUNDLES, INITIAL_AI_ROLE_CONFIGS, INITIAL_AGENT_SESSIONS,
  INITIAL_SCHEDULED_AGENTS, INITIAL_ROLE_MEMORIES, INITIAL_CHECKPOINTS,
  INITIAL_PROMPTS, INITIAL_ROLE_TASKS, INITIAL_ROLE_TOOL_ACCESS, INITIAL_CIRCUIT_BREAKER
} from './tackleMockData';

const STORAGE_KEY_PREFIX = 'wind_srv_mock_';

function loadStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading storage for ${key}`, e);
  }
  return defaultValue;
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving storage for ${key}`, e);
  }
}

class MockBackendEngine {
  private roles: Role[];
  private offices: Office[];
  private titles: Title[];
  private tasks: Task[];
  private outcomes: Outcome[];
  private workflows: Workflow[];
  private versions: WorkflowVersion[];
  private nodes: WorkflowNode[];
  private edges: WorkflowEdge[];
  private instances: Instance[];
  private tickets: Ticket[];
  private receipts: Receipt[];

  // Tackle AI State
  private providers: AIProvider[];
  private harnesses: AIHarness[];
  private models: AIModel[];
  private roleConfigs: AIRoleConfig[];
  private bundles: AIConfigBundle[];
  private agentSessions: AgentSession[];
  private scheduledAgents: ScheduledAgent[];
  private roleMemories: RoleMemoryProcedure[];
  private checkpoints: Record<string, RoleCheckpoint>;
  private prompts: PromptTemplate[];
  private roleTasks: RoleTaskAssignment[];
  private roleToolAccess: RoleToolAccess[];
  private circuitBreaker: CircuitBreakerConfig;

  constructor() {
    this.roles = loadStorage('roles', INITIAL_ROLES);
    this.offices = loadStorage('offices', INITIAL_OFFICES);
    this.titles = loadStorage('titles', INITIAL_TITLES);
    this.tasks = loadStorage('tasks', INITIAL_TASKS);
    this.outcomes = loadStorage('outcomes', INITIAL_OUTCOMES);
    this.workflows = loadStorage('workflows', INITIAL_WORKFLOWS);
    this.versions = loadStorage('versions', INITIAL_VERSIONS);
    this.nodes = loadStorage('nodes', INITIAL_NODES);
    this.edges = loadStorage('edges', INITIAL_EDGES);
    this.instances = loadStorage('instances', INITIAL_INSTANCES);
    this.tickets = loadStorage('tickets', INITIAL_TICKETS);
    this.receipts = loadStorage('receipts', INITIAL_RECEIPTS);

    // Tackle AI
    this.providers = loadStorage('tackle_providers', INITIAL_AI_PROVIDERS);
    this.harnesses = loadStorage('tackle_harnesses', INITIAL_AI_HARNESSES);
    this.models = loadStorage('tackle_models', INITIAL_AI_MODELS);
    this.roleConfigs = loadStorage('tackle_roleConfigs', INITIAL_AI_ROLE_CONFIGS);
    this.bundles = loadStorage('tackle_bundles', INITIAL_AI_CONFIG_BUNDLES);
    this.agentSessions = loadStorage('tackle_agentSessions', INITIAL_AGENT_SESSIONS);
    this.scheduledAgents = loadStorage('tackle_scheduledAgents', INITIAL_SCHEDULED_AGENTS);
    this.roleMemories = loadStorage('tackle_roleMemories', INITIAL_ROLE_MEMORIES);
    this.checkpoints = loadStorage('tackle_checkpoints', INITIAL_CHECKPOINTS);
    this.prompts = loadStorage('tackle_prompts', INITIAL_PROMPTS);
    this.roleTasks = loadStorage('tackle_roleTasks', INITIAL_ROLE_TASKS);
    this.roleToolAccess = loadStorage('tackle_roleToolAccess', INITIAL_ROLE_TOOL_ACCESS);
    this.circuitBreaker = loadStorage('tackle_circuitBreaker', INITIAL_CIRCUIT_BREAKER);
  }

  public resetToSeed(): void {
    this.roles = [...INITIAL_ROLES];
    this.offices = [...INITIAL_OFFICES];
    this.titles = [...INITIAL_TITLES];
    this.tasks = [...INITIAL_TASKS];
    this.outcomes = [...INITIAL_OUTCOMES];
    this.workflows = [...INITIAL_WORKFLOWS];
    this.versions = [...INITIAL_VERSIONS];
    this.nodes = [...INITIAL_NODES];
    this.edges = [...INITIAL_EDGES];
    this.instances = [...INITIAL_INSTANCES];
    this.tickets = [...INITIAL_TICKETS];
    this.receipts = [...INITIAL_RECEIPTS];

    this.providers = [...INITIAL_AI_PROVIDERS];
    this.harnesses = [...INITIAL_AI_HARNESSES];
    this.models = [...INITIAL_AI_MODELS];
    this.roleConfigs = [...INITIAL_AI_ROLE_CONFIGS];
    this.bundles = [...INITIAL_AI_CONFIG_BUNDLES];
    this.agentSessions = [...INITIAL_AGENT_SESSIONS];
    this.scheduledAgents = [...INITIAL_SCHEDULED_AGENTS];
    this.roleMemories = [...INITIAL_ROLE_MEMORIES];
    this.checkpoints = { ...INITIAL_CHECKPOINTS };
    this.prompts = [...INITIAL_PROMPTS];
    this.roleTasks = [...INITIAL_ROLE_TASKS];
    this.roleToolAccess = [...INITIAL_ROLE_TOOL_ACCESS];
    this.circuitBreaker = { ...INITIAL_CIRCUIT_BREAKER };

    this.persistAll();
  }

  private persistAll(): void {
    saveStorage('roles', this.roles);
    saveStorage('offices', this.offices);
    saveStorage('titles', this.titles);
    saveStorage('tasks', this.tasks);
    saveStorage('outcomes', this.outcomes);
    saveStorage('workflows', this.workflows);
    saveStorage('versions', this.versions);
    saveStorage('nodes', this.nodes);
    saveStorage('edges', this.edges);
    saveStorage('instances', this.instances);
    saveStorage('tickets', this.tickets);
    saveStorage('receipts', this.receipts);

    saveStorage('tackle_providers', this.providers);
    saveStorage('tackle_harnesses', this.harnesses);
    saveStorage('tackle_models', this.models);
    saveStorage('tackle_roleConfigs', this.roleConfigs);
    saveStorage('tackle_bundles', this.bundles);
    saveStorage('tackle_agentSessions', this.agentSessions);
    saveStorage('tackle_scheduledAgents', this.scheduledAgents);
    saveStorage('tackle_roleMemories', this.roleMemories);
    saveStorage('tackle_checkpoints', this.checkpoints);
    saveStorage('tackle_prompts', this.prompts);
    saveStorage('tackle_roleTasks', this.roleTasks);
    saveStorage('tackle_roleToolAccess', this.roleToolAccess);
    saveStorage('tackle_circuitBreaker', this.circuitBreaker);
  }

  // --- Health ---
  public getHealth() {
    return { ok: true, schema: "wind" };
  }

  // --- Roles ---
  public getVRoles() {
    return [...this.roles];
  }

  public getVRoleByName(name: string) {
    return this.roles.find(r => r.name.toLowerCase() === name.toLowerCase()) || null;
  }

  // --- Offices ---
  public getOffices(): Office[] {
    return [...this.offices];
  }

  public getOfficeById(id: string): Office | null {
    return this.offices.find(o => o.id === id) || null;
  }

  public createOffice(data: { name: string; description?: string }): Office {
    const newOffice: Office = {
      id: `off-${Date.now().toString(36)}`,
      name: data.name,
      description: data.description,
      created_at: new Date().toISOString()
    };
    this.offices.push(newOffice);
    this.persistAll();
    return newOffice;
  }

  public updateOffice(id: string, data: Partial<Office>): Office | null {
    const idx = this.offices.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.offices[idx] = { ...this.offices[idx], ...data };
    this.persistAll();
    return this.offices[idx];
  }

  public deleteOffice(id: string): boolean {
    const idx = this.offices.findIndex(o => o.id === id);
    if (idx === -1) return false;
    this.offices.splice(idx, 1);
    
    // Cascade delete titles, tasks, outcomes
    const titlesToDelete = this.titles.filter(t => t.office_id === id);
    this.titles = this.titles.filter(t => t.office_id !== id);

    const tasksToDelete = this.tasks.filter(t => t.office_id === id);
    this.tasks = this.tasks.filter(t => t.office_id !== id);

    const taskIds = tasksToDelete.map(t => t.id);
    this.outcomes = this.outcomes.filter(o => !taskIds.includes(o.task_id));

    this.persistAll();
    return true;
  }

  // --- Titles ---
  public getTitles(officeId?: string): Title[] {
    let result = this.titles.map(t => {
      const office = this.offices.find(o => o.id === t.office_id);
      const role = this.roles.find(r => r.id === t.role_id);
      return {
        ...t,
        office_name: office ? office.name : 'Unknown Office',
        role_name: role ? role.name : 'Unknown Role'
      };
    });
    if (officeId) {
      result = result.filter(t => t.office_id === officeId);
    }
    return result;
  }

  public getTitleById(id: string): Title | null {
    const t = this.titles.find(x => x.id === id);
    if (!t) return null;
    const office = this.offices.find(o => o.id === t.office_id);
    const role = this.roles.find(r => r.id === t.role_id);
    return {
      ...t,
      office_name: office ? office.name : undefined,
      role_name: role ? role.name : undefined
    };
  }

  public createTitle(data: { office_id: string; role_id: string; display_name: string }): Title {
    const newTitle: Title = {
      id: `title-${Date.now().toString(36)}`,
      office_id: data.office_id,
      role_id: data.role_id,
      display_name: data.display_name,
      created_at: new Date().toISOString()
    };
    this.titles.push(newTitle);
    this.persistAll();
    return this.getTitleById(newTitle.id)!;
  }

  public updateTitle(id: string, data: Partial<Title>): Title | null {
    const idx = this.titles.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.titles[idx] = { ...this.titles[idx], ...data };
    this.persistAll();
    return this.getTitleById(id);
  }

  public deleteTitle(id: string): boolean {
    const idx = this.titles.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.titles.splice(idx, 1);
    this.persistAll();
    return true;
  }

  // --- Tasks ---
  public getTasks(officeId?: string): Task[] {
    let list = this.tasks.map(tsk => {
      const off = this.offices.find(o => o.id === tsk.office_id);
      const ttl = this.titles.find(t => t.id === tsk.title_id);
      const outcomes = this.outcomes.filter(o => o.task_id === tsk.id);
      return {
        ...tsk,
        office_name: off?.name,
        title_name: ttl?.display_name,
        outcomes
      };
    });
    if (officeId) {
      list = list.filter(t => t.office_id === officeId);
    }
    return list;
  }

  public getTaskById(id: string): Task | null {
    const tsk = this.tasks.find(t => t.id === id);
    if (!tsk) return null;
    const off = this.offices.find(o => o.id === tsk.office_id);
    const ttl = this.titles.find(t => t.id === tsk.title_id);
    const outcomes = this.outcomes.filter(o => o.task_id === tsk.id);
    return {
      ...tsk,
      office_name: off?.name,
      title_name: ttl?.display_name,
      outcomes
    };
  }

  public createTask(data: { office_id: string; title_id: string; name: string; description?: string; input_spec?: Record<string, any> }): Task {
    const newTask: Task = {
      id: `task-${Date.now().toString(36)}`,
      office_id: data.office_id,
      title_id: data.title_id,
      name: data.name,
      description: data.description || '',
      input_spec: data.input_spec || {},
      created_at: new Date().toISOString()
    };
    this.tasks.push(newTask);
    this.persistAll();
    return this.getTaskById(newTask.id)!;
  }

  public updateTask(id: string, data: Partial<Task>): Task | null {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx] = { ...this.tasks[idx], ...data };
    this.persistAll();
    return this.getTaskById(id);
  }

  public deleteTask(id: string): boolean {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.tasks.splice(idx, 1);
    this.outcomes = this.outcomes.filter(o => o.task_id !== id);
    this.persistAll();
    return true;
  }

  // --- Outcomes ---
  public getOutcomes(taskId?: string): Outcome[] {
    if (taskId) {
      return this.outcomes.filter(o => o.task_id === taskId);
    }
    return [...this.outcomes];
  }

  public getOutcomeById(id: string): Outcome | null {
    return this.outcomes.find(o => o.id === id) || null;
  }

  public createOutcome(data: { task_id: string; code: string; description?: string; output_spec?: Record<string, any> }): Outcome {
    const newOutcome: Outcome = {
      id: `out-${Date.now().toString(36)}`,
      task_id: data.task_id,
      code: data.code,
      description: data.description || '',
      output_spec: data.output_spec || {},
      created_at: new Date().toISOString()
    };
    this.outcomes.push(newOutcome);
    this.persistAll();
    return newOutcome;
  }

  public deleteOutcome(id: string): boolean {
    const idx = this.outcomes.findIndex(o => o.id === id);
    if (idx === -1) return false;
    this.outcomes.splice(idx, 1);
    this.persistAll();
    return true;
  }

  // --- Workflows ---
  public getWorkflows(): Workflow[] {
    return this.workflows.map(wf => {
      const versions = this.versions.filter(v => v.workflow_id === wf.id);
      const activeVer = versions.find(v => v.is_active);
      return {
        ...wf,
        version_count: versions.length,
        active_version_id: activeVer?.id,
        active_version_number: activeVer?.version_number
      };
    });
  }

  public getWorkflowById(id: string): Workflow | null {
    const wf = this.workflows.find(w => w.id === id);
    if (!wf) return null;
    const versions = this.getVersions(id);
    const activeVer = versions.find(v => v.is_active);
    return {
      ...wf,
      version_count: versions.length,
      active_version_id: activeVer?.id,
      active_version_number: activeVer?.version_number,
      versions
    };
  }

  public createWorkflow(data: { name: string; description?: string }): Workflow {
    const newWf: Workflow = {
      id: `wf-${Date.now().toString(36)}`,
      name: data.name,
      description: data.description || '',
      version_count: 0,
      created_at: new Date().toISOString()
    };
    this.workflows.push(newWf);
    
    // Auto create Version 1
    this.createVersion({ workflow_id: newWf.id });
    
    this.persistAll();
    return this.getWorkflowById(newWf.id)!;
  }

  public updateWorkflow(id: string, data: Partial<Workflow>): Workflow | null {
    const idx = this.workflows.findIndex(w => w.id === id);
    if (idx === -1) return null;
    this.workflows[idx] = { ...this.workflows[idx], ...data };
    this.persistAll();
    return this.getWorkflowById(id);
  }

  public deleteWorkflow(id: string): boolean {
    const idx = this.workflows.findIndex(w => w.id === id);
    if (idx === -1) return false;
    this.workflows.splice(idx, 1);

    const versionIds = this.versions.filter(v => v.workflow_id === id).map(v => v.id);
    this.versions = this.versions.filter(v => v.workflow_id !== id);
    this.nodes = this.nodes.filter(n => !versionIds.includes(n.workflow_version_id));
    this.edges = this.edges.filter(e => !versionIds.includes(e.workflow_version_id));

    this.persistAll();
    return true;
  }

  // --- Versions ---
  public getVersions(workflowId?: string): WorkflowVersion[] {
    let list = this.versions.map(v => {
      const nodes = this.getNodes(v.id);
      const edges = this.getEdges(v.id);
      return { ...v, nodes, edges };
    });
    if (workflowId) {
      list = list.filter(v => v.workflow_id === workflowId);
    }
    return list;
  }

  public getVersionById(id: string): WorkflowVersion | null {
    const v = this.versions.find(x => x.id === id);
    if (!v) return null;
    const nodes = this.getNodes(v.id);
    const edges = this.getEdges(v.id);
    return { ...v, nodes, edges };
  }

  public createVersion(data: { workflow_id: string }): WorkflowVersion {
    const existing = this.versions.filter(v => v.workflow_id === data.workflow_id);
    const nextNumber = existing.length > 0 ? Math.max(...existing.map(e => e.version_number)) + 1 : 1;

    const newVersion: WorkflowVersion = {
      id: `ver-${Date.now().toString(36)}`,
      workflow_id: data.workflow_id,
      version_number: nextNumber,
      is_active: existing.length === 0, // auto activate first version
      created_at: new Date().toISOString()
    };
    this.versions.push(newVersion);
    this.persistAll();
    return this.getVersionById(newVersion.id)!;
  }

  public activateVersion(id: string): WorkflowVersion | null {
    const ver = this.versions.find(v => v.id === id);
    if (!ver) return null;

    // Deactivate all other versions for this workflow
    this.versions.forEach(v => {
      if (v.workflow_id === ver.workflow_id) {
        v.is_active = (v.id === id);
      }
    });

    this.persistAll();
    return this.getVersionById(id);
  }

  public deleteVersion(id: string): boolean {
    const idx = this.versions.findIndex(v => v.id === id);
    if (idx === -1) return false;
    this.versions.splice(idx, 1);
    this.nodes = this.nodes.filter(n => n.workflow_version_id !== id);
    this.edges = this.edges.filter(e => e.workflow_version_id !== id);
    this.persistAll();
    return true;
  }

  // --- Nodes ---
  public getNodes(versionId?: string): WorkflowNode[] {
    let list = this.nodes.map(n => {
      const task = this.getTaskById(n.task_id);
      return {
        ...n,
        task_name: task?.name || 'Unknown Task',
        task_input_spec: task?.input_spec || {}
      };
    });
    if (versionId) {
      list = list.filter(n => n.workflow_version_id === versionId);
    }
    return list;
  }

  public getNodeById(id: string): WorkflowNode | null {
    const n = this.nodes.find(x => x.id === id);
    if (!n) return null;
    const task = this.getTaskById(n.task_id);
    return {
      ...n,
      task_name: task?.name || 'Unknown Task',
      task_input_spec: task?.input_spec || {}
    };
  }

  public createNode(data: { workflow_version_id: string; task_id: string; name: string; is_entrypoint?: boolean; is_terminal?: boolean; x?: number; y?: number }): WorkflowNode {
    const newNode: WorkflowNode = {
      id: `node-${Date.now().toString(36)}`,
      workflow_version_id: data.workflow_version_id,
      task_id: data.task_id,
      name: data.name,
      is_entrypoint: !!data.is_entrypoint,
      is_terminal: !!data.is_terminal,
      x: data.x || 200,
      y: data.y || 200
    };
    this.nodes.push(newNode);
    this.persistAll();
    return this.getNodeById(newNode.id)!;
  }

  public updateNode(id: string, data: Partial<WorkflowNode>): WorkflowNode | null {
    const idx = this.nodes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    this.nodes[idx] = { ...this.nodes[idx], ...data };
    this.persistAll();
    return this.getNodeById(id);
  }

  public deleteNode(id: string): boolean {
    const idx = this.nodes.findIndex(n => n.id === id);
    if (idx === -1) return false;
    this.nodes.splice(idx, 1);
    this.edges = this.edges.filter(e => e.from_node_id !== id && e.to_node_id !== id);
    this.persistAll();
    return true;
  }

  // --- Edges ---
  public getEdges(versionId?: string): WorkflowEdge[] {
    let list = this.edges.map(e => {
      const fromNode = this.nodes.find(n => n.id === e.from_node_id);
      const toNode = this.nodes.find(n => n.id === e.to_node_id);
      const outcome = this.outcomes.find(o => o.id === e.outcome_id);
      return {
        ...e,
        from_node_name: fromNode?.name || 'Unknown Node',
        to_node_name: toNode?.name || 'Unknown Node',
        outcome_code: outcome?.code || 'Unknown Code'
      };
    });
    if (versionId) {
      list = list.filter(e => e.workflow_version_id === versionId);
    }
    return list;
  }

  public createEdge(data: { workflow_version_id: string; from_node_id: string; from_task_id: string; outcome_id: string; to_node_id: string }): WorkflowEdge {
    const newEdge: WorkflowEdge = {
      id: `edge-${Date.now().toString(36)}`,
      workflow_version_id: data.workflow_version_id,
      from_node_id: data.from_node_id,
      from_task_id: data.from_task_id,
      outcome_id: data.outcome_id,
      to_node_id: data.to_node_id
    };
    this.edges.push(newEdge);
    this.persistAll();
    const created = this.getEdges(data.workflow_version_id).find(e => e.id === newEdge.id);
    return created || newEdge;
  }

  public deleteEdge(id: string): boolean {
    const idx = this.edges.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.edges.splice(idx, 1);
    this.persistAll();
    return true;
  }

  // --- Runtime Instances & Core Traversal Advance ---
  public getInstances(status?: string, workflowId?: string): Instance[] {
    let list = this.instances.map(inst => {
      const ver = this.versions.find(v => v.id === inst.workflow_version_id);
      const wf = ver ? this.workflows.find(w => w.id === ver.workflow_id) : null;
      const tickets = this.getTickets(inst.id);
      const receipts = this.getReceipts(undefined, inst.id);
      return {
        ...inst,
        workflow_name: wf?.name || 'Workflow Runtime',
        version_number: ver?.version_number || 1,
        tickets,
        receipts
      };
    });

    if (status) {
      list = list.filter(i => i.status === status);
    }
    if (workflowId) {
      list = list.filter(i => {
        const ver = this.versions.find(v => v.id === i.workflow_version_id);
        return ver?.workflow_id === workflowId;
      });
    }

    return list;
  }

  public getInstanceById(id: string): Instance | null {
    const list = this.getInstances();
    return list.find(i => i.id === id) || null;
  }

  public startInstance(data: { workflow_version_id: string }): Instance {
    const ver = this.versions.find(v => v.id === data.workflow_version_id);
    if (!ver) {
      throw new Error(`Workflow version ${data.workflow_version_id} not found`);
    }

    const wf = this.workflows.find(w => w.id === ver.workflow_id);
    const newInstance: Instance = {
      id: `inst-${Date.now().toString(36)}`,
      workflow_version_id: data.workflow_version_id,
      status: 'ACTIVE',
      workflow_name: wf?.name,
      version_number: ver.version_number,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.instances.push(newInstance);

    // Find entrypoint nodes for this version
    const versionNodes = this.getNodes(data.workflow_version_id);
    const entryNodes = versionNodes.filter(n => n.is_entrypoint);

    if (entryNodes.length === 0 && versionNodes.length > 0) {
      // Fallback if no entrypoint flag is marked
      entryNodes.push(versionNodes[0]);
    }

    // Create tickets for each entrypoint node
    entryNodes.forEach(node => {
      this.createTicketForNode(newInstance.id, data.workflow_version_id, node);
    });

    this.persistAll();
    return this.getInstanceById(newInstance.id)!;
  }

  private createTicketForNode(instanceId: string, versionId: string, node: WorkflowNode): Ticket {
    const task = this.getTaskById(node.task_id);
    const ver = this.versions.find(v => v.id === versionId);
    const wf = ver ? this.workflows.find(w => w.id === ver.workflow_id) : null;

    const newTicket: Ticket = {
      id: `tkt-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      instance_id: instanceId,
      workflow_version_id: versionId,
      node_id: node.id,
      task_id: node.task_id,
      title_id: task?.title_id || 'title-1',
      status: 'PENDING',
      node_name: node.name,
      task_name: task?.name,
      title_name: task?.title_name,
      workflow_name: wf?.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.tickets.push(newTicket);
    return newTicket;
  }

  public pauseInstance(id: string): Instance | null {
    const idx = this.instances.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.instances[idx].status = 'PAUSED';
    this.instances[idx].updated_at = new Date().toISOString();
    this.persistAll();
    return this.getInstanceById(id);
  }

  public resumeInstance(id: string): Instance | null {
    const idx = this.instances.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.instances[idx].status = 'ACTIVE';
    this.instances[idx].updated_at = new Date().toISOString();
    this.persistAll();
    return this.getInstanceById(id);
  }

  public stopInstance(id: string): Instance | null {
    const idx = this.instances.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.instances[idx].status = 'FAILED';
    this.instances[idx].updated_at = new Date().toISOString();

    // Cancel all PENDING or IN_PROGRESS tickets
    this.tickets.forEach(t => {
      if (t.instance_id === id && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')) {
        t.status = 'CANCELLED';
        t.updated_at = new Date().toISOString();
      }
    });

    this.persistAll();
    return this.getInstanceById(id);
  }

  /**
   * CORE ADVANCE TRAVERSAL ALGORITHM
   * Advance the workflow by completing a ticket with an outcome.
   * 1. Validate ticket belongs to instance and is completable
   * 2. Validate outcome belongs to ticket's task
   * 3. Mark ticket COMPLETED
   * 4. Create receipt
   * 5. Find outgoing edges for node + outcome
   * 6. Create tickets for downstream nodes
   * 7. If no downstream edges and node is terminal, check if instance COMPLETED
   */
  public advanceInstance(instanceId: string, ticketId: string, outcomeId: string): { instance: Instance; receipt: Receipt; new_tickets: Ticket[] } {
    const inst = this.instances.find(i => i.id === instanceId);
    if (!inst) {
      throw new Error(`Instance ${instanceId} not found`);
    }
    if (inst.status !== 'ACTIVE') {
      throw new Error(`Instance is ${inst.status}, must be ACTIVE to advance`);
    }

    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found`);
    }
    if (ticket.instance_id !== instanceId) {
      throw new Error(`Ticket ${ticketId} does not belong to instance ${instanceId}`);
    }
    if (ticket.status !== 'PENDING' && ticket.status !== 'IN_PROGRESS') {
      throw new Error(`Ticket is ${ticket.status}, cannot be advanced`);
    }

    const outcome = this.outcomes.find(o => o.id === outcomeId);
    if (!outcome) {
      throw new Error(`Outcome ${outcomeId} not found`);
    }
    if (outcome.task_id !== ticket.task_id) {
      throw new Error(`Outcome ${outcome.code} does not belong to task ${ticket.task_id}`);
    }

    const node = this.getNodeById(ticket.node_id);
    const task = this.getTaskById(ticket.task_id);

    // 3. Mark ticket COMPLETED
    ticket.status = 'COMPLETED';
    ticket.updated_at = new Date().toISOString();

    // 4. Create receipt
    const newReceipt: Receipt = {
      id: `rcpt-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      ticket_id: ticketId,
      instance_id: instanceId,
      outcome_id: outcomeId,
      outcome_code: outcome.code,
      task_name: task?.name || 'Task Execution',
      node_name: node?.name,
      output_data: outcome.output_spec || { timestamp: new Date().toISOString(), status: 'SUCCESS' },
      created_at: new Date().toISOString()
    };
    this.receipts.push(newReceipt);

    // 5. Find outgoing edges for (node_id, outcome_id)
    const versionEdges = this.getEdges(inst.workflow_version_id);
    const matchingEdges = versionEdges.filter(e => e.from_node_id === ticket.node_id && e.outcome_id === outcomeId);

    const newTickets: Ticket[] = [];

    // 6. Create tickets for downstream nodes
    matchingEdges.forEach(edge => {
      const targetNode = this.getNodeById(edge.to_node_id);
      if (targetNode) {
        const createdTkt = this.createTicketForNode(instanceId, inst.workflow_version_id, targetNode);
        newTickets.push(createdTkt);
      }
    });

    // 7. Terminal or completion check
    const activeOrPendingTickets = this.tickets.filter(
      t => t.instance_id === instanceId && (t.status === 'PENDING' || t.status === 'IN_PROGRESS')
    );

    if (activeOrPendingTickets.length === 0) {
      // No remaining active tickets -> mark instance COMPLETED
      inst.status = 'COMPLETED';
    }

    inst.updated_at = new Date().toISOString();
    this.persistAll();

    return {
      instance: this.getInstanceById(instanceId)!,
      receipt: newReceipt,
      new_tickets: newTickets
    };
  }

  // --- Tickets ---
  public getTickets(instanceId?: string, status?: string, titleId?: string): Ticket[] {
    let list = this.tickets.map(t => {
      const node = this.nodes.find(n => n.id === t.node_id);
      const task = this.tasks.find(tsk => tsk.id === t.task_id);
      const title = this.titles.find(ttl => ttl.id === t.title_id);
      const ver = this.versions.find(v => v.id === t.workflow_version_id);
      const wf = ver ? this.workflows.find(w => w.id === ver.workflow_id) : null;
      return {
        ...t,
        node_name: node?.name,
        task_name: task?.name,
        title_name: title?.display_name,
        workflow_name: wf?.name
      };
    });

    if (instanceId) list = list.filter(t => t.instance_id === instanceId);
    if (status) list = list.filter(t => t.status === status);
    if (titleId) list = list.filter(t => t.title_id === titleId);

    return list;
  }

  public getTicketById(id: string): Ticket | null {
    const list = this.getTickets();
    return list.find(t => t.id === id) || null;
  }

  public updateTicketStatus(id: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'): Ticket | null {
    const t = this.tickets.find(x => x.id === id);
    if (!t) return null;
    t.status = status;
    t.updated_at = new Date().toISOString();
    this.persistAll();
    return this.getTicketById(id);
  }

  public cancelTicket(id: string): Ticket | null {
    return this.updateTicketStatus(id, 'CANCELLED');
  }

  // --- Receipts ---
  public getReceipts(ticketId?: string, instanceId?: string): Receipt[] {
    let list = [...this.receipts];
    if (ticketId) list = list.filter(r => r.ticket_id === ticketId);
    if (instanceId) list = list.filter(r => r.instance_id === instanceId);
    return list;
  }

  public getReceiptById(id: string): Receipt | null {
    return this.receipts.find(r => r.id === id) || null;
  }

  // --- Validation Engine ---
  public validateGraph(versionId: string): GraphValidationResult {
    const nodes = this.getNodes(versionId);
    const edges = this.getEdges(versionId);
    const issues: GraphValidationResult['issues'] = [];

    nodes.forEach(node => {
      const task = this.getTaskById(node.task_id);
      const outcomes = task?.outcomes || [];
      const nodeEdges = edges.filter(e => e.from_node_id === node.id);

      // Check if non-terminal node has unhandled outcomes
      if (!node.is_terminal && outcomes.length > 0) {
        outcomes.forEach(out => {
          const isHandled = nodeEdges.some(e => e.outcome_id === out.id);
          if (!isHandled) {
            issues.push({
              type: 'unhandled_outcome',
              severity: 'warning',
              node_id: node.id,
              outcome_id: out.id,
              message: `Node "${node.name}" does not handle outcome code "${out.code}" from task "${task?.name}".`
            });
          }
        });
      }
    });

    // Unreachable nodes check
    const entryNodes = nodes.filter(n => n.is_entrypoint);
    const reachableNodeIds = new Set<string>();

    const traverse = (nodeId: string) => {
      if (reachableNodeIds.has(nodeId)) return;
      reachableNodeIds.add(nodeId);
      const outgoing = edges.filter(e => e.from_node_id === nodeId);
      outgoing.forEach(e => traverse(e.to_node_id));
    };

    entryNodes.forEach(e => traverse(e.id));

    nodes.forEach(n => {
      if (!n.is_entrypoint && !reachableNodeIds.has(n.id)) {
        issues.push({
          type: 'unreachable_node',
          severity: 'error',
          node_id: n.id,
          message: `Node "${n.name}" is unreachable from any entrypoint.`
        });
      }
    });

    return {
      version_id: versionId,
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issue_count: issues.length,
      issues
    };
  }

  public validateStructure(versionId: string): StructuralValidationResult {
    const nodes = this.getNodes(versionId);
    const edges = this.getEdges(versionId);

    const entrypoints = nodes.filter(n => n.is_entrypoint);
    const terminals = nodes.filter(n => n.is_terminal);
    const nonTerminals = nodes.filter(n => !n.is_terminal);

    const nonTerminalMissingEdge = nonTerminals.filter(n => {
      return !edges.some(e => e.from_node_id === n.id);
    });

    const checks = [
      {
        check: 'has_entrypoint',
        pass: entrypoints.length === 1,
        detail: entrypoints.length === 1 ? 'OK' : `Expected 1 entrypoint, found ${entrypoints.length}`
      },
      {
        check: 'has_terminal',
        pass: terminals.length >= 1,
        detail: `${terminals.length} terminal node(s)`
      },
      {
        check: 'non_terminal_has_edges',
        pass: nonTerminalMissingEdge.length === 0,
        detail: nonTerminalMissingEdge.length === 0 ? 'OK' : `${nonTerminalMissingEdge.length} non-terminal node(s) missing outgoing edges`
      }
    ];

    return {
      version_id: versionId,
      valid: checks.every(c => c.pass),
      checks
    };
  }

  // ==========================================
  // TACKLE-SRV: AI CONFIGURATION REGISTRY
  // ==========================================

  // Providers
  public getAIProviders(): AIProvider[] {
    return [...this.providers];
  }

  public getAIProviderById(id: string): AIProvider | null {
    return this.providers.find(p => p.id === id) || null;
  }

  public upsertAIProvider(data: Partial<AIProvider> & { name: string; type: AIProvider['type'] }): AIProvider {
    const id = data.id || `prov-${Date.now().toString(36)}`;
    const idx = this.providers.findIndex(p => p.id === id);
    const updated: AIProvider = {
      id,
      name: data.name,
      type: data.type,
      endpoint_url: data.endpoint_url || '',
      api_key: data.api_key || '',
      config_json: data.config_json || {},
      created_at: idx !== -1 ? this.providers[idx].created_at : new Date().toISOString()
    };
    if (idx !== -1) {
      this.providers[idx] = updated;
    } else {
      this.providers.push(updated);
    }
    this.persistAll();
    return updated;
  }

  public deleteAIProvider(id: string): boolean {
    const idx = this.providers.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.providers.splice(idx, 1);
    this.persistAll();
    return true;
  }

  // Harnesses
  public getAIHarnesses(): AIHarness[] {
    return [...this.harnesses];
  }

  public getAIHarnessById(id: string): AIHarness | null {
    return this.harnesses.find(h => h.id === id) || null;
  }

  public upsertAIHarness(data: Partial<AIHarness> & { name: string }): AIHarness {
    const id = data.id || `harness-${Date.now().toString(36)}`;
    const idx = this.harnesses.findIndex(h => h.id === id);
    const updated: AIHarness = {
      id,
      name: data.name,
      invocation_semantics: data.invocation_semantics || '',
      created_at: idx !== -1 ? this.harnesses[idx].created_at : new Date().toISOString()
    };
    if (idx !== -1) {
      this.harnesses[idx] = updated;
    } else {
      this.harnesses.push(updated);
    }
    this.persistAll();
    return updated;
  }

  public deleteAIHarness(id: string): boolean {
    const idx = this.harnesses.findIndex(h => h.id === id);
    if (idx === -1) return false;
    this.harnesses.splice(idx, 1);
    this.persistAll();
    return true;
  }

  // Models
  public getAIModels(): AIModel[] {
    return [...this.models];
  }

  public getAIModelById(id: string): AIModel | null {
    return this.models.find(m => m.id === id) || null;
  }

  public upsertAIModel(data: Partial<AIModel> & { name: string; harness_id: string; model_identifier: string }): AIModel {
    const id = data.id || `model-${Date.now().toString(36)}`;
    const idx = this.models.findIndex(m => m.id === id);
    const updated: AIModel = {
      id,
      name: data.name,
      harness_id: data.harness_id,
      provider_id: data.provider_id,
      model_identifier: data.model_identifier,
      created_at: idx !== -1 ? this.models[idx].created_at : new Date().toISOString()
    };
    if (idx !== -1) {
      this.models[idx] = updated;
    } else {
      this.models.push(updated);
    }
    this.persistAll();
    return updated;
  }

  public deleteAIModel(id: string): boolean {
    const idx = this.models.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.models.splice(idx, 1);
    this.persistAll();
    return true;
  }

  // Role Configs
  public getAIRoleConfigs(): AIRoleConfig[] {
    return [...this.roleConfigs];
  }

  public getAIRoleConfigByRole(role: string): AIRoleConfig | null {
    return this.roleConfigs.find(r => r.role.toLowerCase() === role.toLowerCase()) || null;
  }

  public upsertAIRoleConfig(data: Partial<AIRoleConfig> & { role: string; provider_id: string; harness_id: string; model_id: string }): AIRoleConfig {
    const id = data.id || `rolecfg-${data.role}`;
    const idx = this.roleConfigs.findIndex(r => r.role.toLowerCase() === data.role.toLowerCase());
    const roleBundles = data.bundles || this.bundles.filter(b => b.role.toLowerCase() === data.role.toLowerCase());
    
    const updated: AIRoleConfig = {
      id,
      role: data.role,
      provider_id: data.provider_id,
      harness_id: data.harness_id,
      model_id: data.model_id,
      extra_params: data.extra_params || {},
      bundles: roleBundles,
      created_at: idx !== -1 ? this.roleConfigs[idx].created_at : new Date().toISOString()
    };

    if (idx !== -1) {
      this.roleConfigs[idx] = updated;
    } else {
      this.roleConfigs.push(updated);
    }
    this.persistAll();
    return updated;
  }

  public deleteAIRoleConfigByRole(role: string): boolean {
    const idx = this.roleConfigs.findIndex(r => r.role.toLowerCase() === role.toLowerCase());
    if (idx === -1) return false;
    this.roleConfigs.splice(idx, 1);
    this.bundles = this.bundles.filter(b => b.role.toLowerCase() !== role.toLowerCase());
    this.persistAll();
    return true;
  }

  // Config Bundles
  public getAIBundles(role?: string): AIConfigBundle[] {
    if (role) {
      return this.bundles.filter(b => b.role.toLowerCase() === role.toLowerCase());
    }
    return [...this.bundles];
  }

  public getAIBundleById(id: string): AIConfigBundle | null {
    return this.bundles.find(b => b.id === id) || null;
  }

  public upsertAIBundle(data: Partial<AIConfigBundle> & { name: string; role: string; model_id: string }): AIConfigBundle {
    const id = data.id || `bundle-${Date.now().toString(36)}`;
    const idx = this.bundles.findIndex(b => b.id === id);
    const updated: AIConfigBundle = {
      id,
      name: data.name,
      role: data.role,
      model_id: data.model_id,
      provider_id: data.provider_id,
      harness_id: data.harness_id,
      priority: data.priority ?? 10,
      invocation_mode: data.invocation_mode || 'sync',
      command: data.command || '',
      endpoint_url: data.endpoint_url || '',
      timeout_ms: data.timeout_ms || 60000,
      valid_from: data.valid_from,
      valid_to: data.valid_to,
      is_active: data.is_active ?? true,
      metadata: data.metadata || {}
    };

    if (idx !== -1) {
      this.bundles[idx] = updated;
    } else {
      this.bundles.push(updated);
    }
    
    // Sync roleConfig's bundles array
    const rIdx = this.roleConfigs.findIndex(r => r.role.toLowerCase() === data.role.toLowerCase());
    if (rIdx !== -1) {
      this.roleConfigs[rIdx].bundles = this.bundles.filter(b => b.role.toLowerCase() === data.role.toLowerCase());
    }

    this.persistAll();
    return updated;
  }

  public bulkUpsertRoleBundles(role: string, bundlesData: any[]): AIConfigBundle[] {
    // Remove existing bundles for this role
    this.bundles = this.bundles.filter(b => b.role.toLowerCase() !== role.toLowerCase());
    
    const newBundles: AIConfigBundle[] = bundlesData.map((data, idx) => ({
      id: data.id || `bundle-${role.toLowerCase()}-${Date.now().toString(36)}-${idx}`,
      name: data.name || `${role} Fallback #${idx + 1}`,
      role: role.toLowerCase(),
      model_id: data.model_id,
      provider_id: data.provider_id || 'prov-gemini',
      harness_id: data.harness_id || 'harness-opencode',
      priority: data.priority ?? (10 - idx * 2),
      invocation_mode: data.invocation_mode || 'sync',
      command: data.command || '',
      endpoint_url: data.endpoint_url || '',
      timeout_ms: data.timeout_ms || 60000,
      valid_from: data.valid_from,
      valid_to: data.valid_to,
      is_active: data.is_active ?? true,
      metadata: data.metadata || {}
    }));

    this.bundles.push(...newBundles);

    // Update roleConfig
    const rIdx = this.roleConfigs.findIndex(r => r.role.toLowerCase() === role.toLowerCase());
    if (rIdx !== -1) {
      this.roleConfigs[rIdx].bundles = newBundles;
    }

    this.persistAll();
    return newBundles;
  }

  public deleteAIBundle(id: string): boolean {
    const idx = this.bundles.findIndex(b => b.id === id);
    if (idx === -1) return false;
    this.bundles.splice(idx, 1);
    this.persistAll();
    return true;
  }

  public resolveRoleBundle(role: string): AIConfigBundle | null {
    const roleBundles = this.bundles.filter(b => b.role.toLowerCase() === role.toLowerCase() && b.is_active);
    if (roleBundles.length === 0) return null;
    // Return highest priority
    return roleBundles.sort((a, b) => b.priority - a.priority)[0];
  }

  public validateAIConfig(): AIConfigValidation {
    const warnings: string[] = [];
    if (this.providers.length === 0) warnings.push('No AI providers registered in /config/ai/providers');
    if (this.models.length === 0) warnings.push('No AI models registered in /config/ai/models');
    
    this.roleConfigs.forEach(rc => {
      const hasModel = this.models.some(m => m.id === rc.model_id);
      if (!hasModel) warnings.push(`Role config "${rc.role}" references missing model_id: ${rc.model_id}`);
    });

    return {
      valid: warnings.length === 0,
      warnings
    };
  }

  public testAIInvocation(model_id: string, test_prompt: string): TestInvocationResult {
    const model = this.models.find(m => m.id === model_id);
    const sessionId = `sess-test-${Date.now().toString(36)}`;
    const newSession: AgentSession = {
      id: sessionId,
      agent_role: 'test-runner',
      pid: Math.floor(Math.random() * 80000) + 10000,
      status: 'ENDED',
      created_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      logs: [
        `[test-invocation] Triggered model test for ${model?.name || model_id}`,
        `[prompt] "${test_prompt}"`,
        `[response] Model execution succeeded. Echo token stream verified.`
      ]
    };
    this.agentSessions.unshift(newSession);
    this.persistAll();

    return {
      sessionId,
      model_id,
      status: 'SUCCESS',
      output_text: `Test execution successful for model "${model?.name || model_id}". Prompt received: "${test_prompt}".`,
      duration_ms: 320
    };
  }

  // ==========================================
  // SESSIONS LEDGER & SCHEDULER
  // ==========================================
  public getSessions(): AgentSession[] {
    return [...this.agentSessions];
  }

  public killSession(sessionId: string): SessionKillResult {
    const sess = this.agentSessions.find(s => s.id === sessionId);
    if (!sess) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (sess.status !== 'RUNNING') {
      throw new Error(`Session ${sessionId} is not running (status: ${sess.status})`);
    }

    sess.status = 'KILLED';
    sess.ended_at = new Date().toISOString();
    sess.logs?.push(`[SIGKILL] Session process group (PID ${sess.pid}) terminated forcefully via /sessions/${sessionId}/kill`);
    this.persistAll();

    return {
      killed: true,
      sessionId,
      pids: [sess.pid],
      timestamp: new Date().toISOString()
    };
  }

  public getScheduler(): ScheduledAgent[] {
    return [...this.scheduledAgents];
  }

  public getDueScheduler(): ScheduledAgent[] {
    return this.scheduledAgents.filter(s => s.enabled);
  }

  public createScheduler(data: Partial<ScheduledAgent> & { role: string; schedule_type: ScheduledAgent['schedule_type']; schedule_value: string }): ScheduledAgent {
    const newSched: ScheduledAgent = {
      id: `sched-${Date.now().toString(36)}`,
      role: data.role,
      model_id: data.model_id || 'model-gemini-3.6-flash',
      harness: data.harness || 'harness-opencode',
      agent_config: data.agent_config || {},
      schedule_type: data.schedule_type,
      schedule_value: data.schedule_value,
      project_dir: data.project_dir || '/home/codex/dev/nexus',
      enabled: data.enabled ?? true,
      last_run_at: new Date().toISOString(),
      next_run_at: new Date(Date.now() + 15 * 60000).toISOString()
    };
    this.scheduledAgents.push(newSched);
    this.persistAll();
    return newSched;
  }

  public patchScheduler(id: string, data: Partial<ScheduledAgent>): ScheduledAgent | null {
    const idx = this.scheduledAgents.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.scheduledAgents[idx] = { ...this.scheduledAgents[idx], ...data };
    this.persistAll();
    return this.scheduledAgents[idx];
  }

  public deleteScheduler(id: string): boolean {
    const idx = this.scheduledAgents.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.scheduledAgents.splice(idx, 1);
    this.persistAll();
    return true;
  }

  // ==========================================
  // MEMORY PROCEDURES & CHECKPOINTS
  // ==========================================
  public getMemoryProcedures(role: string): RoleMemoryProcedure[] {
    return this.roleMemories.filter(m => m.role.toLowerCase() === role.toLowerCase());
  }

  public getMemoryProcedureBySlug(slug: string): RoleMemoryProcedure | null {
    return this.roleMemories.find(m => m.slug === slug) || null;
  }

  public checkMemorySince(role: string, since: string): { role: string; since: string; changed: boolean } {
    const roleMems = this.getMemoryProcedures(role);
    const sinceDate = new Date(since).getTime();
    const hasNewer = roleMems.some(m => new Date(m.as_of_dt).getTime() > sinceDate);
    return { role, since, changed: hasNewer };
  }

  public refreshMemory(): { refreshed: boolean; procedures: number; timestamp: string } {
    return {
      refreshed: true,
      procedures: this.roleMemories.length,
      timestamp: new Date().toISOString()
    };
  }

  public getRoleCheckpoints(): Record<string, RoleCheckpoint> {
    return { ...this.checkpoints };
  }

  // ==========================================
  // PROMPTS, TASKS & ROLE TOOL ACCESS
  // ==========================================
  public getPrompts(role: string): PromptTemplate[] {
    return this.prompts.filter(p => p.role.toLowerCase() === role.toLowerCase());
  }

  public getPromptBySlug(role: string, slug: string): PromptTemplate | null {
    return this.prompts.find(p => p.role.toLowerCase() === role.toLowerCase() && p.slug === slug) || null;
  }

  public getRoleTasks(role: string): RoleTaskAssignment[] {
    return this.roleTasks.filter(t => t.role.toLowerCase() === role.toLowerCase() && t.active);
  }

  public getRoleToolAccess(role?: string): RoleToolAccess[] {
    if (role) {
      return this.roleToolAccess.filter(ta => ta.role.toLowerCase() === role.toLowerCase());
    }
    return [...this.roleToolAccess];
  }

  public updateRoleToolAccess(id: string, data: Partial<RoleToolAccess>): RoleToolAccess | null {
    const idx = this.roleToolAccess.findIndex(ta => ta.id === id);
    if (idx === -1) return null;
    this.roleToolAccess[idx] = { ...this.roleToolAccess[idx], ...data, updated_at: new Date().toISOString() };
    this.persistAll();
    return this.roleToolAccess[idx];
  }

  // ==========================================
  // CIRCUIT BREAKER / FAILURE RECOVERY
  // ==========================================
  public getCircuitBreaker(): CircuitBreakerConfig {
    return { ...this.circuitBreaker };
  }

  public saveCircuitBreaker(config: Partial<CircuitBreakerConfig>): CircuitBreakerConfig {
    this.circuitBreaker = { ...this.circuitBreaker, ...config };
    this.persistAll();
    return { ...this.circuitBreaker };
  }
}

export const mockBackend = new MockBackendEngine();
