
Blueprint for an Autonomous Software Development & Content Team: An Agentic Architecture with opencode

Part I: Foundational Architecture: The opencode Agent Ecosystem

The construction of a sophisticated, multi-agent system for software development begins with a mastery of its foundational components. The opencode platform provides a robust set of primitives for defining, governing, and equipping AI agents. This section details the core building blocks: the configuration of individual agents as the atomic units of work, the establishment of a static knowledge base through the AGENTS.md protocol, and the extension of agent capabilities via a spectrum of tooling options.

1.1 Defining the Agent Cadre: Configuration and Governance

An agent within the opencode ecosystem is a specialized AI assistant, its purpose and capabilities precisely defined by its system prompt, chosen language model, and access to tools.1 The platform supports a crucial architectural distinction between primary agents, which serve as the main conversational interfaces for human developers, and subagents, which are designed to execute specific, delegated tasks in a focused manner.1 This hierarchical structure is the cornerstone of building a collaborative agent team.
The configuration of these agents can be approached through two distinct methods, each with strategic advantages. Centralized, project-wide definitions are best managed within the opencode.json file. This approach is ideal for establishing global settings and complex, fine-grained permission schemes that apply across the entire agent team.1 Alternatively, agent personas can be defined in individual Markdown files located within the .opencode/agent/ directory. This method offers superior readability and portability, co-locating an agent's core prompt with its metadata (e.g., model, tool access). This makes individual agent behaviors easier to version-control and audit. The opencode agent create interactive command provides a streamlined wizard for scaffolding these Markdown-based agent configurations.1
Beyond basic definition, the opencode configuration model serves as a powerful framework for implementing the principle of least privilege within an AI system. This is critical for ensuring the safety and predictability of autonomous operations. The permission system allows for granular control over potentially destructive tools like edit, bash, and webfetch, with states including "ask" (requiring human approval), "allow" (autonomous execution), and "deny" (disabling the tool entirely).1 A robust security posture involves setting restrictive global defaults and then explicitly granting elevated privileges on a per-agent basis. For instance, a Planner agent might have read-only access, while a Builder agent is granted full edit rights.1
This governance extends to shell command execution, where glob patterns can enforce highly specific policies, such as "git *": "ask", which prompts for approval for any git command.1 This capability is not merely a feature but a foundational element for building a trustworthy system. By defining explicit operational boundaries for each agent, the architecture can encapsulate powerful capabilities within specialized, trusted agents, mitigating the risk of a single, overly-permissive agent causing unintended side effects. This mirrors established security best practices in human software teams, such as Infrastructure as Code (IaC) roles, and is a prerequisite for building a reliable autonomous development workforce.

1.2 The AGENTS.md Protocol: Codifying Project Intelligence

AGENTS.md is an open specification that functions as a machine-readable README file, providing a standardized, predictable location for project-specific context, conventions, and operational instructions for AI agents.4 Its adoption by major coding assistants, including opencode, makes it an essential component for grounding agent behavior in the realities of a specific codebase.5
A well-structured AGENTS.md file is critical for ensuring that agent-generated contributions are idiomatic, consistent, and correct. A comprehensive template should include several key sections:
Setup and Execution: Clear, machine-parsable commands for setting up the development environment, running the test suite, and executing deployment steps.6
Code Quality and Conventions: Detailed guidelines on coding style, naming conventions, and architectural patterns. This is the primary mechanism for ensuring agent-generated code seamlessly integrates with the existing codebase.4
Project Structure: A documented overview of the directory layout (e.g., /src, /tests, /utils), which guides agents on where to place new files and locate existing logic.4
Workflow Guidelines: Specific instructions for processes like formatting pull request messages and commit messages, ensuring adherence to team workflows.6
For large-scale projects and monorepos, the AGENTS.md protocol supports a powerful nesting feature. Agents are programmed to respect the nearest AGENTS.md file in the directory tree, allowing package-specific instructions to override root-level rules. This enables highly tailored and contextually relevant guidance within complex codebases, a pattern used extensively in major open-source projects.5
This protocol is best understood as the implementation of static, procedural memory for the agent team. It is the project's official handbook, preventing architectural drift and ensuring consistency across all automated tasks. By externalizing this critical knowledge from individual agent prompts into a shared, version-controlled artifact, a single source of truth is established. This approach significantly reduces the token cost and complexity of individual agent prompts; a TestWriter agent, for example, does not need to be told how to run tests in its prompt, as it can simply parse the ## Testing Protocols section of the AGENTS.md file.4 A meticulously crafted AGENTS.md is therefore not an optional enhancement but the foundational layer of the system's shared intelligence and memory.

1.3 The Tooling Spectrum: MCP vs. Custom Tools

The opencode platform's functionality can be extended through two primary mechanisms: integrating external services via the Model Context Protocol (MCP) or building internal functions as Custom Tools.3 The choice between these two is a critical architectural decision that hinges on the locus of execution and the required trust boundary.
MCP is a standardized protocol designed to allow AI assistants to access external tools and data sources in a structured way.7 Configuration in opencode involves adding a server definition to the opencode.json file, specifying whether it is a local process or a remote HTTP endpoint.8 MCP is the ideal solution for connecting to third-party APIs that already offer a compliant server, such as Vercel's gh_grep for code searching or Nuxt UI's server for documentation retrieval.7 This approach is well-suited for integrating generic, reusable tools that are not specific to a single project.
In contrast, Custom Tools are TypeScript or JavaScript files located in the project's .opencode/tool/ directory. These files export functions that the language model can call directly, with type-safe argument schemas defined using the @opencode-ai/plugin helper and the Zod validation library.10 This mechanism is perfect for encapsulating project-specific logic, such as querying an internal database, executing a complex build script, or interacting with proprietary systems where an external MCP server would be insecure or impractical.10
The decision framework is clear: MCP is for reaching out of the project to external, standardized services, while Custom Tools are for executing trusted, bespoke logic within the project's context. MCP offers convenience and interoperability at the cost of potential network latency and a dependency on a third-party service. Custom Tools offer maximum security, performance, and customization by running within the opencode process, with no additional network attack surface.10 For the architecture proposed in this report, core internal components like the MemoryManager (Part III) and FileWatcher triggers (Part IV) should be implemented as Custom Tools due to their trusted, project-specific nature. General-purpose utilities, such as advanced code searching across public repositories, could be integrated via MCP.

Part II: The Multi-Agent Orchestration Engine

Building upon the foundational components, the next step is to design a collaborative team of agents capable of tackling complex software development and content creation tasks. This requires an architectural pattern that promotes specialization, efficient task delegation, and parallel execution where possible. Drawing inspiration from the robust multi-agent designs pioneered in the Claude ecosystem, this section outlines a blueprint for an opencode-based orchestration engine.

2.1 The Orchestrator-Specialist Model: A Blueprint for Collaboration

The most stable and effective agentic systems follow a hub-and-spoke model, where a central Orchestrator agent manages high-level planning and delegates tasks to a team of single-responsibility Specialist sub-agents.12 This architecture promotes a clear separation of concerns, enables parallel workflows for independent tasks, and ultimately leads to higher-quality output by leveraging specialized expertise.29
The proposed agent team is composed of the following roles:
Orchestrator (Primary Agent): The central coordinator and main entry point for user requests. Its core prompt focuses on task decomposition, dependency analysis, and delegating work to sub-agents via @ mentions.1 To ensure it acts as a safe planner, it is configured with broad read-access tools but restricted write and execute permissions.
CodeImplementer (Sub-agent): The primary workhorse for writing and modifying application code. It has full access to edit, write, and patch tools, and its prompt emphasizes strict adherence to the coding standards defined in AGENTS.md.2
TestWriter (Sub-agent): Specializes in generating, updating, and running tests. It is granted bash access specifically for executing the test commands documented in AGENTS.md.6
RefactorEngine (Sub-agent): Focuses on improving existing code quality, performance, and readability without altering functionality.
DocuWriter (Sub-agent): Responsible for generating and updating documentation, including README files and in-line code comments.
SecurityAuditor (Sub-agent): A read-only agent that scans the codebase for potential vulnerabilities. Its toolset is limited to read, grep, and glob, with edit and write permissions explicitly denied to prevent it from making changes.1
ContentPlanner (Sub-agent): A new addition focused on content strategy. It analyzes project goals and development activity to propose blog post topics, titles, and outlines.30
TechnicalWriter (Sub-agent): Translates technical work into clear, engaging blog content. It takes outlines from the ContentPlanner and code diffs or feature descriptions to generate draft articles.31
ContentEditor (Sub-agent): Reviews and refines drafts for clarity, grammar, tone, and SEO optimization, ensuring the final output is polished and ready for human review.30
The following table provides a concrete implementation plan, translating this architectural design into specific opencode configurations. This matrix serves as a direct checklist for instantiating the agent team, ensuring each member is correctly and securely configured from the outset.
Table 1: Agent Role and Configuration Matrix
Agent Name
opencode Role
Core description
Recommended model
Key tools Enabled
permission Profile
Orchestrator
primary
Decomposes tasks and coordinates specialist sub-agents.
anthropic/claude-3-5-sonnet-20241022
read, glob, grep, todoread
edit: deny, bash: ask
CodeImplementer
subagent
Writes, modifies, and patches code based on specifications.
anthropic/claude-3-5-sonnet-20241022
edit, write, patch, read
edit: allow, write: allow
TestWriter
subagent
Generates and executes unit, integration, and e2e tests.
anthropic/claude-3-haiku-20240307
bash, write, read, grep
bash: "pnpm test*": allow
RefactorEngine
subagent
Improves code quality, performance, and style.
anthropic/claude-3-haiku-20240307
edit, patch, read, grep
edit: ask
DocuWriter
subagent
Generates and updates project and code documentation.
anthropic/claude-3-haiku-20240307
write, edit, read
write: allow
SecurityAuditor
subagent
Scans code for security vulnerabilities and bad practices.
anthropic/claude-3-haiku-20240307
read, grep, glob
edit: deny, bash: deny
ContentPlanner
subagent
Generates blog post ideas, titles, and outlines from project activity.
anthropic/claude-3-haiku-20240307
read, grep, webfetch, todowrite
edit: deny, bash: deny
TechnicalWriter
subagent
Drafts blog posts based on outlines and technical context.
anthropic/claude-3-5-sonnet-20241022
write, read, grep
write: allow, edit: "ask"
ContentEditor
subagent
Reviews and refines blog drafts for quality and SEO.
anthropic/claude-3-haiku-20240307
edit, read, patch
edit: allow

2.2 Task Decomposition and Workflow Management

The Orchestrator's primary function is to transform a high-level user request, such as "add a new API endpoint for users," into a structured plan of executable sub-tasks. This process begins with a "chain-of-thought" reasoning step, inspired by advanced prompting techniques, where the agent explicitly formulates a plan before acting.14
This plan is then executed through a series of sub-agent invocations. The key technical enabler for this delegation is opencode's support for invoking sub-agents via @ mentions within the chat interface.1 For example, a plan might look like this:
@TestWriter create a failing integration test for GET /api/users.
@CodeImplementer create the route and controller to make the test pass.
@DocuWriter add OpenAPI documentation for the new endpoint.
This conversational delegation model allows the Orchestrator to act as a project manager, assigning tasks to its team. The opencode TUI facilitates human oversight of this process; a developer can use the Ctrl+Right and Ctrl+Left keybindings to cycle between the main Orchestrator session and the child sessions created by each sub-agent, monitoring both the high-level plan and the detailed execution of each step.1
True parallelism, however, requires more than simple delegation. It demands that the Orchestrator understand task dependencies. For example, writing a test must precede writing the code to pass it. Therefore, the Orchestrator must function as a state machine or a dependency graph resolver. A proven pattern for this is the use of JSON manifests to track the state of a multi-phase workflow, ensuring each stage is successfully completed before the next begins.15 The Orchestrator should be prompted to first identify task dependencies, creating a directed acyclic graph (DAG) of operations. It can then use a tool like the built-in todowrite or a custom state-management tool to maintain a manifest of completed and pending tasks, dispatching all unblocked tasks simultaneously to the relevant sub-agents.3

2.3 Low-Overhead Task Execution: The Discretionary Dispatcher

Delegating every minor task, such as renaming a variable or fixing a typo, to a sub-agent introduces unnecessary communication and context-switching overhead. To optimize the workflow, the Orchestrator must be capable of discretionary dispatch.
This is primarily a prompting challenge. The Orchestrator's system prompt must include instructions to self-assess the complexity and context impact of each sub-task. A suitable directive would be: "For any given task, first assess its complexity. If the task is trivial, self-contained, and requires no specialized knowledge (e.g., fixing a typo, renaming a local variable), execute it yourself. If the task requires deep domain logic, extensive code changes, or specialized skills like test generation, delegate it to the appropriate specialist agent." This empowers the Orchestrator to handle low-overhead tasks directly, reserving the specialized agents for work that truly requires their expertise. To facilitate this, the Orchestrator should be configured with edit: "ask" permissions, allowing it to perform simple modifications with human oversight.

Part III: Implementing an Adaptive Memory System

A key differentiator for an advanced agentic system is its ability to learn from experience—to develop a "memory effect" that improves its performance over time. This requires moving beyond the transient context of a single session to a persistent, evolving knowledge base. This section details a hybrid memory architecture that combines static project knowledge with dynamic, learned insights.

3.1 A Hybrid Memory Architecture: Combining Static and Dynamic Knowledge

No single memory solution is sufficient for the diverse needs of a software development agent team. A more robust approach, inspired by cognitive science and practical AI implementations, is a layered system that distinguishes between different types of knowledge.16
Layer 1: Procedural Memory (The Rulebook): This layer stores long-term, static rules and conventions. It is implemented using the project's AGENTS.md file(s), which serve as the definitive "how-to" guide for all agents, codifying established best practices and operational procedures.4
Layer 2: Episodic Memory (Short-Term Recall): This layer captures the immediate context of an ongoing task. It is implemented using opencode's built-in session history, which remembers the sequence of events, tool calls, and results within a single conversation. The platform's auto-compaction feature helps manage this context window, summarizing older parts of the conversation to prevent overflow.2
Layer 3: Semantic Memory (Long-Term Learning): This is the most advanced layer, responsible for storing extracted facts, patterns, and insights gleaned from completed tasks. It is implemented using a persistent external database, such as SQLite for structured data or a vector database like ChromaDB for semantic information, which is accessed via a dedicated custom tool.19 Examples of semantic memories include: "The calculate_tax function is computationally expensive," or "Refactoring pattern X was successfully applied to component Y."
The following table clarifies the relationship between these conceptual memory types and their concrete technical implementations within the proposed opencode architecture.
Table 2: Memory Type and Implementation Strategy
Memory Type
Description
opencode Implementation
Key Snippets/Tools
Procedural
Static, long-term project rules and conventions.
Project AGENTS.md file(s).

## Code Style, ## Testing Protocols

Episodic
Short-term, sequential memory of the current task.
Built-in session history.
opencode auto-compaction feature
Semantic
Persistent, long-term storage of learned facts and patterns.
External database (SQLite/ChromaDB) via a Custom Tool.
memory_store, memory_query tools

3.2 The MemoryManager Custom Tool: The Gateway to Persistence

To enable interaction with the semantic memory layer, a dedicated MemoryManager custom tool is required. This tool will be implemented as a TypeScript file (.opencode/tool/memory.ts) using the @opencode-ai/plugin SDK, providing a type-safe API for the agent team.10
The tool will export multiple functions, which opencode will expose as distinct tools named <filename>_<exportname>.10 The core functions will be:
memory_store: This function will accept a natural language string (the "memory") and an optional namespace as arguments. Its implementation will generate a vector embedding of the string (e.g., using an external embedding model API) and store both the original text and its vector representation in a persistent vector database like ChromaDB.19
memory_query: This function will accept a query string as an argument. It will generate an embedding for the query and perform a semantic similarity search against the vector database to retrieve the most relevant stored memories.
This custom tool acts as the essential bridge between the agents' reasoning process and the long-term, persistent knowledge base, allowing them to both contribute to and draw from the collective intelligence of the system.

3.3 The Learning Loop: From Action to Knowledge

The system must have a defined process for converting raw experience into structured, useful memories. Simply logging all conversation history would create a noisy and inefficient knowledge base.12 A more effective approach is to treat memory formation itself as an agentic task, using an LLM's summarization and extraction capabilities to distill high-quality insights.
To this end, a new specialist sub-agent, the MemoryFormation agent, is introduced into the workflow.
Trigger: After a significant task is successfully completed, the Orchestrator invokes the @MemoryFormation agent.
Input: The Orchestrator provides the MemoryFormation agent with the original task description, the final code diff, and a summary of the outcome.
Process: The MemoryFormation agent's prompt instructs it to analyze this input and extract key, reusable facts, architectural decisions, or novel patterns. It is tasked with formulating these insights as concise, factual statements suitable for long-term storage.
Output: The agent then calls the memory_store tool to persist these synthesized memories in the semantic database.
This structured learning loop—Orchestrator -> Specialist Agent (work) -> Orchestrator (confirmation) -> MemoryFormation Agent (distillation) -> MemoryManager Tool (persistence)—ensures that the system's long-term memory remains a curated, high-quality repository of actionable knowledge, rather than an unmanageable archive of raw data.

Part IV: The Proactive Local Development Environment

To fully integrate the autonomous agent team into a developer's workflow, the system must be able to react to changes in the local environment in real-time. A file watcher service acts as the system's sensory input, triggering agentic workflows automatically in response to file modifications, creating a proactive and assistive development experience.

4.1 The FileWatcher Service: The System's Eyes and Ears

The chokidar library is the industry-standard choice for implementing a robust file watcher in Node.js. It is cross-platform and effectively handles numerous edge cases, such as atomic writes and chunked file saves, that the native fs.watch API struggles with.21 Its use within the opencode project itself suggests strong compatibility with the ecosystem.23
The implementation will consist of a standalone Node.js script (watcher.js) that initializes a chokidar watcher on the project's root directory (chokidar.watch('.')).21 The watcher will be configured to ignore irrelevant directories like node_modules and .git and to only begin emitting events after its initial scan is complete (ignoreInitial: true).21 The script will listen for key filesystem events, primarily add, change, and unlink, which will serve as the triggers for agentic actions.22

4.2 Triggering Agentic Workflows from File Changes

When the FileWatcher detects a relevant change, it must communicate this event to the opencode agent system. The most direct method is to use opencode's non-interactive prompt mode, which allows it to be executed as a command-line tool.2 The watcher.js script can use Node's child_process.exec to run a command like: opencode --prompt "File src/api/new_feature.ts was just added. Analyze it and generate corresponding unit tests.".
A more elegant and maintainable approach is to leverage opencode's custom commands feature.25 By defining structured commands in Markdown files, the watcher's logic can be decoupled from the specific prompts sent to the agents. For example, a command file .opencode/command/generate-tests.md can be created with the template: The file $ARGUMENTS was just modified. Please invoke the @TestWriter agent to generate or update its unit tests. The watcher script can then execute a much cleaner command: opencode /generate-tests @src/api/new_feature.ts. This method allows the agentic logic (the prompts) to be version-controlled and modified within the opencode configuration, without requiring changes to the watcher script itself.
The following table provides a blueprint for the watcher's logic, mapping specific file patterns and events to corresponding agentic tasks. This transforms the generic file watcher into an intelligent, context-aware development assistant.
Table 3: File Watcher Event-to-Agent Action Mapping
File Pattern
Triggering Event
opencode Command to Execute
Responsible Agent
src/components/**/*.tsx
add
/document-component $ARGUMENTS
@DocuWriter
src/**/*.test.ts
change
/run-test $ARGUMENTS
@TestWriter
package.json
change
/analyze-dependencies
@SecurityAuditor
*.py
change (with debounce)
/refactor-file $ARGUMENTS
@RefactorEngine
docs/**/*.md
change
/validate-doc-links $ARGUMENTS
@DocuWriter
src/features/**/*.ts
add
/suggest-blog-post $ARGUMENTS
@ContentPlanner

Part V: The Self-Documenting Developer: Automated Content Creation

To transform development work into compelling project demos and improve hiring prospects, the agentic system can be extended to automate content creation. This creates a powerful feedback loop where the act of documenting a project can clarify its goals and showcase capabilities, turning every project into a self-documenting portfolio piece.

5.1 The Content Creation Cadre

This system introduces a new team of specialist sub-agents dedicated to content creation, working in concert with the development agents.30
ContentPlanner: This agent acts as a content strategist. When triggered, it analyzes recent code changes, project goals, or specific user prompts to brainstorm relevant blog post topics. It is responsible for generating compelling titles and structured outlines.30
TechnicalWriter: This agent is the primary author. It takes an outline from the ContentPlanner and relevant source files or commit messages as context, then drafts a technical blog post. Its prompt emphasizes translating complex code and logic into clear, accessible prose suitable for a target audience.31
ContentEditor: This agent serves as the quality gate. It reviews drafts from the TechnicalWriter for grammatical accuracy, clarity, tone consistency, and SEO best practices, suggesting edits to polish the final piece.30

5.2 The Content Workflow Engine: From Code Commit to Blog Draft

The process of creating a blog post is broken down into a series of discrete, manageable tasks, orchestrated by the primary Orchestrator agent. This multi-step approach ensures higher quality and more structured content than a single-shot generation attempt.29
A typical workflow would be:
Initiation: A developer completes a new feature and decides to document it. They issue a custom command: /blog-draft "New user authentication feature" @src/features/auth.ts.
Planning: The Orchestrator receives this command and delegates the first step: @ContentPlanner create a blog post outline for the feature described in @src/features/auth.ts.
Drafting: Once the ContentPlanner returns a structured outline, the Orchestrator passes it to the writer: @TechnicalWriter write a blog post using this outline and reference the code in @src/features/auth.ts.
Editing: After the draft is written to a file (e.g., drafts/auth-feature.md), the Orchestrator assigns the final review: @ContentEditor review and refine the draft at @drafts/auth-feature.md.
Completion: The final, polished draft is saved and ready for human review and publication.

5.3 Managing the Editorial Pipeline: The BlogManager Custom Tool

To manage a collection of blog posts—from initial ideas to final drafts—a custom tool is essential. The BlogManager tool provides a structured way for agents to interact with an editorial manifest file, blog_manifest.json.15
This tool, implemented as .opencode/tool/blog.ts, will offer functions to manage the content lifecycle 10:
blog_create_entry: Adds a new entry to blog_manifest.json with a title, a generated ID, and an initial status of "idea".
blog_update_status: Changes the status of a blog entry (e.g., from "idea" to "outline complete" or "draft ready").
blog_add_outline: Attaches a generated outline to a specific blog entry in the manifest.
blog_link_draft_file: Associates a blog entry with the path to its Markdown draft file.
This manifest-driven approach provides a persistent, queryable record of all content being worked on, allowing both humans and agents to track progress and manage the editorial calendar effectively.

5.4 Controlled Automation: Manual and Suggested Triggers

A key requirement is to control how and when content creation is triggered. This system supports both manual and semi-automated workflows to provide maximum flexibility.
Manual Triggers: The primary method of control is through opencode custom commands.25 A developer can create a command like /blog-draft that takes a title and optional file references as arguments ($ARGUMENTS). This gives the developer explicit, fine-grained control over initiating the content creation process at the exact moment a feature is ready to be documented.
Suggested Triggers: The FileWatcher service can be configured to act as a proactive assistant without being overly intrusive. For instance, upon detecting a significant new feature file being added (e.g., in src/features/), the watcher can trigger the @ContentPlanner to generate a suggestion in the main chat TUI: "I noticed a new feature was added in new-feature.ts. Would you like me to draft a blog post about it?" This human-in-the-loop approach balances automation with developer oversight, ensuring that content is only created when desired.33
This combination of explicit commands and intelligent suggestions creates a powerful yet controllable system for turning development effort into a polished portfolio of project demos.

Part VI: Strategic Implementation and Future-State Vision

The architecture described represents a powerful, autonomous software development system. However, its successful implementation requires a phased, iterative approach that allows for gradual adoption, testing, and refinement. This final section provides a practical rollout plan and discusses key considerations for long-term maintenance and performance tuning.

6.1 Phased Rollout Plan: From Assistant to Autonomous Team

A pragmatic adoption strategy involves five distinct phases, moving from simple augmentation to full autonomy:
Phase 1: Foundation and Augmentation. The initial phase focuses on setting up the core infrastructure. This involves installing opencode, configuring provider API keys 26, and developing a comprehensive AGENTS.md file for a pilot project. A single, general-purpose Builder agent should be created and used manually for code generation tasks. This allows the team to familiarize themselves with the basic capabilities and workflow.
Phase 2: Specialization and Orchestration. In this phase, the full development agent cadre from the Agent Role and Configuration Matrix is implemented. The Orchestrator agent is defined, and developers begin prompting it to delegate tasks to the specialist sub-agents using @ mentions. All workflows are manually initiated and closely supervised to validate the delegation logic.
Phase 3: Memory and Learning. The system's intelligence is enhanced by building the MemoryManager custom tool and the MemoryFormation sub-agent. The team begins populating the long-term semantic memory database by running the learning loop on successfully completed tasks, gradually building the system's knowledge base.
Phase 4: Proactive Automation. The FileWatcher service is implemented and connected to opencode custom commands to trigger development-related workflows automatically. It is crucial to begin with low-risk, read-only automations (e.g., triggering documentation checks) before enabling automations that perform automated code modifications.
Phase 5: Content and Portfolio Automation. The final phase introduces the content creation agents (ContentPlanner, TechnicalWriter, ContentEditor) and the BlogManager tool. The team starts by using manual /blog-draft commands to generate content. Once the workflow is validated, the FileWatcher can be configured to provide automated suggestions, completing the vision of a self-documenting development process.

6.2 Observability and Performance Tuning

Maintaining and optimizing the system over time requires attention to observability and performance. While opencode does not have a dedicated observability suite, its structured nature provides avenues for monitoring. The use of JSON manifests to track workflow state, a pattern demonstrated in advanced opencode agent examples, is a key practice to adopt for tracking task success, failure, and duration.15
Performance tuning involves several key levers:
Token Usage and Model Selection: A critical optimization is to use a hybrid model strategy. More capable and expensive models, like Claude 3.5 Sonnet, should be reserved for complex reasoning and planning tasks performed by the Orchestrator. Cheaper, faster models, like Claude 3 Haiku, are well-suited for the more focused, repetitive tasks handled by the specialist sub-agents.1
Prompt and Tool Refinement: The system's performance is directly tied to the quality of its instructions. If an agent consistently fails at a certain task, its system prompt or the relevant sections of AGENTS.md require refinement. Similarly, if an agent misuses a tool, the tool's description likely lacks clarity and should be improved to provide better guidance.28
Workflow Encapsulation: The efficiency of the system can be improved by observing common task patterns. If a frequent operation requires a long and complex chain of bash commands, that logic should be encapsulated into a single, more efficient Custom Tool, reducing the number of LLM calls and potential points of failure.
By following this strategic roadmap and continuously tuning the system's performance, a development team can evolve from using AI as a simple code completion tool to partnering with a sophisticated, autonomous team of agents that actively contributes to the entire software development lifecycle.
Works cited
Agents - OpenCode, accessed October 17, 2025, <https://opencode.ai/docs/agents/>
opencode-ai/opencode: A powerful AI coding agent. Built for the terminal. - GitHub, accessed October 17, 2025, <https://github.com/opencode-ai/opencode>
Tools | opencode, accessed October 17, 2025, <https://opencode.ai/docs/tools/>
Agents.md Guide for OpenAI Codex - Enhance AI Coding, accessed October 17, 2025, <https://agentsmd.net/>
Agents.md: The README for Your AI Coding Agents - Research AIMultiple, accessed October 17, 2025, <https://research.aimultiple.com/agents-md/>
AGENTS.md, accessed October 17, 2025, <https://agents.md/>
MCP Server - Nuxt UI, accessed October 17, 2025, <https://ui.nuxt.com/docs/getting-started/ai/mcp>
MCP servers - OpenCode, accessed October 17, 2025, <https://opencode.ai/docs/mcp-servers/>
Local setup • Svelte MCP Docs, accessed October 17, 2025, <https://svelte.dev/docs/mcp/local-setup>
Custom Tools - OpenCode, accessed October 17, 2025, <https://opencode.ai/docs/custom-tools/>
I Created CUSTOM AI Tools with THIS Simple Trick - Opencode Tools - YouTube, accessed October 17, 2025, <https://www.youtube.com/watch?v=jFnrRTNwMLM>
Mastering Claude Agent SDK: Best Practices for Developing AI Agents (2025) - Skywork.ai, accessed October 17, 2025, <https://skywork.ai/blog/claude-agent-sdk-best-practices-ai-agents-2025/>
Getting Started with the Claude Code SDK to Orchestrate Multiple AI Instances - Arsturn, accessed October 17, 2025, <https://www.arsturn.com/blog/getting-started-with-the-claude-code-sdk-to-orchestrate-multiple-ai-instances>
The "think" tool: Enabling Claude to stop and think in complex tool use situations - Anthropic, accessed October 17, 2025, <https://www.anthropic.com/engineering/claude-think-tool>
OpenCode Agents: Another Path to Self-Healing Documentation Pipelines - Medium, accessed October 17, 2025, <https://medium.com/@richardhightower/opencode-agents-another-path-to-self-healing-documentation-pipelines-51cd74580fc7>
LangGraph Memory Management - Overview, accessed October 17, 2025, <https://langchain-ai.github.io/langgraph/concepts/memory/>
What Is AI Agent Memory? | IBM, accessed October 17, 2025, <https://www.ibm.com/think/topics/ai-agent-memory>
Long-Term Memory for LLMs: 2023 – 2025 - Champaign Magazine, accessed October 17, 2025, <https://champaignmagazine.com/2025/10/14/long-term-memory-for-llms-2023-2025/>
ruvnet/claude-flow: The leading agent orchestration platform for Claude. Deploy intelligent multi-agent swarms, coordinate autonomous workflows, and build conversational AI systems. Features enterprise-grade architecture, distributed swarm intelligence, RAG integration, and native Claude Code support via MCP protocol. Ranked #1 in agent-based - GitHub, accessed October 17, 2025, <https://github.com/ruvnet/claude-flow>
An example showcasing how to create an agent with persistent long-term memory using Atomic Agents - GitHub, accessed October 17, 2025, <https://github.com/KennyVaneetvelde/persistent-memory-agent-example>
paulmillr/chokidar: Minimal and efficient cross-platform file watching library - GitHub, accessed October 17, 2025, <https://github.com/paulmillr/chokidar>
Chokidar. Watcher For Nodejs | by Ashu Singh - Medium, accessed October 17, 2025, <https://medium.com/@ashusingh584/chokidar-11290855e2cb>
sst/opencode: The AI coding agent built for the terminal. - GitHub, accessed October 17, 2025, <https://github.com/sst/opencode>
Top 10 Examples of "chokidar in functional component" in JavaScript - CloudDefense.AI, accessed October 17, 2025, <https://www.clouddefense.ai/code/javascript/example/chokidar>
Commands - OpenCode, accessed October 17, 2025, <https://opencode.ai/docs/commands/>
Providers - OpenCode, accessed October 17, 2025, <https://opencode.ai/docs/providers/>
wshobson/agents: Intelligent automation and multi-agent orchestration for Claude Code, accessed October 17, 2025, <https://github.com/wshobson/agents>
Writing effective tools for AI agents—using AI agents - Anthropic, accessed October 17, 2025, <https://www.anthropic.com/engineering/writing-tools-for-agents>
How to Build a Better AI Content Generation Workflow - HubSpot Community, accessed October 17, 2025, <https://community.hubspot.com/t5/Blog-Website-Page-Publishing/How-to-Build-a-Better-AI-Content-Generation-Workflow/m-p/1036220>
Blog Write multi agent AI is a custom multi-agent system designed to autonomously create high-quality, research-driven blogs. Using LangChain, Gemini 2.0-Flash-EXP, and Serper Web Search Tool, it automates planning, writing, and editing to deliver human-like blogs with up-to-date references. - GitHub, accessed October 17, 2025, <https://github.com/Abdulbasit110/Blog-writer-multi-agent/>
Automate Blog Writing with AI: A Content Marketer's Guide - Datagrid, accessed October 17, 2025, <https://www.datagrid.com/blog/ai-agents-automate-blog-post-writing-content-marketers>
Automated AI Blog Creation: How I Built a Multi-Agent System - Aisa-x, accessed October 17, 2025, <https://aisa-x.ai/blog/how-i-built-a-multi-agent-system-for-automated-ai-blog-creation/>
AI Agent Best Practices and Ethical Considerations | Writesonic, accessed October 17, 2025, <https://writesonic.com/blog/ai-agents-best-practices>
