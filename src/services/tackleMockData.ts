import {
  AIProvider, AIHarness, AIModel, AIRoleConfig, AIConfigBundle,
  AgentSession, ScheduledAgent, RoleMemoryProcedure, RoleCheckpoint,
  PromptTemplate, RoleTaskAssignment, RoleToolAccess, CircuitBreakerConfig
} from '../types/tackle';

export const INITIAL_AI_PROVIDERS: AIProvider[] = [
  {
    id: 'prov-gemini',
    name: 'Google Gemini Direct',
    type: 'gemini',
    endpoint_url: 'https://generativelanguage.googleapis.com/v1beta',
    api_key: 'AIzaSy****************',
    config_json: { timeout_ms: 120000, region: 'us-west1' },
    created_at: '2026-07-25T06:00:00Z'
  },
  {
    id: 'prov-anthropic',
    name: 'Anthropic Claude API',
    type: 'anthropic',
    endpoint_url: 'https://api.anthropic.com/v1',
    api_key: 'sk-ant-api03-****************',
    config_json: { max_tokens: 8192 },
    created_at: '2026-07-25T06:05:00Z'
  },
  {
    id: 'prov-openai',
    name: 'OpenAI Platform API',
    type: 'openai',
    endpoint_url: 'https://api.openai.com/v1',
    api_key: 'sk-proj-****************',
    config_json: { organization: 'org-nexus' },
    created_at: '2026-07-25T06:10:00Z'
  },
  {
    id: 'prov-ollama',
    name: 'Local Ollama Daemon',
    type: 'ollama',
    endpoint_url: 'http://localhost:11434',
    api_key: '',
    config_json: { num_ctx: 32768 },
    created_at: '2026-07-25T06:15:00Z'
  }
];

export const INITIAL_AI_HARNESSES: AIHarness[] = [
  {
    id: 'harness-opencode',
    name: 'Opencode CLI Driver',
    invocation_semantics: { supports_streaming: true, supports_function_calling: true, supports_vision: true, timeout_default_ms: 30000, protocol: 'CLI' },
    created_at: '2026-07-25T06:20:00Z'
  },
  {
    id: 'harness-mcp-stdio',
    name: 'MCP Stdio Bridge',
    invocation_semantics: { supports_streaming: true, supports_function_calling: false, supports_vision: false, timeout_default_ms: 15000, protocol: 'MCP stdio' },
    created_at: '2026-07-25T06:25:00Z'
  },
  {
    id: 'harness-direct-rest',
    name: 'REST Direct Runner',
    invocation_semantics: { supports_streaming: false, supports_function_calling: false, supports_vision: false, timeout_default_ms: 30000, protocol: 'HTTP REST' },
    created_at: '2026-07-25T06:30:00Z'
  }
];

export const INITIAL_AI_MODELS: AIModel[] = [
  {
    id: 'model-gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    harness_id: 'harness-opencode',
    provider_id: 'prov-gemini',
    model_identifier: 'models/gemini-3.6-flash',
    created_at: '2026-07-25T06:35:00Z'
  },
  {
    id: 'model-claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    harness_id: 'harness-opencode',
    provider_id: 'prov-anthropic',
    model_identifier: 'claude-3-5-sonnet-20241022',
    created_at: '2026-07-25T06:40:00Z'
  },
  {
    id: 'model-gpt-4o',
    name: 'GPT-4o Omnimodal',
    harness_id: 'harness-opencode',
    provider_id: 'prov-openai',
    model_identifier: 'gpt-4o',
    created_at: '2026-07-25T06:45:00Z'
  },
  {
    id: 'model-deepseek-r1',
    name: 'DeepSeek R1 14B',
    harness_id: 'harness-opencode',
    provider_id: 'prov-ollama',
    model_identifier: 'deepseek-r1:14b',
    created_at: '2026-07-25T06:50:00Z'
  }
];

export const INITIAL_AI_CONFIG_BUNDLES: AIConfigBundle[] = [
  {
    id: 'bundle-eng-primary',
    name: 'Engineering Primary Gemini Bundle',
    role: 'engineer',
    model_id: 'model-gemini-3.6-flash',
    provider_id: 'prov-gemini',
    harness_id: 'harness-opencode',
    priority: 10,
    invocation_mode: 'CLI',
    timeout_ms: 120000,
    is_active: true,
    metadata: { memory_cache: 'redis:mem:idx:engineer', max_context: 1000000 }
  },
  {
    id: 'bundle-eng-fallback',
    name: 'Engineering Fallback Sonnet Bundle',
    role: 'engineer',
    model_id: 'model-claude-3.5-sonnet',
    provider_id: 'prov-anthropic',
    harness_id: 'harness-opencode',
    priority: 5,
    invocation_mode: 'HTTP',
    timeout_ms: 60000,
    is_active: true,
    metadata: { breaker_fallback: true }
  },
  {
    id: 'bundle-insp-primary',
    name: 'Inspection Standard Claude Bundle',
    role: 'inspector',
    model_id: 'model-claude-3.5-sonnet',
    provider_id: 'prov-anthropic',
    harness_id: 'harness-opencode',
    priority: 10,
    invocation_mode: 'CLI',
    timeout_ms: 90000,
    is_active: true,
    metadata: { validation_strictness: 'high' }
  },
  {
    id: 'bundle-op-primary',
    name: 'Operator Chat Bundle',
    role: 'operator',
    model_id: 'model-gemini-3.6-flash',
    provider_id: 'prov-gemini',
    harness_id: 'harness-opencode',
    priority: 10,
    invocation_mode: 'MCP',
    timeout_ms: 45000,
    is_active: true,
    metadata: { prompt_namespace: 'prompt:idx:operator' }
  }
];

export const INITIAL_AI_ROLE_CONFIGS: AIRoleConfig[] = [
  {
    id: 'rolecfg-engineer',
    role: 'engineer',
    provider_id: 'prov-gemini',
    harness_id: 'harness-opencode',
    model_id: 'model-gemini-3.6-flash',
    extra_params: { temperature: 0.2, top_p: 0.95 },
    bundles: [INITIAL_AI_CONFIG_BUNDLES[0], INITIAL_AI_CONFIG_BUNDLES[1]],
    created_at: '2026-07-25T07:00:00Z'
  },
  {
    id: 'rolecfg-inspector',
    role: 'inspector',
    provider_id: 'prov-anthropic',
    harness_id: 'harness-opencode',
    model_id: 'model-claude-3.5-sonnet',
    extra_params: { temperature: 0.0, strict_json: true },
    bundles: [INITIAL_AI_CONFIG_BUNDLES[2]],
    created_at: '2026-07-25T07:05:00Z'
  },
  {
    id: 'rolecfg-operator',
    role: 'operator',
    provider_id: 'prov-gemini',
    harness_id: 'harness-opencode',
    model_id: 'model-gemini-3.6-flash',
    extra_params: { temperature: 0.4 },
    bundles: [INITIAL_AI_CONFIG_BUNDLES[3]],
    created_at: '2026-07-25T07:10:00Z'
  }
];

export const INITIAL_AGENT_SESSIONS: AgentSession[] = [
  {
    id: 'sess-87421',
    agent_role: 'engineer',
    pid: 87421,
    status: 'RUNNING',
    created_at: '2026-07-25T10:15:00Z',
    logs: [
      '[tackle-srv :3410] Session initialized for role: engineer',
      '[harness-opencode] Spawned process PID 87421',
      '[memory-reader] Loaded 2 procedure cards from Redis mem:idx:engineer',
      '[prompt-sync :3501] Attached prompt engineer/opencode-persona (v2)',
      '[mcp-bridge :3135] Forwarding prompts/get "engineer/opencode-persona"',
      '[agent-runner] Executing active task ticket tkt-201...'
    ]
  },
  {
    id: 'sess-90114',
    agent_role: 'inspector',
    pid: 90114,
    status: 'RUNNING',
    created_at: '2026-07-25T10:20:00Z',
    logs: [
      '[tackle-srv :3410] Session initialized for role: inspector',
      '[harness-opencode] Spawned process PID 90114',
      '[graph-validator] GET /api/validate/ver-1... Status: PASSED',
      '[role-tool-access] Checking tool: validate_graph -> ALLOWED'
    ]
  },
  {
    id: 'sess-65120',
    agent_role: 'operator',
    pid: 65120,
    status: 'ENDED',
    created_at: '2026-07-25T09:00:00Z',
    ended_at: '2026-07-25T09:12:00Z',
    logs: [
      '[tackle-srv :3410] Session ended cleanly. Status: 0'
    ]
  }
];

export const INITIAL_SCHEDULED_AGENTS: ScheduledAgent[] = [
  {
    id: 'sched-1',
    role: 'inspector',
    model_id: 'model-claude-3.5-sonnet',
    harness: 'harness-opencode',
    agent_config: { auto_audit: true, max_depth: 5 },
    schedule_type: 'cron',
    schedule_value: '*/15 * * * *',
    project_dir: '/home/codex/dev/nexus',
    enabled: true,
    last_run_at: '2026-07-25T10:15:00Z',
    next_run_at: '2026-07-25T10:30:00Z'
  },
  {
    id: 'sched-2',
    role: 'engineer',
    model_id: 'model-gemini-3.6-flash',
    harness: 'harness-opencode',
    agent_config: { poll_tickets: true },
    schedule_type: 'interval',
    schedule_value: '30m',
    project_dir: '/home/codex/dev/nexus',
    enabled: true,
    last_run_at: '2026-07-25T10:00:00Z',
    next_run_at: '2026-07-25T10:30:00Z'
  },
  {
    id: 'sched-3',
    role: 'operator',
    model_id: 'model-gemini-3.6-flash',
    harness: 'harness-direct-rest',
    agent_config: { health_sweep: true },
    schedule_type: 'manual',
    schedule_value: 'on-demand',
    project_dir: '/home/codex/dev/nexus',
    enabled: false
  }
];

export const INITIAL_ROLE_MEMORIES: RoleMemoryProcedure[] = [
  {
    id: 'mem-1',
    role: 'engineer',
    slug: 'dag-traversal-resolution',
    title: 'DAG Traversal & Ticket Advance Procedure',
    body_md: `## Standard Operating Procedure: DAG Traversal
1. Validate ticket status = \`PENDING\` or \`IN_PROGRESS\`.
2. Execute task node action according to \`task_input_spec\`.
3. Record outcome code in receipt record.
4. Spawn downstream node tickets for matching directed edges.`,
    tags: ['dag', 'runtime', 'tickets', 'tackle-srv'],
    version: 2,
    as_of_dt: '2026-07-25T08:00:00Z'
  },
  {
    id: 'mem-2',
    role: 'inspector',
    slug: 'structural-entrypoint-validation',
    title: 'Structural Validation Protocol',
    body_md: `## Inspection Protocol: Entrypoint & Reachability
- Check single entrypoint constraint (\`has_entrypoint\`).
- Verify all non-terminal nodes have outbound directed edges.
- Verify zero orphan / unreachable nodes in version graph.`,
    tags: ['validation', 'audit', 'graph', 'integrity'],
    version: 1,
    as_of_dt: '2026-07-25T08:30:00Z'
  },
  {
    id: 'mem-3',
    role: 'operator',
    slug: 'circuit-breaker-recovery-guide',
    title: 'Circuit Breaker Push-Back Guide',
    body_md: `## Circuit Breaker Manual Override
When consecutive API call failures exceed \`max_retries_per_model\`, the breaker transitions to OPEN state and pushes back pending tickets.`,
    tags: ['failure-recovery', 'breaker', 'operator'],
    version: 3,
    as_of_dt: '2026-07-25T09:10:00Z'
  }
];

export const INITIAL_CHECKPOINTS: Record<string, RoleCheckpoint> = {
  engineer: { role: 'engineer', last_active: '2026-07-25T10:25:00Z' },
  inspector: { role: 'inspector', last_active: '2026-07-25T10:22:00Z' },
  operator: { role: 'operator', last_active: '2026-07-25T09:12:00Z' }
};

export const INITIAL_PROMPTS: PromptTemplate[] = [
  {
    id: 'pr-1',
    role: 'engineer',
    slug: 'opencode-persona',
    version: 2,
    body_md: `# Engineer Agent Persona (v2)
You are a senior systems engineer operating within the Nexus/Tackle architecture. Always check role tool allowlists and verify DAG edges before execution.`,
    parameter_schema: { role: 'string', project_dir: 'string' },
    tags: ['persona', 'engineer', 'v2'],
    created_at: '2026-07-25T07:00:00Z'
  },
  {
    id: 'pr-2',
    role: 'inspector',
    slug: 'graph-audit-prompt',
    version: 1,
    body_md: `# Inspector Audit System Prompt
You review DAG topology for structural flaws, unreachable states, missing edges, and unhandled outcome codes.`,
    parameter_schema: { version_id: 'string' },
    tags: ['audit', 'inspector', 'graph'],
    created_at: '2026-07-25T07:10:00Z'
  },
  {
    id: 'pr-3',
    role: 'operator',
    slug: 'operator-system-prompt',
    version: 1,
    body_md: `# Operator Chat BASE/TAIL System Prompt
You manage agent scheduling, kill active sessions, and configure AI providers, harnesses, and models.`,
    parameter_schema: { mode: 'string' },
    tags: ['operator', 'system'],
    created_at: '2026-07-25T07:20:00Z'
  }
];

export const INITIAL_ROLE_TASKS: RoleTaskAssignment[] = [
  {
    id: 'tsk-1',
    role: 'engineer',
    prompt_id: 'pr-1',
    prompt_slug: 'opencode-persona',
    task_name: 'Code Implementation & Bug Fixing',
    description: 'Execute coding tasks based on incoming ticket specs.',
    active: true,
    created_at: '2026-07-25T07:30:00Z'
  },
  {
    id: 'tsk-2',
    role: 'inspector',
    prompt_id: 'pr-2',
    prompt_slug: 'graph-audit-prompt',
    task_name: 'Graph Integrity Audit Task',
    description: 'Audit workflow versions against graph constraints.',
    active: true,
    created_at: '2026-07-25T07:35:00Z'
  }
];

export const INITIAL_ROLE_TOOL_ACCESS: RoleToolAccess[] = [
  {
    id: 'ta-1',
    role: 'engineer',
    tool_name: 'run_command',
    allowed: true,
    restriction_rules: 'Allow standard build and test scripts in project directory',
    updated_at: '2026-07-25T08:00:00Z'
  },
  {
    id: 'ta-2',
    role: 'engineer',
    tool_name: 'file_edit',
    allowed: true,
    restriction_rules: 'Strict read-modify-write required',
    updated_at: '2026-07-25T08:00:00Z'
  },
  {
    id: 'ta-3',
    role: 'inspector',
    tool_name: 'run_command',
    allowed: false,
    restriction_rules: 'Default deny for shell execution',
    updated_at: '2026-07-25T08:00:00Z'
  },
  {
    id: 'ta-4',
    role: 'inspector',
    tool_name: 'validate_graph',
    allowed: true,
    restriction_rules: 'Read-only graph inspection endpoints',
    updated_at: '2026-07-25T08:00:00Z'
  }
];

export const INITIAL_CIRCUIT_BREAKER: CircuitBreakerConfig = {
  max_retries_per_model: 3,
  retry_delay_seconds: 5,
  max_fallbacks: 2,
  push_back_to_pending: true,
  circuit_breaker_retry_after: 30,
  status: 'CLOSED'
};
