import { Office, Title, Task, Outcome, Workflow, WorkflowVersion, WorkflowNode, WorkflowEdge, Instance, Ticket, Receipt, Role, EventItem, EventType } from '../types/wind';

export const INITIAL_ROLES: Role[] = [
  { id: 'role-101', name: 'Software Architect', description: 'Designs high level system architecture and workflow graphs' },
  { id: 'role-102', name: 'Senior Developer', description: 'Executes core code changes and feature implementation' },
  { id: 'role-103', name: 'QA Engineer', description: 'Executes integration test suites and validates build candidates' },
  { id: 'role-104', name: 'Security Auditor', description: 'Scans codebases for vulnerabilities and compliance' },
  { id: 'role-105', name: 'Release Controller', description: 'Approves production deployments and hotfixes' },
];

export const INITIAL_OFFICES: Office[] = [
  { id: 'off-1', name: 'Core Platform Engineering', description: 'Maintains foundational backend microservices and runtime APIs', created_at: '2026-07-20T10:00:00Z' },
  { id: 'off-2', name: 'Quality Assurance & SecOps', description: 'Automated test pipelines, vulnerability scanning and release gates', created_at: '2026-07-20T10:15:00Z' },
  { id: 'off-3', name: 'DevOps & Site Reliability', description: 'Cluster provisioning, infrastructure rollout and hotfix dispatches', created_at: '2026-07-20T10:30:00Z' },
];

export const INITIAL_TITLES: Title[] = [
  { id: 'title-1', office_id: 'off-1', role_id: 'role-102', display_name: 'Core Lead Implementer', office_name: 'Core Platform Engineering', role_name: 'Senior Developer', created_at: '2026-07-20T11:00:00Z' },
  { id: 'title-2', office_id: 'off-2', role_id: 'role-103', display_name: 'QA Automation Lead', office_name: 'Quality Assurance & SecOps', role_name: 'QA Engineer', created_at: '2026-07-20T11:05:00Z' },
  { id: 'title-3', office_id: 'off-2', role_id: 'role-104', display_name: 'SecOps Inspector', office_name: 'Quality Assurance & SecOps', role_name: 'Security Auditor', created_at: '2026-07-20T11:10:00Z' },
  { id: 'title-4', office_id: 'off-3', role_id: 'role-105', display_name: 'Release Dispatcher', office_name: 'DevOps & Site Reliability', role_name: 'Release Controller', created_at: '2026-07-20T11:15:00Z' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    office_id: 'off-1',
    title_id: 'title-1',
    name: 'Implement Code Changes',
    description: 'Write unit tests, compile TypeScript modules and verify clean lint status.',
    input_spec: { branch: 'string', PR_id: 'number', enforce_types: true },
    office_name: 'Core Platform Engineering',
    title_name: 'Core Lead Implementer',
    created_at: '2026-07-21T09:00:00Z'
  },
  {
    id: 'task-2',
    office_id: 'off-2',
    title_id: 'title-3',
    name: 'Run Security & AST Analysis',
    description: 'Perform static application security testing (SAST) and dependency vulnerability check.',
    input_spec: { severity_threshold: 'MEDIUM', scan_depth: 'FULL' },
    office_name: 'Quality Assurance & SecOps',
    title_name: 'SecOps Inspector',
    created_at: '2026-07-21T09:15:00Z'
  },
  {
    id: 'task-3',
    office_id: 'off-2',
    title_id: 'title-2',
    name: 'Execute Integration E2E Tests',
    description: 'Run suite of browser integration tests against staging cluster sandbox.',
    input_spec: { environment: 'staging', timeout_sec: 300 },
    office_name: 'Quality Assurance & SecOps',
    title_name: 'QA Automation Lead',
    created_at: '2026-07-21T09:30:00Z'
  },
  {
    id: 'task-4',
    office_id: 'off-3',
    title_id: 'title-4',
    name: 'Promote to Production Cluster',
    description: 'Blue/green deployment rollout into production Kubernetes cluster.',
    input_spec: { canary_percent: 10, auto_rollback: true },
    office_name: 'DevOps & Site Reliability',
    title_name: 'Release Dispatcher',
    created_at: '2026-07-21T09:45:00Z'
  }
];

export const INITIAL_OUTCOMES: Outcome[] = [
  // Task 1 Outcomes
  { id: 'out-1', task_id: 'task-1', code: 'build_passed', description: 'Code compiled successfully with 0 lint errors', output_spec: { build_artifact: 'string', hash: 'sha256' }, created_at: '2026-07-21T10:00:00Z' },
  { id: 'out-2', task_id: 'task-1', code: 'build_failed', description: 'Compilation or syntax check failed', output_spec: { error_log: 'string' }, created_at: '2026-07-21T10:05:00Z' },
  
  // Task 2 Outcomes
  { id: 'out-3', task_id: 'task-2', code: 'sec_clean', description: 'No high or critical vulnerabilities detected', output_spec: { CVE_count: 0 }, created_at: '2026-07-21T10:10:00Z' },
  { id: 'out-4', task_id: 'task-2', code: 'sec_flagged', description: 'Vulnerabilities detected requiring security review', output_spec: { CVE_ids: 'array' }, created_at: '2026-07-21T10:15:00Z' },

  // Task 3 Outcomes
  { id: 'out-5', task_id: 'task-3', code: 'tests_passed', description: '100% of integration test cases passed', output_spec: { coverage: 'number' }, created_at: '2026-07-21T10:20:00Z' },
  { id: 'out-6', task_id: 'task-3', code: 'tests_failed', description: 'Regression or assertion failure encountered', output_spec: { failed_suites: 'array' }, created_at: '2026-07-21T10:25:00Z' },

  // Task 4 Outcomes
  { id: 'out-7', task_id: 'task-4', code: 'rollout_complete', description: '100% canary traffic routed to new version', output_spec: { deployment_id: 'string' }, created_at: '2026-07-21T10:30:00Z' },
  { id: 'out-8', task_id: 'task-4', code: 'rolled_back', description: 'Health check failed during canary; auto-rolled back', output_spec: { rollback_reason: 'string' }, created_at: '2026-07-21T10:35:00Z' },
];

export const INITIAL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    name: 'CI/CD Feature Pipeline',
    description: 'Standard end-to-end verification and deployment workflow for core platform features.',
    version_count: 2,
    active_version_id: 'ver-102',
    active_version_number: 2,
    created_at: '2026-07-22T08:00:00Z'
  },
  {
    id: 'wf-2',
    name: 'Urgent Patch Dispatch',
    description: 'Fast-track security audit and hotfix verification graph.',
    version_count: 1,
    active_version_id: 'ver-201',
    active_version_number: 1,
    created_at: '2026-07-22T08:30:00Z'
  }
];

export const INITIAL_VERSIONS: WorkflowVersion[] = [
  {
    id: 'ver-101',
    workflow_id: 'wf-1',
    version_number: 1,
    is_active: false,
    created_at: '2026-07-22T08:05:00Z'
  },
  {
    id: 'ver-102',
    workflow_id: 'wf-1',
    version_number: 2,
    is_active: true,
    created_at: '2026-07-22T09:00:00Z'
  },
  {
    id: 'ver-201',
    workflow_id: 'wf-2',
    version_number: 1,
    is_active: true,
    created_at: '2026-07-22T09:30:00Z'
  }
];

export const INITIAL_NODES: WorkflowNode[] = [
  // Nodes for Version ver-102 (Feature Pipeline v2)
  { id: 'node-101', workflow_version_id: 'ver-102', task_id: 'task-1', name: 'code_implementation', is_entrypoint: true, is_terminal: false, x: 100, y: 180 },
  { id: 'node-102', workflow_version_id: 'ver-102', task_id: 'task-2', name: 'secops_scan', is_entrypoint: false, is_terminal: false, x: 380, y: 100 },
  { id: 'node-103', workflow_version_id: 'ver-102', task_id: 'task-3', name: 'qa_e2e_tests', is_entrypoint: false, is_terminal: false, x: 380, y: 260 },
  { id: 'node-104', workflow_version_id: 'ver-102', task_id: 'task-4', name: 'prod_deployment', is_entrypoint: false, is_terminal: true, x: 680, y: 180 },

  // Nodes for Version ver-201
  { id: 'node-201', workflow_version_id: 'ver-201', task_id: 'task-2', name: 'express_sec_check', is_entrypoint: true, is_terminal: false, x: 120, y: 180 },
  { id: 'node-202', workflow_version_id: 'ver-201', task_id: 'task-4', name: 'hotfix_rollout', is_entrypoint: false, is_terminal: true, x: 450, y: 180 },
];

export const INITIAL_EDGES: WorkflowEdge[] = [
  // Edges for ver-102
  { id: 'edge-101', workflow_version_id: 'ver-102', from_node_id: 'node-101', from_task_id: 'task-1', outcome_id: 'out-1', to_node_id: 'node-102' },
  { id: 'edge-102', workflow_version_id: 'ver-102', from_node_id: 'node-102', from_task_id: 'task-2', outcome_id: 'out-3', to_node_id: 'node-103' },
  { id: 'edge-103', workflow_version_id: 'ver-102', from_node_id: 'node-103', from_task_id: 'task-3', outcome_id: 'out-5', to_node_id: 'node-104' },

  // Edges for ver-201
  { id: 'edge-201', workflow_version_id: 'ver-201', from_node_id: 'node-201', from_task_id: 'task-2', outcome_id: 'out-3', to_node_id: 'node-202' },
];

export const INITIAL_INSTANCES: Instance[] = [
  {
    id: 'inst-1001',
    workflow_version_id: 'ver-102',
    status: 'ACTIVE',
    workflow_name: 'CI/CD Feature Pipeline',
    version_number: 2,
    created_at: '2026-07-24T14:20:00Z',
    updated_at: '2026-07-24T14:25:00Z'
  },
  {
    id: 'inst-1002',
    workflow_version_id: 'ver-102',
    status: 'COMPLETED',
    workflow_name: 'CI/CD Feature Pipeline',
    version_number: 2,
    created_at: '2026-07-24T10:00:00Z',
    updated_at: '2026-07-24T10:45:00Z'
  },
  {
    id: 'inst-1003',
    workflow_version_id: 'ver-201',
    status: 'PAUSED',
    workflow_name: 'Urgent Patch Dispatch',
    version_number: 1,
    created_at: '2026-07-24T12:00:00Z',
    updated_at: '2026-07-24T12:10:00Z'
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tkt-801',
    instance_id: 'inst-1001',
    workflow_version_id: 'ver-102',
    node_id: 'node-101',
    task_id: 'task-1',
    title_id: 'title-1',
    status: 'COMPLETED',
    node_name: 'code_implementation',
    task_name: 'Implement Code Changes',
    title_name: 'Core Lead Implementer',
    workflow_name: 'CI/CD Feature Pipeline',
    created_at: '2026-07-24T14:20:00Z',
    updated_at: '2026-07-24T14:22:00Z'
  },
  {
    id: 'tkt-802',
    instance_id: 'inst-1001',
    workflow_version_id: 'ver-102',
    node_id: 'node-102',
    task_id: 'task-2',
    title_id: 'title-3',
    status: 'IN_PROGRESS',
    node_name: 'secops_scan',
    task_name: 'Run Security & AST Analysis',
    title_name: 'SecOps Inspector',
    workflow_name: 'CI/CD Feature Pipeline',
    created_at: '2026-07-24T14:22:00Z',
    updated_at: '2026-07-24T14:23:00Z'
  },
  {
    id: 'tkt-901',
    instance_id: 'inst-1003',
    workflow_version_id: 'ver-201',
    node_id: 'node-201',
    task_id: 'task-2',
    title_id: 'title-3',
    status: 'PENDING',
    node_name: 'express_sec_check',
    task_name: 'Run Security & AST Analysis',
    title_name: 'SecOps Inspector',
    workflow_name: 'Urgent Patch Dispatch',
    created_at: '2026-07-24T12:00:00Z',
    updated_at: '2026-07-24T12:00:00Z'
  }
];

export const INITIAL_RECEIPTS: Receipt[] = [
  {
    id: 'rcpt-501',
    ticket_id: 'tkt-801',
    instance_id: 'inst-1001',
    outcome_id: 'out-1',
    outcome_code: 'build_passed',
    task_name: 'Implement Code Changes',
    node_name: 'code_implementation',
    output_data: { build_artifact: 'dist/bundle-v2.3.js', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    created_at: '2026-07-24T14:22:00Z'
  }
];

export const INITIAL_EVENT_TYPES: EventType[] = [
  {
    event_type: 'github.pull_request.opened',
    description: 'Triggered when a developer opens or updates a GitHub Pull Request',
    schema: { pr_id: 'number', repository: 'string', author: 'string', branch: 'string' },
    workflow_id: 'wf-1',
    workflow_name: 'CI/CD Feature Pipeline',
    dedup_key_template: 'pr-{{payload.repository}}-{{payload.pr_id}}',
    enabled: true,
    created_at: '2026-07-25T10:00:00Z'
  },
  {
    event_type: 'secops.cve.detected',
    description: 'Emitted when vulnerability scanner detects a high severity CVE in dependencies',
    schema: { cve_id: 'string', severity: 'string', package_name: 'string' },
    workflow_id: 'wf-2',
    workflow_name: 'Urgent Patch Dispatch',
    dedup_key_template: 'sec-{{payload.cve_id}}',
    enabled: true,
    created_at: '2026-07-25T10:30:00Z'
  },
  {
    event_type: 'deploy.status.failed',
    description: 'Telemetry event published when production health check fails post-rollout',
    schema: { cluster: 'string', instance_id: 'string', error_code: 'string' },
    workflow_id: 'wf-2',
    workflow_name: 'Urgent Patch Dispatch',
    dedup_key_template: 'fail-{{payload.instance_id}}',
    enabled: true,
    created_at: '2026-07-25T11:00:00Z'
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-1001',
    event_type: 'github.pull_request.opened',
    subject: 'PR #142: Add OAuth telemetry logging',
    payload: { pr_id: 142, repository: 'wind-srv/core', author: 'dev_alex', branch: 'feat/oauth' },
    source: 'github-webhook-srv',
    created_at: '2026-07-29T03:15:00Z',
    consumed_at: '2026-07-29T03:15:02Z',
    metadata: { nats_sequence: 1042, trace_id: 'tr-9921a' }
  },
  {
    id: 'evt-1002',
    event_type: 'secops.cve.detected',
    subject: 'CVE-2026-8812 detected in jsonwebtoken 8.5.1',
    payload: { cve_id: 'CVE-2026-8812', severity: 'HIGH', package_name: 'jsonwebtoken' },
    source: 'trivy-scanner-srv',
    created_at: '2026-07-29T03:40:00Z',
    consumed_at: null,
    metadata: { nats_sequence: 1043, trace_id: 'tr-1042b' }
  },
  {
    id: 'evt-1003',
    event_type: 'deploy.status.failed',
    subject: 'Staging cluster deployment check timeout',
    payload: { cluster: 'us-west1-staging', instance_id: 'inst-1002', error_code: 'ERR_HEALTH_TIMEOUT' },
    source: 'k8s-operator',
    created_at: '2026-07-29T04:05:00Z',
    consumed_at: null,
    metadata: { nats_sequence: 1044, trace_id: 'tr-1088c' }
  }
];

