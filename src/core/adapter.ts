export interface AdapterStartParams {
  agentName: string;
  task: string;
  environmentId: string;
  isolated: boolean;
  metadata?: Record<string, unknown>;
}

export interface AdapterSessionParams {
  agentName: string;
  task: string;
  environmentId: string;
}

export interface AdapterPromptParams {
  task: string;
  metadata?: Record<string, unknown>;
}

export interface AdapterSession {
  id: string;
  data?: Record<string, unknown>;
}

export interface AgentMessage {
  type: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

export interface AdapterResponse {
  messages: AgentMessage[];
  info?: Record<string, unknown>;
  raw?: unknown;
}

export interface AgentAdapter {
  readonly name: string;
  start?(params: AdapterStartParams): Promise<unknown>;
  createSession(context: unknown, params: AdapterSessionParams): Promise<AdapterSession>;
  prompt(
    context: unknown,
    session: AdapterSession,
    params: AdapterPromptParams,
  ): Promise<AdapterResponse>;
  cleanup?(context: unknown, session?: AdapterSession): Promise<void>;
}
