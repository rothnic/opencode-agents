import fs from 'node:fs';
import path from 'node:path';
import { evalite } from 'evalite';
import { executeAgent } from '../src/core/executor';
import { createVitestScorer } from '../src/evals/index';

/**
 * Hello World Benchmark
 *
 * Validates that the ContainerTaskExecutor agent can deliver a simple coding task while
 * following our Container Use policy and producing code that passes automated tests.
 */

const TARGET_FILE = path.resolve(process.cwd(), 'hello.js');
const TEST_FILE = 'tests/evals/hello-world.test.ts';

const TASK_PROMPT = [
  'You must follow all Container Use guardrails.',
  '- When isolation is requested, ALWAYS call environment_create MCP tool first to create an isolated container.',
  '- Use environment_file_write MCP tool to write files inside the environment.',
  '- Use environment_run_cmd MCP tool to execute commands inside the environment.',
  '- Report the environment ID when complete.',
  '',
  'Testing & Evaluation Strategy:',
  `- Your implementation will be validated by running "vitest run ${TEST_FILE}" after you finish.`,
  '- Do not modify anything under "tests/"—changing tests will fail the evaluation.',
  '- Export a named function hello(name) from hello.js that returns exactly "Hello, {name}!".',
  '',
  'Task: Create hello.js inside your Container Use environment with the hello(name) function.',
  'Use environment_file_write to save the file. Report the environment ID when done.',
].join('\n');

const vitestScorer = createVitestScorer({
  testFile: TEST_FILE,
  onComplete: async () => {
    if (fs.existsSync(TARGET_FILE)) {
      fs.unlinkSync(TARGET_FILE);
    }
  },
});

evalite('ContainerTaskExecutor: Hello World Function', {
  data: async () => [
    {
      input: {
        task: TASK_PROMPT,
        targetFile: 'hello.js',
        agent: 'container-task-executor',
      },
    },
  ],
  task: async (input: { task: string; targetFile: string; agent: string }) => {
    if (fs.existsSync(TARGET_FILE)) {
      fs.unlinkSync(TARGET_FILE);
    }

    console.log('[hello-world.eval] cwd:', process.cwd());

    const result = await executeAgent(input.agent, input.task, {
      output: input.targetFile,
      isolated: true,
      cleanup: false, // Keep environment for inspection
      timeout: 60, // Shorter timeout for fast failure
    });

    console.log('[hello-world.eval] agent success:', result.success);
    console.log('[hello-world.eval] environment ID:', result.environmentId);
    console.log('[hello-world.eval] agent output preview:', result.output?.slice(0, 80));
    if (result.errors?.length) {
      console.log('[hello-world.eval] agent errors:', result.errors);
    }

    let output = result.output ?? '';

    if (output.trim().length > 0) {
      fs.writeFileSync(TARGET_FILE, output, 'utf8');
    } else if (fs.existsSync(TARGET_FILE)) {
      output = fs.readFileSync(TARGET_FILE, 'utf8');
    }

    return output;
  },
  scorers: [vitestScorer],
});
