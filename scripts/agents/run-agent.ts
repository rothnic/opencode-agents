#!/usr/bin/env node
/**
 * Agent Test Harness
 *
 * Executes a coding agent with a given task and collects metrics.
 * Used for testing agent capabilities and measuring performance.
 *
 * Usage:
 *   node scripts/run-agent.js <agent-name> <task-description> [options]
 *
 * Example:
 *   node scripts/run-agent.js code-implementer "Create hello(name) function" --output src/hello.js
 *
 * Metrics Collected:
 *   - Token count (prompt + completion)
 *   - Execution time (milliseconds)
 *   - Step count (tool calls)
 *   - Success (boolean)
 */

import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// TYPES
// ============================================================================

interface Config {
  agents: {
    directory: string;
  };
  testing?: Record<string, unknown>;
  qualityGates?: Record<string, unknown>;
}

interface AgentSpec {
  agent: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

interface ExecutionOptions {
  output?: string;
  json?: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG_FILE = 'opencode.json';

// ============================================================================
// LOAD CONFIGURATION
// ============================================================================

function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error(`Configuration file not found: ${CONFIG_FILE}`);
  }

  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) as Config;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid configuration file: ${message}`);
  }
}

function loadAgentSpec(agentName: string): AgentSpec {
  const config = loadConfig();
  const agentFile = path.join(config.agents.directory, `${agentName}.md`);

  if (!fs.existsSync(agentFile)) {
    throw new Error(`Agent specification not found: ${agentFile}`);
  }

  const content = fs.readFileSync(agentFile, 'utf8');

  // Extract configuration from markdown (look for JSON config block)
  const configMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (!configMatch || !configMatch[1]) {
    // Return defaults if no config block found
    return {
      agent: agentName,
      model: 'gpt-4',
      temperature: 0.2,
      maxTokens: 2000,
      timeout: 30000,
    };
  }

  try {
    return JSON.parse(configMatch[1]) as AgentSpec;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid agent configuration JSON: ${message}`);
  }
}

// ============================================================================
// METRICS COLLECTION
// ============================================================================

class MetricsCollector {
  private startTime: number | null;
  private endTime: number | null;
  private tokenCount: number;
  private stepCount: number;
  private success: boolean;
  private error: string | null;

  constructor() {
    this.startTime = null;
    this.endTime = null;
    this.tokenCount = 0;
    this.stepCount = 0;
    this.success = false;
    this.error = null;
  }

  start(): void {
    this.startTime = Date.now();
  }

  end(success = true, error: string | null = null): void {
    this.endTime = Date.now();
    this.success = success;
    this.error = error;
  }

  addTokens(count: number): void {
    this.tokenCount += count;
  }

  incrementSteps(): void {
    this.stepCount++;
  }

  getExecutionTime(): number {
    if (!this.startTime || !this.endTime) {
      return 0;
    }
    return this.endTime - this.startTime;
  }

  toJSON() {
    const startTime = this.startTime ?? Date.now();
    return {
      tokenCount: this.tokenCount,
      stepCount: this.stepCount,
      executionTime: this.getExecutionTime(),
      successRate: this.success ? 1.0 : 0.0,
      timestamp: new Date(startTime).toISOString(),
      duration: `${(this.getExecutionTime() / 1000).toFixed(2)}s`,
      error: this.error,
    };
  }
}

// ============================================================================
// AGENT EXECUTION (SIMULATED FOR NOW)
// ============================================================================

/**
 * Execute an agent task
 *
 * For Phase 1.1, this is a simplified simulation since we don't have
 * full Copilot API integration yet. The actual implementation will:
 * 1. Load agent specification
 * 2. Construct prompt with task + agent constraints
 * 3. Call Copilot API
 * 4. Collect metrics from response
 * 5. Validate output
 *
 * @param {string} agentName - Name of agent to execute
 * @param {string} task - Task description
 * @param {object} options - Execution options
 * @returns {object} Execution result with metrics
 */
async function executeAgent(agentName: string, task: string, options: ExecutionOptions = {}) {
  const metrics = new MetricsCollector();
  metrics.start();

  try {
    // Load agent specification (validates agent exists)
    loadAgentSpec(agentName);
    console.log(`Executing agent: ${agentName}`);
    console.log(`Task: ${task}`);
    console.log(`Output: ${options.output || '(console)'}`);

    // For Phase 1.1: Simulate execution
    // This will be replaced with actual Copilot API calls in Phase 1.2+
    const result = await simulateAgentExecution(task, options);

    metrics.addTokens(result.tokens || 0);
    metrics.incrementSteps();

    // Validate output if file was created
    if (options.output && fs.existsSync(options.output)) {
      await validateOutput(options.output);
      metrics.incrementSteps();
    }

    metrics.end(true);

    return {
      success: true,
      output: result.output,
      file: options.output,
      metrics: metrics.toJSON(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    metrics.end(false, message);

    return {
      success: false,
      error: message,
      metrics: metrics.toJSON(),
    };
  }
}

/**
 * Simulate agent execution for Phase 1.1 baseline
 *
 * This creates the expected output based on the task description.
 * In later phases, this will be replaced with actual agent execution.
 */
async function simulateAgentExecution(task: string, options: ExecutionOptions) {
  // Simple pattern matching for Phase 1.1 hello world test
  if (task.toLowerCase().includes('hello') && task.includes('function')) {
    const code = `/**
 * Greets a person by name
 * @param {string} name - The name to greet
 * @returns {string} Greeting message
 */
function hello(name) {
  return \`Hello, \${name}!\`;
}

export { hello };
`;

    if (options.output) {
      // Create directory if needed
      const dir = path.dirname(options.output);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(options.output, code, 'utf8');
    }

    return {
      output: code,
      tokens: 150, // Simulated token count
    };
  }

  throw new Error('Task not recognized (simulation mode)');
}

/**
 * Validate generated code output
 */
async function validateOutput(filePath: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Output file not created: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Basic validation: file is not empty
  if (content.trim().length === 0) {
    throw new Error('Generated file is empty');
  }

  // For JavaScript files, check syntax
  if (filePath.endsWith('.js')) {
    try {
      // Try to parse as JavaScript
      const vm = await import('node:vm');
      new vm.Script(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Syntax error in generated code: ${message}`);
    }
  }

  console.log(`✓ Output validated: ${filePath}`);
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: CLI argument parsing is inherently sequential
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node scripts/run-agent.js <agent-name> <task> [options]');
    console.error('');
    console.error('Options:');
    console.error('  --output <file>    Output file path');
    console.error('  --json             Output metrics as JSON');
    console.error('');
    console.error('Example:');
    console.error(
      '  node scripts/run-agent.js code-implementer "Create hello function" --output src/hello.js',
    );
    process.exit(1);
  }

  const agentName = args[0];
  const task = args[1];

  if (!agentName || !task) {
    console.error('Error: agent-name and task are required');
    process.exit(1);
  }

  // Parse options
  const options: ExecutionOptions = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      options.output = args[i + 1];
      i++;
    } else if (args[i] === '--json') {
      options.json = true;
    }
  }

  try {
    const result = await executeAgent(agentName, task, options);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('');
      console.log('Result:', result.success ? '✓ SUCCESS' : '✗ FAILURE');
      if (result.file) {
        console.log('File:', result.file);
      }
      console.log('');
      console.log('Metrics:');
      console.log(`  Tokens: ${result.metrics.tokenCount}`);
      console.log(`  Steps: ${result.metrics.stepCount}`);
      console.log(`  Time: ${result.metrics.duration}`);
      console.log(`  Success: ${result.metrics.successRate * 100}%`);

      if (result.error) {
        console.log('');
        console.error('Error:', result.error);
      }
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Fatal error:', message);
    process.exit(1);
  }
}

// ============================================================================
// EXPORTS (for testing)
// ============================================================================

export { loadConfig, loadAgentSpec, executeAgent, validateOutput, MetricsCollector };

// Run if called directly (ESM check)
const isMain =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith(process.argv[1]));
if (isMain) {
  main();
}
