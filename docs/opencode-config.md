
Mastering opencode: A Comprehensive Guide to Configuration and Customization for the Expert Developer

I. Foundational Configuration: The opencode.json Manifest

The core of opencode's adaptability lies in its configuration system, which is architected not merely as a list of settings, but as a declarative manifest for defining an agent's complete operational environment. This "Configuration as Code" approach enables development teams to version control, review, and standardize AI agent behavior with the same rigor applied to application code. For the expert user, mastering this system is the first step toward unlocking the tool's full potential in complex, team-based development environments.

Establishing Project and Global Scopes: Precedence and Inheritance

opencode employs a hierarchical configuration system that allows for the layering of settings, providing a clear and predictable method for managing personal, team, and project-specific configurations. The order of precedence is strictly defined, ensuring that the most specific configuration is always applied 1:
Environment Variable: The OPENCODE_CONFIG environment variable allows specifying a custom configuration file path, which overrides all other locations. This is the highest level of precedence, useful for CI/CD environments or temporary overrides.
Project-Level Configuration: opencode searches for an opencode.json or opencode.jsonc file in the current directory and traverses upwards to the nearest Git directory root. This discovery mechanism makes it the ideal location for team-shared, version-controlled settings that define project standards.1 Committing this file to the project repository ensures that every team member, and any automation, operates with a consistent agent configuration.3
Global Configuration: A global configuration file located at ~/.config/opencode/opencode.json serves as the base layer. This file is intended for user-specific preferences that should apply across all projects, such as UI themes, personal keybinds, or a preferred default model for general-purpose tasks.1 This clear separation between personal and project scopes is a fundamental design pattern for maintaining consistency without sacrificing individual developer ergonomics.

Core Schema Breakdown and Practical Application

The configuration file supports both standard JSON and JSON with Comments (JSONC), a developer-friendly feature that encourages the documentation of complex setups directly within the file.1 Furthermore, opencode provides an official schema, which can be referenced in the configuration file ("$schema": "<https://opencode.ai/config.json>"). This enables validation and intelligent autocompletion in modern code editors, a critical feature for reducing errors and improving the developer experience when managing a large number of settings.1
The schema is logically organized into several key areas:
UI/UX Settings: These options, typically placed in the global configuration, tailor the user interface. They include tui settings like scroll_speed, the overall theme, and custom keybinds to match a user's preferred workflow.1
Operational Settings: These govern the tool's core behavior. autoupdate controls whether opencode automatically downloads new versions, a feature that might be disabled in controlled enterprise environments to ensure stability.1 The sharing option can be configured to manual (default), auto, or disabled, providing granular control over session privacy and collaboration.1
Code Quality Settings: The formatter block is essential for integrating opencode into projects with established coding standards. It allows for disabling built-in formatters like Prettier or, more powerfully, defining custom formatters. A custom formatter can specify a precise command to execute (e.g., pointing to a project's local node_modules binary), set environment variables, and target specific file extensions. This ensures that any code generated or modified by the agent adheres perfectly to the project's existing linting and formatting pipeline.1

Dynamic Configuration: Variables and File Content Injection

opencode's configuration system is not static; it supports dynamic value injection, a powerful feature for creating flexible and secure configurations.
Environment Variables: Using the {env:VARIABLE_NAME} syntax, configuration values can be substituted with environment variables at runtime.1 This is the standard and most secure method for handling sensitive information, such as API keys (though the opencode auth flow is the recommended approach for credentials), or for dynamically altering behavior based on the execution environment (e.g., switching model endpoints between staging and production).
File Content Injection: The {file:./path/to/file.txt} syntax allows the contents of an external file to be injected directly into a configuration value.4 This is particularly useful for managing complex system prompts or multi-line instructions, keeping the primary JSONC file clean, readable, and focused on structure while the detailed content resides in more appropriate text or Markdown files.

Realistic Example: A Team-Standard opencode.jsonc for a Monorepo

The following example demonstrates a project-level opencode.jsonc file designed for a large TypeScript monorepo. It enforces team standards for models, permissions, code formatting, and contextual knowledge, showcasing the practical application of the configuration system's advanced features.

Code snippet

//.opencode.jsonc in the monorepo root
{
  "$schema": "<https://opencode.ai/config.json>",

  // Enforce a specific, powerful model for development tasks to ensure consistency
  // and leverage a smaller model for simple tasks to control costs.
  "model": "anthropic/claude-3-5-sonnet-20241022",
  "small_model": "anthropic/claude-3-haiku-20240307",

  // Establish a baseline security posture. Require user confirmation for any shell command.
  "permission": {
    "bash": "ask"
  },

  // Configure a custom formatter to use the project's specific Prettier version,
  // ensuring code generated by the agent matches team standards perfectly.
  "formatter": {
    "prettier": { "disabled": true },
    "custom-prettier": {
      "command": ["./node_modules/.bin/prettier", "--write", "$FILE"],
      "extensions": [".js", ".ts", ".jsx", ".tsx", ".json", ".md"]
    }
  },

  // Load all relevant contribution guidelines and coding standards to provide the agent
  // with deep, project-specific context. Glob patterns are used for scalability.
  "instructions":
}

This configuration manifest demonstrates a mature approach to managing an AI coding assistant within a team. It centralizes critical decisions, automates adherence to project standards, and leverages modularity to keep the configuration maintainable as the project grows.1

II. Managing Intelligence: Providers and Models

The "brain" of opencode—the Large Language Model (LLM)—is treated not as a fixed dependency but as a swappable component. This provider-agnostic philosophy is a strategic architectural decision that future-proofs the tool against a rapidly evolving LLM market. It empowers expert users to prevent vendor lock-in and select the optimal model for any given task based on criteria such as performance, cost, speed, or data privacy requirements.

Connecting to the LLM Ecosystem: opencode auth login

The primary interface for managing LLM provider credentials is the opencode auth login command.7 This interactive CLI flow provides a secure mechanism for adding API keys for various providers. The credentials are encrypted and stored locally in ~/.local/share/opencode/auth.json, correctly abstracting sensitive tokens from version-controlled configuration files.8
opencode's expansive connectivity is powered by its integration with Models.dev, which provides support for over 75 LLM providers.9 This breadth of choice is a significant advantage for developers who wish to experiment with or productionize a wide array of models. The supported providers range from industry giants like OpenAI, Google, and Microsoft Azure to specialized services like Groq for low-latency inference, DeepSeek for advanced reasoning, and aggregators like OpenRouter.7 For users new to the ecosystem, opencode recommends its own curated service, OpenCode Zen, as a simplified starting point.7

Configuring Commercial vs. Local Models

The configuration process varies between cloud-based commercial providers and locally-hosted models, with opencode providing robust support for both paradigms.
Commercial Providers: Integrating with enterprise-grade services like Azure OpenAI often requires more than a single API key. For Azure, the configuration necessitates setting the AZURE_RESOURCE_NAME as an environment variable (or in a .env file). Critically, the model deployment name within Azure must exactly match the model name used in the opencode configuration for the connection to succeed.7 These provider-specific details highlight the importance of consulting the documentation for each integration.
Local Models: A key feature for privacy-conscious developers or those working in offline environments is the ability to connect to local LLMs served by tools like Ollama or LM Studio. opencode achieves this by supporting any OpenAI-compatible API endpoint. This is configured directly in opencode.json by defining a custom provider. The essential fields for this configuration are npm (which should be set to @ai-sdk/openai-compatible), a display name, the options.baseURL pointing to the local server's endpoint (e.g., <http://localhost:11434/v1>), and a models map that defines the available local models.7 This capability transforms opencode into a powerful client for locally fine-tuned or specialized models.

Strategic Model Selection

opencode provides multiple mechanisms for selecting the active model, allowing for both persistent defaults and on-the-fly adjustments:
The --model (or -m) command-line flag offers the highest level of precedence, overriding all other settings for a single command execution.9
Within the Text User Interface (TUI), the /models command brings up an interactive selector to switch models during a session.7
The model property in opencode.json sets the default model for a project or for the user globally.1
A particularly sophisticated feature for cost and performance optimization is the small_model configuration option.1 This allows the user to designate a secondary, typically smaller and less expensive model (such as Claude 3 Haiku or a local Llama 3 instance) for lightweight, low-stakes tasks like generating session titles or summarizing conversations. opencode will automatically offload these tasks to the small_model if one is configured, reserving the more powerful and costly primary model for complex code generation and reasoning. This demonstrates a nuanced understanding of LLM usage patterns and provides a built-in mechanism for resource optimization.

Realistic Example: A Hybrid Configuration with Azure and Ollama

This example illustrates a global opencode.jsonc for a developer who uses a powerful corporate Azure model for primary work but leverages a local Ollama instance for speed, cost savings on simple tasks, and offline capability.

Code snippet

// ~/.config/opencode/opencode.jsonc
{
  "$schema": "<https://opencode.ai/config.json>",

  // Default to the powerful, company-provided Azure model for complex development.
  // The API key is stored via `opencode auth login` and the resource name via an env var.
  "model": "azure/gpt-4o-enterprise",

  // Use a fast, local Llama 3 model for non-critical tasks like title generation.
  "small_model": "ollama/llama3:8b",

  // Define the custom provider configuration for the local Ollama server.
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama (Local)",
      "options": {
        "baseURL": "<http://localhost:11434/v1>"
      },
      "models": {
        "llama3:8b": { "name": "Llama 3 8B Instruct" },
        "codegemma:7b": { "name": "CodeGemma 7B" }
      }
    }
  }
}

With this setup, the developer's default agent uses the high-capability Azure model. However, when a session title needs to be generated, opencode transparently uses the local llama3:8b model. The developer can also manually switch to the codegemma:7b model using the /models command when working on a flight or handling sensitive code that cannot leave their machine.

III. The Core Abstraction: Architecting Custom Agents

Agents are the central organizing principle for behavior and capability within opencode. They represent a significant evolution from simple custom prompts or "modes," a concept that is now deprecated in favor of this more powerful agent abstraction.5 An agent is a specialized AI persona, equipped with its own distinct system prompt, model, toolset, and permissions. Understanding how to architect and orchestrate these agents is the key to transforming opencode from a conversational assistant into a sophisticated engine for automating complex, multi-step development workflows.

Primary vs. Subagents: Orchestrating Workflows

opencode defines two fundamental types of agents that work in concert to manage tasks:
Primary Agents: These are the main conversational agents that manage the top-level user interaction within a session. The user can cycle through available primary agents using the Tab key.4 opencode ships with two built-in primary agents that exemplify this concept: Build, which has full access to all tools for active development, and Plan, a read-only agent designed for strategizing and reviewing code without making modifications.4
Subagents: These are specialized, task-oriented agents that are invoked to handle specific sub-problems. A primary agent can delegate a task to a subagent in two ways: automatically, based on a match between the user's request and the subagent's description, or manually, when the user explicitly invokes the subagent using an @mention (e.g., @security-auditor review this file).4
When a subagent is invoked, it creates a dedicated child session. This is a critical architectural feature that provides task and context isolation. The specialized work of the subagent—such as performing a security audit or writing documentation—occurs in its own context, preventing its specific instructions and conversation history from "polluting" the main development context of the parent session. The user can seamlessly navigate between the parent session and any child sessions using Ctrl+Right and Ctrl+Left, allowing for easy monitoring and interaction with parallel tasks.4 This parent-child session model enables a structured, hierarchical approach to problem-solving.

Creating Specialized Agents: JSON vs. Markdown

opencode provides two declarative methods for defining custom agents, along with an interactive CLI helper.
The opencode agent create command provides a guided, interactive experience for scaffolding a new agent. It prompts the user for the agent's description, tool access, and other properties, then generates the corresponding configuration file, typically as a Markdown file.8
JSON Configuration: Agents can be defined directly within the agent key in an opencode.json file. This method is suitable for defining a small number of relatively simple agents that are tightly coupled with a project's overall configuration.4
Markdown Configuration: This is the preferred and more powerful method for defining complex agents. Agent definition files are placed in either a global (~/.config/opencode/agent/) or project-specific (.opencode/agent/) directory.4 This approach elegantly separates the agent's configuration metadata (defined in a YAML frontmatter block) from its core identity—the detailed system prompt (contained in the Markdown body). This separation of concerns is a superior design pattern that promotes readability and maintainability.

In-Depth Agent Properties

A rich set of properties allows for the fine-tuning of each agent's behavior:
description (Required): A concise string explaining the agent's purpose. This is not just for human reference; it is critically used by primary agents to determine when to automatically delegate a task to this subagent.4
mode: Defines the agent's role. It can be set to primary, subagent, or all (the default, allowing it to function as both).4
model: Allows overriding the global or project-default model. This is essential for assigning highly specialized models to specific tasks—for instance, using a model fine-tuned for security analysis exclusively for a security auditor agent.4
temperature: Controls the randomness of the LLM's output, with values typically ranging from 0.0 to 1.0. A low temperature (e.g., 0.1) is ideal for deterministic, analytical tasks like code review, while a higher temperature (e.g., 0.8) is better for creative tasks like brainstorming.4
prompt: In JSON, this can reference an external file using the {file:...} syntax. In Markdown files, the body of the document itself serves as the system prompt, which is a more natural and expressive way to define the agent's core instructions.4
tools & permission: These objects provide granular control over the agent's capabilities, allowing per-agent overrides of global tool and permission settings.4

Realistic Example: A "SecurityAuditor" Subagent

This realistic example showcases a subagent designed for a single, critical task: analyzing code for security vulnerabilities. It is intentionally sandboxed, with its ability to modify the file system or execute commands completely disabled.
File: ~/.config/opencode/agent/security-auditor.md

description: "Performs a security audit on code files, checking for common vulnerabilities like XSS, SQL injection, and insecure configurations. Does not modify code." mode: subagent model: "anthropic/claude-3-5-sonnet-20241022" temperature: 0.1 permission: edit: "deny" write: "deny" bash: "deny" webfetch: "allow" # Allow it to fetch documentation on vulnerabilities.

You are an expert security auditor. Your sole purpose is to review the provided code for security vulnerabilities.
Your analysis should be rigorous and detailed. Reference CWEs (Common Weakness Enumeration) where applicable.
You must not suggest any code changes directly. Instead, provide a detailed report of your findings, including the vulnerability type, location (file and line number), potential impact, and recommended mitigation strategies.
You are permitted to use the webfetch tool to look up the latest security advisories or documentation related to libraries used in the code.
Invocation: Within the opencode TUI, a developer would delegate a task to this agent by typing: @security-auditor Please review the authentication logic in src/auth/service.ts. This action would create a new child session dedicated to the security audit, using the specialized prompt and restricted permissions defined above. The main Build agent's context remains clean and ready for the next development task. This composition of specialized agents into a larger workflow is a clear demonstration of how opencode facilitates advanced, structured AI-assisted development.

IV. Defining Capabilities: Tools and Permissions

An agent's ability to interact with the world beyond conversation is defined by its tools. These are the agent's "hands," allowing it to read and write files, execute commands, and access information from the web. For any expert developer, granting such powerful capabilities to an AI requires an equally powerful and granular security model. opencode's permission system is a critical feature that provides this control, enabling the safe and supervised use of tools by establishing a framework based on the principle of least privilege.

Overview of Built-in Tools

opencode comes equipped with a comprehensive set of built-in tools that cover the vast majority of common development tasks 10:
File System Operations: write (create/overwrite files), edit (perform string replacements in existing files), read (view file contents, including specific line ranges), patch (apply diffs), grep (search file content with regex), glob (find files by pattern), and list (list directory contents). This suite provides complete read/write access to the project's codebase.
Code Execution: The bash tool is the most powerful and potentially riskiest, as it allows the agent to execute arbitrary shell commands within the project's environment. This can be used for tasks like installing dependencies (npm install), checking version control status (git status), or running test suites.
Information Gathering: The webfetch tool grants the agent the ability to retrieve content from public web pages, which is invaluable for looking up documentation, researching error messages, or finding examples.
Internal Task Management: The todoread and todowrite tools are used by the agent to manage its own internal checklist for complex, multi-step operations. Observing the agent's use of these tools can provide valuable insight into its planning and execution process.

The Permission Model: allow, ask, deny

opencode implements a flexible, three-tiered permission system that can be configured globally in opencode.json or, more powerfully, on a per-agent basis.4 This system provides nuanced control over every tool.
allow: The agent can use the tool autonomously without any user intervention. This is suitable for safe, read-only operations like read or grep.
ask: This is the crucial "human-in-the-loop" setting. When an agent attempts to use a tool configured with ask, the TUI will present a confirmation dialog to the user, showing the exact action to be performed. The user must explicitly approve the action before it is executed. This is the recommended setting for any potentially destructive or sensitive operation, such as write, edit, or bash.
deny: The agent is completely prohibited from using the tool. Any attempt by the agent to call a denied tool will fail.

Implementing Granular Control

The power of this permission model lies in its granularity and hierarchical application. Agent-specific tool and permission configurations always override the global settings defined in the root of opencode.json.10 This allows a security-conscious developer to establish a highly restrictive global baseline (e.g., denying bash and write for all agents) and then selectively enable specific capabilities only for specialized agents that absolutely require them.
This granularity extends even to the bash tool itself. The permission system supports defining rules for specific shell commands using glob patterns.4 This is an extremely powerful feature for fine-grained security. For example, a configuration could allow an agent to run safe commands like ls or git status, ask for confirmation before running any other git *command, and explicitly deny dangerous commands like rm -rf*. This level of control allows developers to build powerful automations while establishing robust safety rails against unintended actions.

Realistic Example: A "DocsWriter" Agent Configuration

This example defines an agent specialized in writing and updating project documentation. Its permissions are carefully crafted to give it the capabilities it needs while preventing it from affecting application code or executing arbitrary commands.

Code snippet

// In opencode.json
"agent": {
  "docswriter": {
    "description": "An agent specialized in writing and updating Markdown documentation. Can read project files and search the web for context.",
    "mode": "subagent",
    "permission": {
      // Allow tools for information gathering.
      "webfetch": "allow",
      "read": "allow",
      "grep": "allow",
      "glob": "allow",

      // Require confirmation before creating or overwriting documentation files.
      "write": "ask",

      // Explicitly deny capabilities that could affect application code or system state.
      "edit": "deny",
      "bash": "deny"
    }
  }
}

This configuration creates a sandboxed environment for the docswriter agent. It can freely read project files to understand the code it is documenting and fetch external resources, but it cannot modify existing code, run any shell commands, or even write a new file without explicit user approval. This is a practical application of the principle of least privilege, demonstrating how opencode's security framework enables the creation of safe, reliable, and specialized AI assistants.

V. Providing Context: The AGENTS.md System

The quality of a Large Language Model's output is directly proportional to the quality of the context it is given. The AGENTS.md system is opencode's primary mechanism for providing deep, persistent, and project-specific context to the AI agent. It is analogous to systems like CLAUDE.md in other tools and serves as the foundational knowledge base that tailors the agent's behavior to a specific codebase's architecture, style guides, and constraints.6 For an expert developer, mastering this system is essential for elevating the agent from a generic coder to a true project-aware collaborator.

Bootstrapping Context with /init

To simplify the process of creating this contextual foundation, opencode provides the /init command. When executed within a project directory, this command scans the project's contents to gain a high-level understanding of its structure, languages, and dependencies. It then generates an initial AGENTS.md file in the project root, pre-populated with a summary of its findings.3 This generated file serves as an excellent starting point for further customization. It is strongly recommended that the AGENTS.md file be committed to the project's version control system, ensuring that the entire team—and any CI/CD automation—works from the same set of contextual instructions.3

Structuring Project Knowledge

The AGENTS.md system supports both global and project-specific scopes. A global file at ~/.config/opencode/AGENTS.md can be used for personal rules and preferences that should apply to all sessions (e.g., "Always use functional programming paradigms in JavaScript"). The project-specific AGENTS.md file, however, is where team-wide rules and project knowledge should reside.6
The content of this file should go beyond simple prompts. It should be a comprehensive guide for the AI, containing:
High-Level Architectural Overviews: "This is a microservices application. The auth-service handles user authentication, while the order-service manages purchases. All inter-service communication must happen via the message queue, never direct HTTP calls."
Coding Style and Pattern Enforcement: "All new React components must follow the Atomic Design methodology. Atoms are located in src/components/atoms. Do not create stateful atoms."
Constraints and "Third Rails": "CRITICAL: The legacy BillingEngine class is deprecated and must not be modified. All new billing logic should be implemented in the NewBillingService."

Modularizing Instructions via References

A single, monolithic AGENTS.md file can become unwieldy in large projects. Recognizing this, opencode provides two powerful mechanisms for modularizing contextual instructions, allowing teams to reuse existing documentation and maintain a clean, organized knowledge base.
opencode.json instructions Array: This is the recommended and most robust approach. The instructions key in the opencode.json file accepts an array of file paths and glob patterns.1 opencode will automatically load the content of these files and include them in the agent's context. This allows teams to directly reference existing, human-maintained documentation like CONTRIBUTING.md, architectural decision records, or testing guidelines without duplicating content.
Manual @ References in AGENTS.md: Within the AGENTS.md file itself, it is possible to reference other files using the syntax @path/to/file.md.6 The agent is specifically instructed to treat these references as pointers and to use its read tool to load their content on a "need-to-know basis." This lazy-loading approach is highly efficient, as it prevents the context window from being flooded with irrelevant information, loading detailed guidelines only when the current task requires them.6
These modularization features create a powerful feedback loop: well-structured, up-to-date documentation becomes essential not just for human developers but as a direct input for improving the AI's performance. This, in turn, incentivizes teams to treat their documentation as a first-class, machine-readable asset.

Schema-first validation (recommended)
------------------------------------

When configuration or project-provided JSON is consumed at runtime, prefer a small, explicit schema and parser to ad-hoc casting. We recommend using Zod to define schemas, parse runtime JSON, and export TypeScript types. This has several benefits:

- Fail-fast parsing with clear error messages instead of scattered runtime exceptions.
- A single source of truth for the expected shape of configuration objects (used across scripts and validators).
- Generated TypeScript types reduce noisy casts and make refactors safer.

Suggested workflow:

1. Add a lightweight schema file, e.g. `scripts/schemas/conventions-schema.ts`, that defines the Zod schema for the parts of `.opencode/conventions.json` you rely on.
2. Export both the parsed types (via `z.infer<typeof Schema>`) and a small helper `parseConventionsFromFile()` that validates and returns the typed object.
3. Import the parser in validators (e.g. `scripts/validation/docs-conventions.ts`) and narrow dynamic JSON to the schema-derived types.

If adding Zod as a dependency is not acceptable for your environment, keep the same pattern but implement a minimal runtime parser that performs the same narrow validation and returns well-typed objects (see `scripts/schemas/conventions-schema.ts` for an example).

Realistic Example: AGENTS.md for a Legacy Codebase

This example demonstrates how AGENTS.md can be used to guide an agent working on a sensitive refactoring project within a legacy application. It sets clear boundaries and points the agent to critical documentation.
File: AGENTS.md

Project Rules for the Phoenix Refactor

You are assisting in refactoring a legacy Java monolith. Your primary goal is to modernize the code while maintaining 100% backward compatibility.

Core Principles

CRITICAL: Do NOT introduce new public APIs without explicit instruction from the user.
All new code must have complete unit test coverage using JUnit 5.
Adhere strictly to the coding standards defined in @docs/java-style-guide.md.
Interacting with the Legacy BillingModule
The BillingModule is a critical and fragile part of the system.
DO NOT EDIT FILES in the com.legacy.billing package directly.
Instead, you must use the Strangler Fig pattern. Create new services in the com.new.billing package that wrap the old functionality.
Refer to the architectural diagram for this pattern, which you can read here: @docs/strangler-pattern-billing.png
All interactions with the legacy database must go through the LegacyBillingRepository facade. Do not write raw SQL queries.
This set of instructions effectively transforms the agent into a specialist for this specific, high-stakes task. It leverages both direct rules and references to external documentation and diagrams to ensure the agent operates safely and correctly within the complex constraints of the legacy system.

VI. Advanced Customization and Extensibility

Beyond configuration, opencode offers a tiered system of programmatic extensibility that allows developers to teach the agent new skills, automate complex workflows, and integrate it deeply with external systems and bespoke development processes. This graduated model provides a clear path from simple prompt automation to sophisticated, event-driven integrations, empowering users to tailor the tool to their exact needs. Choosing the right method for a given task is key to leveraging this system effectively.

Comparison of Customization Methods

To help the expert user select the appropriate tool for the job, the following table compares the primary customization methods based on their intended use case, complexity, and security implications.
Method
Primary Use Case
Complexity
Language
Scope
Security Consideration
AGENTS.md
Providing static context, rules, and architectural guidelines.
Low
Markdown
Project/Global
Low. Provides read-only context to the LLM.
Custom Commands
Automating repetitive prompts and simple, chained shell workflows.
Low-Medium
Markdown/JSON
Project/Global
Medium. Can execute shell commands (!shell), which should be carefully managed.
Custom Tools
Integrating external APIs, performing complex logic, structured data I/O.
Medium-High
TypeScript/JS
Project/Global
High. Executes arbitrary code. Requires careful implementation and dependency management.
Plugins
Hooking into opencode's core events, modifying default behavior deeply.
High
TypeScript/JS
Project/Global
Very High. Can intercept and modify core operations. For advanced users only.

This framework clarifies that simple, repetitive prompts are best encapsulated as Custom Commands. When a task requires external data, structured I/O, or complex logic, a Custom Tool is the appropriate choice. For deep, systemic modifications to opencode's behavior, Plugins provide the necessary power.

Part A: Workflow Automation with Custom Commands

Custom commands are powerful shortcuts for complex or frequently used prompts. They are defined either within the command key of opencode.json or, more flexibly, as individual Markdown files in a project-specific (.opencode/command/) or global (~/.config/opencode/command/) directory.11 The filename of a Markdown file becomes the command name (e.g., refactor.md creates the /refactor command), making them easy to create and discover.11
Commands are not limited to static text. They support several dynamic features that allow them to interact with the user and the environment 11:
$ARGUMENTS: This placeholder is replaced by any text the user provides after the command name, allowing for parameterized prompts.
@file/path: This directive injects the entire content of a specified file directly into the prompt, perfect for asking the agent to act on a specific piece of code.
!shell command: This powerful directive executes a shell command and injects its standard output into the prompt. This can be used to provide dynamic, real-time context, such as the output of a test runner, a git log, or a dependency analysis tool.
Furthermore, commands can be configured to run with a specific agent and can be forced to execute as a subtask, which creates a new child session to keep the main conversation context clean.11

Realistic Example: A /test Command

This command automates the process of running tests for a specific file, capturing the output, and asking the agent to analyze any failures.
File: .opencode/command/test.md

description: "Runs the test suite for a given file and asks the agent to analyze the results." agent: build subtask: true

I am running the test suite for the file located at @$ARGUMENTS.
Here is the output from the test runner:
!pnpm test $ARGUMENTS
Please analyze the test results above. If there are any failures, identify the root cause and suggest specific code changes to fix them.

Invocation: /test src/utils/parser.test.ts

Part B: Programmatic Extension with Custom Tools

When a task requires more than prompt automation—such as interacting with an external API, processing data, or performing complex calculations—a custom tool is the solution. Custom tools are TypeScript or JavaScript functions that the LLM can discover and call during a conversation, just like the built-in tools. They are defined in files located in .opencode/tool/ (project) or ~/.config/opencode/tool/ (global).12
The structure of a tool is defined using the tool() helper from the @opencode-ai/plugin package. This provides a type-safe and validated way to create tools with three key components 12:
description: A clear, natural language description of what the tool does. This is critical, as the LLM uses this description to decide when the tool is appropriate to use.
args: A schema defining the arguments the tool accepts. This schema is built using tool.schema, which is an instance of Zod, allowing for rich validation and type safety.
execute: An async function containing the tool's implementation logic. It receives the parsed arguments and returns a result to the LLM.
A single file can export multiple tools using named exports. The final tool name is automatically generated by combining the filename and the export name (e.g., an add export in math.ts becomes the math_add tool).12

Realistic Example: A jira_ticket Tool

This tool allows the agent to fetch details about a Jira ticket directly from the Jira API, providing it with the necessary context to work on a development task.
File: .opencode/tool/jira.ts
TypeScript
import { tool } from "@opencode-ai/plugin";
import JiraApi from "jira-client"; // Assumes jira-client is a project dependency

// Initialize Jira client. Credentials should be securely managed via environment variables.
const jira = new JiraApi({
  protocol: 'https',
  host: 'mycompany.atlassian.net',
  username: process.env.JIRA_USER,
  password: process.env.JIRA_API_TOKEN,
  apiVersion: '2',
  strictSSL: true
});

export default tool({
  description: "Fetches details for a given Jira ticket ID, including its summary, description, and acceptance criteria.",
  args: {
    ticketId: tool.schema.string().describe("The Jira ticket ID, e.g., 'PROJ-123'"),
  },
  async execute(args) {
    try {
      const issue = await jira.findIssue(args.ticketId);
      const { summary, description, customfield_10011 } = issue.fields; // customfield_10011 is 'Acceptance Criteria'
      return JSON.stringify({
        summary,
        description,
        acceptanceCriteria: customfield_10011
      });
    } catch (error) {
      return `Error fetching Jira ticket ${args.ticketId}: ${error.message}`;
    }
  },
});

Part C: Deep Integration with Plugins

Plugins represent the deepest level of extensibility, allowing developers to hook into opencode's core event lifecycle to modify or augment its default behavior. They are defined as JavaScript or TypeScript files in the .opencode/plugin/ directory.14
A plugin is an async function that returns an object of hook implementations. The plugin function receives a rich context object, including a client (a full opencode SDK instance for programmatic control) and $ (Bun's shell API for executing commands).14
Available hooks allow plugins to react to a wide range of events, such as event (for lifecycle events like session.idle) or, more powerfully, "tool.execute.before", which can intercept a tool call before it runs, allowing for validation, modification, or cancellation.14

Realistic Example: A Plugin for.env Protection

This plugin provides a critical security backstop by intercepting any attempt by the agent to use the read tool on a .env file, preventing accidental exposure of secrets.
File: .opencode/plugin/env-protection.js
JavaScript
export const EnvProtection = async ({ project, client, $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      // Check if the tool being called is 'read' and if the target path includes '.env'
      if (input.tool === "read" && output.args.filePath.includes(".env")) {
        // Throw an error to block the tool's execution and notify the user.
        throw new Error("SECURITY ALERT: Reading.env files is prohibited by the EnvProtection plugin.");
      }
    },
  };
};

VII. Programmatic Control and Integration

The ultimate form of mastery over any developer tool is the ability to script and control it programmatically. opencode is architected from the ground up to support this, moving beyond the paradigm of a simple interactive tool to become an extensible platform for building AI-powered development automation. Its client-server architecture is the key enabler of this capability, allowing opencode to be integrated into CI/CD pipelines, custom scripts, and even alternative user interfaces.

The opencode Server Architecture

Under the hood, opencode operates on a robust client-server model. When a user runs the opencode command to launch the TUI, two processes are started: the TUI itself, which acts as a client, and a background server process that handles all the core logic, including communication with LLM providers, file system operations, and agent management.15 This decoupling of the frontend from the backend is a deliberate and powerful architectural choice.16
This architecture is made accessible through the opencode serve command, which allows a user to run a standalone, headless opencode server.8 This server exposes the entirety of opencode's functionality over an HTTP API, making it available for programmatic interaction from any other process or machine.

Interacting with the Headless Server

The opencode server is not a black box; it is a fully specified, modern web service. It exposes an OpenAPI 3.1 specification at its /doc endpoint (e.g., <http://localhost:4096/doc).15> This is a critical feature for expert users, as the OpenAPI spec serves as a comprehensive, machine-readable contract for the entire API surface. Using this spec, developers can:
Inspect all available endpoints, request bodies, and response types.
Use tools like Swagger UI to explore and test the API interactively.
Automatically generate type-safe client libraries in virtually any programming language.
This API-first approach ensures that any action possible within the official TUI is also possible programmatically, from creating and managing sessions to sending prompts, executing commands, reading files, and even controlling the TUI itself through a dedicated /tui endpoint.15

Leveraging the JS/TS SDK (@opencode-ai/sdk)

To simplify programmatic interaction for the common use case of JavaScript and TypeScript environments, opencode provides an official, type-safe SDK, available on npm as @opencode-ai/sdk.17 This SDK provides a high-level, developer-friendly wrapper around the server's HTTP API.
The primary entry point is the createOpencode() function, which can bootstrap a connection to an existing server or even start a new server-and-client instance programmatically.17 The returned client object provides access to all the server's capabilities through logically grouped services, such as client.session, client.file, and client.tui.
Because the SDK's TypeScript definitions are generated directly from the server's OpenAPI specification, they are guaranteed to be accurate and up-to-date with the server's capabilities, providing a robust and reliable foundation for building integrations.17

Realistic Example: A Git Pre-Commit Hook Script

This example demonstrates the power of the SDK by implementing an automated code review process within a Git pre-commit hook. The script uses opencode to analyze all staged code files with a specialized "Linter" agent and will block the commit if the agent reports any critical issues.
File: scripts/pre-commit-review.mjs
JavaScript
import { createOpencode } from "@opencode-ai/sdk";
import { $ } from "bun"; // Using Bun's shell for git commands

// 1. Get a list of staged files from Git.
const stagedFilesOutput = await $`git diff --cached --name-only`.text();
const stagedFiles = stagedFilesOutput.trim().split('\n').filter(Boolean);

if (stagedFiles.length === 0) {
  console.log("No staged files to review.");
  process.exit(0);
}

console.log(`Starting opencode for pre-commit review of ${stagedFiles.length} files...`);
const { client, stop } = await createOpencode();

try {
  // 2. Read the content of each staged file.
  const fileContents = await Promise.all(
    stagedFiles.map(file => client.file.read({ query: { path: file } }))
  );

  // 3. Construct a detailed prompt for a specialized 'linter' agent.
  const prompt = `
    As the Linter agent, please review the following staged files for any critical issues, style guide violations, or potential bugs.
    Do not suggest feature changes, only code quality improvements.
    If you find any critical issues, respond with a list of issues prefixed with "ISSUE:".
    If the code is clean, respond with "LGTM".

    Files to review:
    ${stagedFiles.map((file, i) => `
    --- FILE: ${file} ---
    ${fileContents[i].content}
    `).join('\n')}
  `;

  // 4. Send the prompt to the agent and await the response.
  const { parts } = await client.session.prompt({
    path: "pre-commit-review-session", // Use a temporary session
    body: {
      agent: "linter", // Assumes a custom 'linter' agent is defined
      parts: [{ type: "text", content: prompt }],
    },
  });

  const responseText = parts.find(p => p.type === 'text')?.content |

| "";

  // 5. Analyze the response and determine whether to block the commit.
  if (responseText.includes("ISSUE:")) {
    console.error("\n--- PRE-COMMIT REVIEW FAILED ---");
    console.error("Please address the following issues reported by the AI linter:");
    console.error(responseText);
    process.exit(1); // Block the commit
  } else {
    console.log("Pre-commit review passed! LGTM.");
    process.exit(0);
  }
} finally {
  await stop(); // 6. Ensure the opencode server is shut down.
}

```text
This script demonstrates how opencode can be seamlessly integrated into a core developer workflow, acting as an automated quality gate. It showcases the true potential of the tool's server architecture: opencode is not just a tool to be used, but a platform to be built upon.

VIII. Conclusion

opencode presents itself as a powerful and deeply customizable AI coding assistant, architected specifically for the expert developer who demands control, flexibility, and extensibility. The analysis of its configuration and customization capabilities reveals several core design pillars that differentiate it from more simplistic, single-provider tools.
First, its "Configuration as Code" philosophy, centered on the hierarchical opencode.json manifest, transforms agent management from a matter of simple settings into a declarative, version-controllable process. This allows teams to integrate AI behavior into their standard development practices with the same rigor as application code.
Second, the platform is fundamentally provider-agnostic, treating the LLM as a swappable component. This strategic abstraction, supporting dozens of commercial providers as well as local models, grants users maximum control over the most critical part of the AI stack, enabling optimization for cost, performance, and privacy.
Third, the Agent Orchestration System, with its clear distinction between primary and subagents and its use of isolated child sessions, provides a structured framework for composing complex workflows from specialized, reusable AI personas. This moves beyond simple conversation to enable sophisticated, multi-step task automation.
Fourth, the granular Security and Permissions Framework addresses the inherent risks of granting an AI access to a development environment. The allow, ask, deny model, applicable down to individual shell command patterns, enables a "human-in-the-loop" approach that balances powerful automation with robust safety and supervision.
Finally, its Tiered Extensibility Model (Commands, Tools, Plugins) and API-First, Client-Server Architecture elevate opencode from a standalone tool to a true development platform. This allows users to start with simple workflow automation and progress to building deep, programmatic integrations that embed AI into the very fabric of their CI/CD pipelines and bespoke toolchains.
For the developer familiar with competing tools, opencode offers a compelling proposition: a terminal-native experience that does not sacrifice power for convenience. It provides a comprehensive suite of tools for configuration, customization, and programmatic control that, when mastered, can transform the AI assistant from a simple pair programmer into an extensible, automated, and integral member of the development team.
Works cited
Config | opencode, accessed October 17, 2025, https://opencode.ai/docs/config/
opencode command - github.com/sst/opencode - Go Packages, accessed October 17, 2025, https://pkg.go.dev/github.com/sst/opencode
Intro - OpenCode, accessed October 17, 2025, https://opencode.ai/docs/
Agents | opencode, accessed October 17, 2025, https://opencode.ai/docs/agents/
Modes - OpenCode, accessed October 17, 2025, https://opencode.ai/docs/modes/
Rules - OpenCode, accessed October 17, 2025, https://opencode.ai/docs/rules/
Providers - OpenCode, accessed October 17, 2025, https://opencode.ai/docs/providers/
CLI | opencode, accessed October 17, 2025, https://opencode.ai/docs/cli/
Models - OpenCode, accessed October 17, 2025, https://opencode.ai/docs/models/
Tools | opencode, accessed October 17, 2025, https://opencode.ai/docs/tools/
Commands | opencode, accessed October 17, 2025, https://opencode.ai/docs/commands/
Custom Tools | opencode, accessed October 17, 2025, https://opencode.ai/docs/custom-tools/
I Created CUSTOM AI Tools with THIS Simple Trick - Opencode Tools - YouTube, accessed October 17, 2025, https://www.youtube.com/watch?v=jFnrRTNwMLM
Plugins - OpenCode, accessed October 17, 2025, https://opencode.ai/docs/plugins/
Server - OpenCode, accessed October 17, 2025, https://opencode.ai/docs/server/
sst/opencode: The AI coding agent built for the terminal. - GitHub, accessed October 17, 2025, https://github.com/sst/opencode
SDK - OpenCode, accessed October 17, 2025, https://opencode.ai/docs/sdk/
