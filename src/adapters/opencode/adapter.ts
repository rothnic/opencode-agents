import type {
  AdapterPromptParams,
  AdapterResponse,
  AdapterSession,
  AdapterSessionParams,
  AdapterStartParams,
  AgentAdapter,
  AgentMessage,
} from '../../core/adapter';
import {
  cleanupOpencode,
  createSession,
  type OpencodeInstance,
  promptAgent,
  startOpencode,
} from './client.js';

function assertOpencodeInstance(context: unknown): asserts context is OpencodeInstance {
  if (!context) {
    throw new Error('OpenCode adapter is not initialized. Did you call start()?');
  }
}

export function createOpencodeAdapter(): AgentAdapter {
  return {
    name: 'opencode',
    async start(_params: AdapterStartParams) {
      return startOpencode();
    },
    async createSession(context: unknown, params: AdapterSessionParams): Promise<AdapterSession> {
      assertOpencodeInstance(context);
      return createSession(context, params.agentName, params.task, params.environmentId);
    },
    async prompt(
      context: unknown,
      session: AdapterSession,
      params: AdapterPromptParams,
    ): Promise<AdapterResponse> {
      assertOpencodeInstance(context);
      const response = await promptAgent(context, session.id, params.task);
      const messages = normalizeParts(response.data?.parts);
      const info = (typeof response.data?.info === 'object' && response.data?.info) || undefined;
      return { messages, info, raw: response };
    },
    async cleanup(context: unknown, session?: AdapterSession) {
      await cleanupOpencode(context as OpencodeInstance | undefined, session?.id);
    },
  };
}

function normalizeParts(parts: unknown): AgentMessage[] {
  if (!Array.isArray(parts)) {
    return [];
  }
  return parts
    .filter(
      (part): part is { type: unknown; text?: unknown } =>
        typeof part === 'object' && part !== null,
    )
    .map<AgentMessage>(part => {
      const candidate = part as Record<string, unknown>;
      const type =
        typeof candidate['type'] === 'string' ? (candidate['type'] as string) : 'unknown';
      const text =
        typeof candidate['text'] === 'string' ? (candidate['text'] as string) : undefined;
      const metadata =
        typeof candidate['metadata'] === 'object' && candidate['metadata'] !== null
          ? (candidate['metadata'] as Record<string, unknown>)
          : undefined;
      return { type, text, metadata };
    });
}
