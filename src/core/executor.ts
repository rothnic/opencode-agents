import { randomUUID } from 'node:crypto';
import { createOpencodeAdapter } from '../adapters/opencode/adapter.js';
import * as CU from '../integrations/container-use.js';
import type { AdapterSession, AgentAdapter, AgentMessage } from './adapter';
import { validateSyntax } from './utils/syntax';
import { sleep } from './utils/time';

export interface AgentResult {
  success: boolean;
  output: string;
  metrics: { tokenCount: number; executionTime: number; stepCount: number };
  syntaxValid: boolean;
  errors?: string[];
  environmentId?: string;
  adapter: string;
  /** @deprecated use `adapter` */
  framework?: string;
}

export interface ExecuteOptions {
  output?: string;
  language?: string;
  context?: Record<string, unknown>;
  timeout?: number; // seconds
  isolated?: boolean;
  cleanup?: boolean;
  /**
   * Override the default OpenCode implementation with a custom adapter.
   * Useful for side-by-side comparisons across runtimes without changing the evaluator.
   */
  adapter?: AgentAdapter;
  /**
   * @deprecated Use `adapter` instead. Kept temporarily for backward compatibility.
   */
  framework?: AgentAdapter;
}

const DEFAULT_TIMEOUT_SECONDS = 60;

export async function executeAgent(
  agentName: string,
  task: string,
  options: ExecuteOptions = {},
): Promise<AgentResult> {
  const startTime = performance.now();
  const plannedEnvId = `eval-${agentName}-${randomUUID().substring(0, 8)}`;

  const isolated = options.isolated !== false;
  const shouldCleanup = options.cleanup !== false;
  const adapter = options.adapter ?? options.framework ?? createOpencodeAdapter();

  let adapterContext: unknown;
  let session: AdapterSession | undefined;

  try {
    if (typeof adapter.start === 'function') {
      adapterContext = await adapter.start({
        agentName,
        task,
        environmentId: plannedEnvId,
        isolated,
        metadata: options.context,
      });
    }

    session = await adapter.createSession(adapterContext, {
      agentName,
      task,
      environmentId: plannedEnvId,
    });

    const response = await adapter.prompt(adapterContext, session, {
      task,
      metadata: options.context,
    });

    const messages = response.messages;
    const info = response.info;

    const environmentId = isolated
      ? await resolveEnvironmentId(messages, plannedEnvId, options.timeout)
      : undefined;

    const output = await collectOutput(messages, environmentId, options, isolated);

    const metrics = {
      tokenCount: extractTokenCount(info),
      executionTime: performance.now() - startTime,
      stepCount: countSteps(messages),
    };

    const syntaxValid = validateSyntax(output, options.language || 'javascript');

    return {
      success: true,
      output,
      metrics,
      syntaxValid,
      environmentId,
      adapter: adapter.name,
      framework: adapter.name,
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      metrics: { tokenCount: 0, executionTime: performance.now() - startTime, stepCount: 0 },
      syntaxValid: false,
      errors: [error instanceof Error ? error.message : String(error)],
      adapter: adapter.name,
      framework: adapter.name,
    };
  } finally {
    if (shouldCleanup && typeof adapter.cleanup === 'function') {
      try {
        await adapter.cleanup(adapterContext, session);
      } catch {
        // ignore cleanup failures to preserve primary error
      }
    }
  }
}

async function resolveEnvironmentId(
  messages: AgentMessage[],
  fallbackEnvId: string,
  timeoutSeconds = DEFAULT_TIMEOUT_SECONDS,
): Promise<string | undefined> {
  const initialEnvId = detectEnvironmentId(messages) ?? fallbackEnvId;
  if (!initialEnvId) return undefined;

  // Poll for environment with shorter timeout (max 10s) to fail fast
  const maxPollSeconds = Math.min(10, timeoutSeconds);
  const timeoutMs = maxPollSeconds * 1000;
  const start = Date.now();

  while (!(await CU.envExists(initialEnvId)) && Date.now() - start < timeoutMs) {
    await sleep(250);
  }

  if (!(await CU.envExists(initialEnvId))) {
    const recent = await CU.findMostRecentEnv();
    if (recent) return recent;

    // Fail fast if no environment was created
    throw new Error(
      'Container Use environment "' +
        initialEnvId +
        '" was not created. ' +
        'Agent may not have called environment_create or MCP may not be configured correctly.',
    );
  }

  return initialEnvId;
}

async function collectOutput(
  messages: AgentMessage[],
  environmentId: string | undefined,
  options: ExecuteOptions,
  isolated: boolean,
): Promise<string> {
  // Priority 1: Extract from Container Use environment if one was created
  if (isolated && environmentId && (await CU.envExists(environmentId)) && options.output) {
    const fileName = options.output.split('/').pop() || options.output;
    try {
      // First try reading directly from environment
      const envContent = await CU.readFileFromEnv(environmentId, fileName);
      if (envContent?.trim()) return envContent;

      // If that fails, try after checkout
      await CU.checkoutEnv(environmentId);
      const { readFile } = await import('node:fs/promises');
      const localContent = await readFile(options.output, 'utf-8');
      if (localContent.trim()) return localContent;
    } catch (error) {
      // Log but continue to fallback
      console.warn('[collectOutput] Failed to read from container environment:', error);
    }
  }

  // Priority 2: Check local file (for non-isolated or fallback)
  if (options.output) {
    try {
      const { readFile } = await import('node:fs/promises');
      const local = await readFile(options.output, 'utf-8');
      if (local.trim()) return local;
    } catch {
      // ignore missing local file
    }
  }

  // Priority 3: Extract code blocks from agent messages
  const output = messages
    .filter(part => part.type === 'text')
    .map(part => part.text || '')
    .join('\n\n')
    .trim();

  return output;
}

function detectEnvironmentId(messages: AgentMessage[]): string | undefined {
  for (const part of messages) {
    if (!part.text) continue;
    const match =
      part.text.match(/created environment[: ]+([\w-]+)/i) ||
      part.text.match(/environment id[: ]+([\w-]+)/i) ||
      part.text.match(/environment[: ]+([\w-]+)/i);
    if (match?.[1]) return match[1];
  }
  const fallback = messages.find(
    part => part.type === 'text' && part.text?.includes('environment'),
  )?.text;
  return fallback ?? undefined;
}

function countSteps(messages: AgentMessage[]): number {
  return messages.filter(part => part.type === 'step-finish').length;
}

function extractTokenCount(info?: Record<string, unknown>): number {
  if (!info) return 0;
  const tokens = info['tokens'];
  if (typeof tokens !== 'object' || tokens === null) {
    return 0;
  }
  const tokenInfo = tokens as Record<string, unknown>;
  const inputValue = tokenInfo['input'];
  const outputValue = tokenInfo['output'];
  const input = typeof inputValue === 'number' ? inputValue : undefined;
  const output = typeof outputValue === 'number' ? outputValue : undefined;
  if (input !== undefined && output !== undefined) {
    return input + output;
  }
  return 0;
}
