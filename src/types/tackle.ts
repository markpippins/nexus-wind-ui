export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'spring_ai' | 'lm_server' | 'codex' | 'opencode' | 'custom';
  endpoint_url?: string;
  api_key?: string;
  config_json?: Record<string, any>;
  created_at?: string;
}

export interface AIHarness {
  id: string;
  name: string;
  invocation_semantics?: {
    supports_streaming?: boolean;
    supports_function_calling?: boolean;
    supports_vision?: boolean;
    timeout_default_ms?: number;
    protocol?: string;
  };
  created_at?: string;
}

export interface AIModel {
  id: string;
  name: string;
  harness_id: string;
  provider_id?: string;
  model_identifier: string;
  verified?: boolean;
  created_at?: string;
}

export interface AIConfigBundle {
  id: string;
  name: string;
  role: string;
  model_id: string;
  provider_id?: string;
  harness_id?: string;
  priority: number;
  invocation_mode?: 'CLI' | 'HTTP' | 'SDK' | 'MCP' | 'INTERACTIVE';
  command?: string;
  endpoint_url?: string;
  timeout_ms?: number;
  valid_from?: string;
  valid_to?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AIRoleConfig {
  id: string;
  role: string;
  provider_id: string;
  harness_id: string;
  model_id: string;
  extra_params?: Record<string, any>;
  bundles?: AIConfigBundle[];
  created_at?: string;
}

export interface AgentSession {
  id: string;
  agent_role: string;
  pid: number;
  status: 'RUNNING' | 'ENDED' | 'KILLED' | 'FAILED';
  created_at: string;
  ended_at?: string;
  logs?: string[];
}

export interface SessionKillResult {
  killed: boolean;
  sessionId: string;
  pids: number[];
  errors?: string[];
  timestamp: string;
}

export interface ScheduledAgent {
  id: string;
  role: string;
  model_id?: string;
  harness?: string;
  agent_config?: Record<string, any>;
  schedule_type: 'cron' | 'interval' | 'manual';
  schedule_value: string;
  project_dir?: string;
  enabled: boolean;
  last_run_at?: string;
  next_run_at?: string;
}

export interface RoleMemoryProcedure {
  id: string;
  role: string;
  slug: string;
  title: string;
  body_md: string;
  tags: string[];
  version: number;
  as_of_dt: string;
}

export interface RoleCheckpoint {
  role: string;
  last_active: string;
}

export interface PromptTemplate {
  id: string;
  role: string;
  slug: string;
  version: number;
  body_md: string;
  parameter_schema?: Record<string, any>;
  tags?: string[];
  created_at: string;
}

export interface RoleTaskAssignment {
  id: string;
  role: string;
  prompt_id: string;
  prompt_slug?: string;
  task_name: string;
  description?: string;
  active: boolean;
  created_at: string;
}

export interface RoleToolAccess {
  id: string;
  role: string;
  tool_name: string;
  allowed: boolean;
  restriction_rules?: string;
  updated_at: string;
}

export interface CircuitBreakerConfig {
  max_retries_per_model: number;
  retry_delay_seconds: number;
  max_fallbacks: number;
  push_back_to_pending: boolean;
  circuit_breaker_retry_after: number;
  status?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export interface AIConfigValidation {
  valid: boolean;
  warnings: string[];
}

export interface TestInvocationResult {
  sessionId: string;
  model_id: string;
  status: 'SUCCESS' | 'FAILED';
  output_text: string;
  duration_ms: number;
}
