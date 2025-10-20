import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const OUTPUT_FILE = path.resolve(process.cwd(), 'hello.js');

async function loadHelloModule() {
  if (!existsSync(OUTPUT_FILE)) {
    throw new Error('hello.js was not created');
  }

  const moduleUrl = `${pathToFileURL(OUTPUT_FILE).href}?cache=${Date.now()}`;
  return import(moduleUrl);
}

describe('hello.js integration', () => {
  it('creates the hello.js artifact with source content', () => {
    expect(existsSync(OUTPUT_FILE)).toBe(true);

    const content = readFileSync(OUTPUT_FILE, 'utf8').trim();
    expect(content.length).toBeGreaterThan(0);
  });

  it('exports a hello function that returns greeting text', async () => {
    const module = await loadHelloModule();
    const hello = (module as { hello?: (name: string) => string }).hello;

    expect(typeof hello).toBe('function');
    expect(hello?.('World')).toBe('Hello, World!');
    expect(hello?.('Alice')).toBe('Hello, Alice!');
  });
});
