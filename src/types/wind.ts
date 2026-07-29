export type InstanceStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
export type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Office {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Title {
  id: string;
  office_id: string;
  role_id: string;
  display_name: string;
  office_name?: string;
  role_name?: string;
  created_at: string;
}

export interface Task {
  id: string;
  office_id: string;
  title_id: string;
  name: string;
  description?: string;
  input_spec: Record<string, any>;
  outcomes?: Outcome[];
  office_name?: string;
  title_name?: string;
  created_at: string;
}

export interface Outcome {
  id: string;
  task_id: string;
  code: string;
  description?: string;
  output_spec: Record<string, any>;
  created_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version_count?: number;
  active_version?: number;
  versions?: WorkflowVersion[];
  created_at: string;
}

export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version_number: number;
  is_active: boolean;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  created_at: string;
}

export interface WorkflowNode {
  id: string;
  workflow_version_id: string;
  task_id: string;
  name: string;
  is_entrypoint: boolean;
  is_terminal: boolean;
  task_name?: string;
  task_input_spec?: Record<string, any>;
  x?: number;
  y?: number;
  created_at?: string;
}

export interface WorkflowEdge {
  id: string;
  workflow_version_id: string;
  from_node_id: string;
  from_task_id: string;
  outcome_id: string;
  to_node_id: string;
  from_node_name?: string;
  to_node_name?: string;
  outcome_code?: string;
  created_at?: string;
}

export interface Instance {
  id: string;
  workflow_version_id: string;
  status: InstanceStatus;
  workflow_name?: string;
  version_number?: number;
  tickets?: Ticket[];
  receipts?: Receipt[];
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  workflow_instance_id: string;
  workflow_version_id: string;
  node_id: string;
  node_task_id: string;
  assigned_title_id: string;
  status: TicketStatus;
  node_name?: string;
  task_name?: string;
  title_name?: string;
  workflow_name?: string;
  input_artifact_type?: string;
  input_artifact_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  ticket_id: string;
  ticket_task_id: string;
  outcome_id: string;
  outcome_code: string;
  task_name: string;
  work_request_id?: string;
  output_artifact_type?: string;
  output_artifact_id?: string;
  completed_at: string;
  metadata?: Record<string, any>;
}

export interface GraphValidationResult {
  version_id: string;
  valid: boolean;
  issue_count: number;
  issues: {
    type: 'unhandled_outcome' | 'unreachable_node' | 'contract_mismatch' | 'orphan_edge';
    severity: 'error' | 'warning';
    node_id?: string;
    outcome_id?: string;
    message: string;
  }[];
}

export interface StructuralValidationResult {
  version_id: string;
  valid: boolean;
  checks: {
    check: string;
    pass: boolean;
    detail: string;
  }[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  durationMs: number;
  mode: 'MOCK' | 'LIVE';
  requestPayload?: any;
  responsePayload?: any;
  curlCommand: string;
}

export interface EventItem {
  id: string;
  event_type: string;
  subject: string;
  payload: Record<string, any>;
  source: string;
  created_at: string;
  consumed_at?: string | null;
  metadata?: Record<string, any>;
}

export interface EventType {
  event_type: string;
  description: string;
  schema?: Record<string, any>;
  workflow_id?: string | null;
  workflow_name?: string | null;
  dedup_key_template?: string | null;
  enabled: boolean;
  created_at: string;
}

export interface ExecuteTicketResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
  ticket_id: string;
  instance_id: string;
  outcome_code?: string;
  receipt?: Receipt;
  logs: string[];
}

export interface WorkflowRunResult {
  success: boolean;
  instance_id: string;
  steps_executed: number;
  tickets_processed: string[];
  receipts_created: Receipt[];
  final_status: string;
  logs: string[];
}
