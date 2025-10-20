import { $ } from 'execa';

export async function listEnvironments(): Promise<string[]> {
  try {
    const result = await $`container-use list`;
    const lines = result.stdout
      .trim()
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
    const [first, ...rest] = lines;
    if (first && /^ID\s+TITLE/i.test(first)) {
      return rest;
    }
    return lines;
  } catch {
    return [];
  }
}

export async function findMostRecentEnv(): Promise<string | null> {
  const lines = await listEnvironments();
  if (lines.length === 0) {
    return null;
  }
  const first = lines[0];
  if (!first) {
    return null;
  }
  const cols = first.split(/\s{2,}/);
  return cols[0]?.trim() || null;
}

export async function envExists(envId: string): Promise<boolean> {
  try {
    const lines = await listEnvironments();
    return lines.some(line => line.startsWith(`${envId} `) || line === envId);
  } catch {
    return false;
  }
}

export async function checkoutEnv(envId: string): Promise<void> {
  await $`container-use checkout ${envId}`;
}

export async function readFileFromEnv(envId: string, filePath: string): Promise<string | null> {
  try {
    await checkoutEnv(envId);
    const { readFile } = await import('node:fs/promises');
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

export async function diffEnv(envId: string): Promise<string> {
  const result = await $`container-use diff ${envId}`;
  return result.stdout;
}

export async function logEnv(envId: string): Promise<string> {
  const result = await $`container-use log ${envId}`;
  return result.stdout;
}
