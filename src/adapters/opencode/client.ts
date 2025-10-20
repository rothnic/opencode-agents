import { createOpencode } from '@opencode-ai/sdk';

export type OpencodeInstance = Awaited<ReturnType<typeof createOpencode>>;

export interface SessionInfo {
  id: string;
}

export async function startOpencode(): Promise<OpencodeInstance> {
  return createOpencode();
}

export async function createSession(
  opencode: OpencodeInstance,
  agentName: string,
  task: string,
  environmentId: string,
): Promise<SessionInfo> {
  const res = await opencode.client.session.create({
    body: { title: `Eval: ${agentName} - ${task.substring(0, 50)} [env: ${environmentId}]` },
  });
  if (!res.data) throw new Error('Failed to create session');
  return { id: res.data.id };
}

export async function promptAgent(opencode: OpencodeInstance, sessionId: string, task: string) {
  const prompt = await opencode.client.session.prompt({
    path: { id: sessionId },
    body: { parts: [{ type: 'text', text: task }] },
  });
  if (!prompt.data) throw new Error('Failed to get agent response');
  return prompt;
}

export async function cleanupOpencode(opencode: OpencodeInstance | undefined, sessionId?: string) {
  if (!opencode) return;

  if (sessionId) {
    try {
      await opencode.client.session.delete({ path: { id: sessionId } });
    } catch {
      // ignore
    }
  }

  try {
    opencode.server.close();
  } catch {
    // ignore
  }
}
