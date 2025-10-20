# Container Use: Agent Coder Reference

## Overview

**Container Use** is an open-source MCP (Model Context Protocol) server that provides isolated, containerized environments for coding agents. It enables multiple AI agents to work simultaneously in separate sandboxed environments without conflicts, using Dagger containers and Git worktrees.

**Core Benefits:**

- 📦 **Isolated Environments** - Each agent gets its own container and git branch
- 👀 **Real-time Visibility** - Complete command history and logs
- 🚁 **Direct Intervention** - Drop into agent terminals when needed
- 🎮 **Standard Git Workflow** - Easy review and merge via git checkout
- 🌎 **Universal Compatibility** - Works with any MCP-compatible agent

---

## Installation

### Homebrew (macOS - Recommended)

```bash
brew install dagger/tap/container-use
```

### Universal Installation Script

```bash
curl -fsSL https://raw.githubusercontent.com/dagger/container-use/main/install.sh | bash
```

**Note:** Both `container-use` and `cu` commands work identically.

**Requirements:**

- Docker
- Git
- Dagger (bundled with installation)

---

## Agent Integration

### Setup Process

Container Use works with any MCP-compatible agent by adding `container-use stdio` as an MCP server.

#### Claude Code

```bash
cd /path/to/repository
claude mcp add container-use -- container-use stdio

# Optional: Add agent rules
curl https://raw.githubusercontent.com/dagger/container-use/main/rules/agent.md >> CLAUDE.md
```

#### Amazon Q Developer

Add to `~/.aws/amazonq/mcp.json`:

```json
{
  "mcpServers": {
    "container-use": {
      "command": "container-use",
      "args": ["stdio"],
      "env": {},
      "timeout": 60000
    }
  }
}
```

#### Cursor, Goose, VSCode

Setup follows the same pattern: configure the agent to use `container-use stdio` as the MCP server. See the official documentation for specific integration guides.

---

## CLI Commands Reference

### Environment Management

**List all environments:**

```bash
container-use list
# or
cu list
```

**Create new environment:**

```bash
container-use create <environment-name>
```

**Remove environment:**

```bash
container-use remove <environment-name>
```

**Open terminal in environment:**

```bash
container-use terminal <environment-name>
```

### Monitoring & Inspection

**Watch environment activity (real-time):**

```bash
container-use watch <environment-name>
```

**View command history/logs:**

```bash
container-use log <environment-name>
```

**Show git diff for environment:**

```bash
container-use diff <environment-name>
```

**View environment details:**

```bash
container-use show <environment-name>
```

### Configuration Management

**Show current default configuration:**

```bash
container-use config show
```

**Show environment-specific configuration:**

```bash
container-use config show <environment-name>
```

**Set base image:**

```bash
container-use config base-image set <image-name>
# Example: python:3.11
```

**Add setup command:**

```bash
container-use config setup-command add "<command>"
# Example: "apt-get update && apt-get install -y build-essential"
```

**Add install command:**

```bash
container-use config install-command add "<command>"
# Example: "pip install -r requirements.txt"
```

**Set environment variables:**

```bash
container-use config env set <KEY> <value>
# Example: PYTHONPATH /workdir
```

**Import configuration from environment:**

```bash
container-use config import <environment-name>
```

### Git Integration

**Checkout environment branch:**

```bash
git checkout <branch-name>
git pull
```

**View agent's work:**

```bash
git log --patch container-use/<environment-name>
git diff container-use/<environment-name>
```

**Merge approved work:**

```bash
git merge <branch-name>
```

---

## MCP Tools Available to Agents

When Container Use is configured as an MCP server, agents can access these tools:

- `environment_create` - Create new isolated environment
- `environment_run_cmd` - Execute command in environment
- `environment_file_read` - Read file contents from environment
- `environment_file_write` - Write file to environment
- `environment_file_edit` - Edit existing file in environment
- `environment_file_list` - List files in environment directory
- `environment_file_delete` - Delete file from environment
- `environment_checkpoint` - Create checkpoint/commit in environment
- `environment_add_service` - Add service (e.g., database) to environment
- `environment_config` - View or modify environment configuration
- `environment_open` - Open terminal access to environment
- `environment_update_metadata` - Update environment metadata

---

## MCP server details & CLI reference (summary)

The Container Use MCP server exposes a small set of tools agents can call. When integrated via `container-use stdio` the agent is able to create and manage isolated environments without touching your local working tree. The key MCP calls available are:

- `mcp__container-use__environment_create` (alias: `environment_create`) — create a new environment (the agent can request this). Environments get human-friendly two-word IDs like `fancy-mallard` or `teaching-sloth`.
- `mcp__container-use__environment_run_cmd` (alias: `environment_run_cmd`) — run a shell command inside the environment container.
- `mcp__container-use__environment_file_read` / `write` / `edit` / `list` / `delete` — read and modify files inside the environment.
- `mcp__container-use__environment_checkpoint` — create a commit/checkpoint inside the environment branch.

CLI command equivalents (useful for debugging and manual inspection):

```
container-use list                # list environments
container-use watch               # stream activity for active envs
container-use log <env-id>        # view command history & commits
container-use diff <env-id>       # see code changes
container-use checkout <env-id>   # checkout env branch locally
container-use terminal <env-id>   # open interactive shell inside container
container-use delete <env-id>     # delete environment
```

Environment IDs are two-word identifiers (e.g. `clever-dolphin`). The CLI supports partial IDs as long as they are unique.

## Clean-eval workflow (recommended for automated tests)

Goal: give the agent a minimal, clean workspace so it cannot see or modify your repository's full contents while still allowing the harness to verify produced code.

Two viable strategies are described below; choose one depending on whether you want full MCP isolation (integration) or deterministic, fast tests.

Option A — Pre-created git worktree (recommended for unit/test harnesses)

1. Create a fresh branch and worktree for the eval so the agent operates in an empty-ish directory:

```bash
# create a unique branch and worktree
git fetch origin
git branch -D eval/$(date +%s) || true
git worktree add .worktrees/eval-<id> -b eval/<id> HEAD
```

2. Optionally populate only the files needed for the simple eval (for example a minimal package.json or .opencode config). Keep the worktree small.

3. Run the agent with the harness configured to chdir into the worktree (or pass the worktree path to the agent via the `context` field). Example harness behavior:

- chdir into `.worktrees/eval-<id>`
- start the OpenCode session and prompt the agent to create `hello.js`
- after agent finishes, read `.worktrees/eval-<id>/hello.js` and run the test assertion

4. Cleanup: remove the worktree and branch when done.

Pros: deterministic, fast, simple to test and isolate from your main repo.

Option B — Full MCP container-use environment (integration-style)

1. Ensure agents are configured to use `container-use stdio` in the MCP configuration.

2. In your prompt/task instruct the agent to always create an environment and print the environment id and how to view it:

```
Please create an environment using the MCP `environment_create` tool and then write files there. When done, print the environment id and the commands:

container-use log <env-id>
container-use checkout <env-id>
```

3. Run the agent. The harness should detect the environment id either by parsing the agent response (agents commonly print the id) or by polling `container-use list` and selecting the most recently-created environment.

4. Inspect the environment and verify produced code:

```bash
container-use log <env-id>
container-use diff <env-id>
container-use checkout <env-id>
# Run the output inside the checked-out folder
node hello.js
```

5. Cleanup: `container-use delete <env-id>` (or use `container-use delete --all` carefully in CI)

Pros: uses MCP as intended and fully isolates agent work. Cons: agent-chosen names and timing make tests less deterministic.

## How to inspect available MCP tools in a running OpenCode session

If you want to programmatically inspect what MCP tools are available (so the harness can verify `mcp__container-use__environment_create` exists), you can:

1. Start OpenCode and call the session `/mcp/tools` or equivalent OpenCode introspection endpoint (depends on the SDK). If that isn't available, you can detect the MCP tools by observing the agent's initial capability messages in the session response.

2. Alternatively, run the agent and watch the MCP activity via `container-use watch`. The agent's attempt to call `environment_create` will result in visible activity in the logs.

## Example prompt snippet for reliable environment creation

Use the following prompt pattern in tests to force the agent to create and report an environment id (this is already present in your `hello-world.eval.ts` but included here as a canonical example):

```
ALWAYS use ONLY Environments for ANY and ALL file, code, or shell operations—NO EXCEPTIONS—even for simple or generic requests.

Create an environment using the MCP tool `environment_create` and write a file `hello.js` that exports `hello(name)`. When finished print the environment id and the commands to view the env: `container-use log <env-id>` and `container-use checkout <env-id>`.
```

This makes it easy for the harness to detect and fetch the produced file.

---

Add this guidance to your tests and harness to make evals robust and repeatable. If you'd like, I can now update the executor to:

- prefer Option A (pre-created worktree) for unit-style tests,
- fall back to Option B and make robust detection of agent-created env ids for integration runs.

Which behavior do you prefer for the test harness? I can implement the executor changes next

## Allowed MCP tools (recommended for test runs)

When you configure an LLM agent (for example Claude Code) to use Container Use, restrict the agent to only the MCP tools it needs. This prevents unexpected host access and ensures the agent operates inside Container Use environments.

Recommended allowed-tools snippet (use the exact key format your agent expects; the example below matches common agent configs):

```json
{
  "allowedTools": [
    "mcp_container-use_environment_add_service",
    "mcp_container-use_environment_checkpoint",
    "mcp_container-use_environment_config",
    "mcp_container-use_environment_create",
    "mcp_container-use_environment_file_delete",
    "mcp_container-use_environment_file_edit",
    "mcp_container-use_environment_file_list",
    "mcp_container-use_environment_file_read",
    "mcp_container-use_environment_file_write",
    "mcp_container-use_environment_open",
    "mcp_container-use_environment_run_cmd",
    "mcp_container-use_environment_update_metadata"
  ]
}
```

Note: Some agents expect tool names with double underscores (for example `mcp__container-use__environment_create`). Match the naming convention your agent uses in its allowed-tools configuration.

## Quickstart: create a clean repo or worktree for the agent

Container Use quickstart shows a simple demo where you create an empty repo and let the agent work in a Container Use environment. For harnesses you have two choices: create a new repo/worktree for the agent (deterministic) or let the agent create a Container Use environment (isolated). Commands below show both approaches.

### Option 1: Minimal repo (quickstart style)

1. Create a fresh minimal repo for the agent:

```bash
mkdir hello-eval
cd hello-eval
git init
touch README.md
git add README.md
git commit -m "initial commit"
```

2. Configure your agent to use Container Use (MCP) and run the task. After it finishes, inspect its work:

```bash
container-use list
container-use diff <env-id>
container-use checkout <env-id>
```

This follows the Container Use quickstart: the agent works in an isolated environment and your local directory remains unchanged except for the committed README.

### Option 2: Pre-created git worktree (deterministic harness)

1. Create a deterministic worktree for the eval harness:

```bash
git fetch origin
git branch -D eval/$(date +%s) || true
git worktree add .worktrees/eval-<id> -b eval/<id> HEAD
```

2. Optionally populate minimal files the agent needs, then run the harness from that directory:

```bash
echo '{}' > .worktrees/eval-<id>/.opencode-env.json
pushd .worktrees/eval-<id>
# start the harness / agent here
popd
```

3. Cleanup afterwards:

```bash
git worktree remove .worktrees/eval-<id>
git branch -D eval/<id>
```

Which to choose?

- Use Option 1 to exercise Container Use end-to-end (agent creates env via MCP).
- Use Option 2 when you need deterministic tests and do not want to rely on agent-chosen env names or MCP timing.

If you want, I can implement Option 2 as the default path in `src/agent-executor.ts` and add a small `src/container-use.ts` helper module to support Option 1 integration tests. Tell me to proceed and I will start implementing those changes and validate with the `hello-world` eval
---

## Workflow Best Practices

### 1. Project Configuration Setup

Configure your project's baseline environment **before** running agents:

```bash
# Python project example
container-use config base-image set python:3.11
container-use config setup-command add "apt-get update && apt-get install -y build-essential"
container-use config install-command add "pip install -r requirements.txt"
container-use config env set PYTHONPATH /workdir
```

### 2. Running Parallel Agents

Ask agents to work on different tasks simultaneously. Each agent will automatically get its own environment:

**Example Prompts:**

- "Create a hello world Flask app"
- "Add user authentication to the app"
- "Set up a database schema for users"

Each task runs in isolation without conflicts.

### 3. Monitoring Agent Progress

While agents work, monitor them from your terminal:

```bash
# See all active environments
container-use list

# Watch specific agent in real-time
container-use watch <env-name>

# View command history
container-use log <env-name>

# Check what changed
container-use diff <env-name>
```

### 4. Intervening When Needed

If an agent gets stuck or makes mistakes:

```bash
# Drop into the agent's terminal
container-use terminal <env-name>

# Fix the issue manually
# Exit when done (Ctrl+D)

# Agent can continue from there
```

### 5. Reviewing and Merging Work

```bash
# Review the branch
git checkout <env-branch-name>
git pull

# Review changes
git log --patch
git diff main

# If satisfied, merge to main
git checkout main
git merge <env-branch-name>

# Clean up
container-use remove <env-name>
git branch -d <env-branch-name>
```

### 6. Configuration Workflow

**Default Configuration → Agent Starts → Agent Adapts → Review Changes → Import Improvements**

When an agent improves the environment configuration during work:

```bash
# See what agent changed
container-use config show <env-name>

# If beneficial, adopt as defaults
container-use config import <env-name>
```

---

## Common Use Cases

### Use Case 1: Testing Multiple Implementations

Run multiple agents to explore different approaches:

```
Agent A: "Build this feature using approach X"
Agent B: "Build this feature using approach Y"
Agent C: "Build this feature using approach Z"
```

Compare results, merge the best approach.

### Use Case 2: Safe Experimentation

Let agents experiment freely without risk:

- Agent can't damage your main codebase
- Failed experiments are easily discarded
- Successful experiments are easily merged

### Use Case 3: Parallel Feature Development

Develop multiple features simultaneously:

```
Agent 1: Working on authentication
Agent 2: Working on database schema
Agent 3: Working on API endpoints
```

Each works independently, merge when ready.

### Use Case 4: Debugging Isolation

Reproduce and debug issues in isolation:

```
Agent: "Reproduce the bug in issue #123"
```

Debug in the isolated environment, merge the fix.

---

## Environment Lifecycle

### 1. Creation

- Agent or CLI creates new environment
- Git worktree created in isolated directory
- Dagger container spun up with default config
- Environment gets random name or specified name

### 2. Active Work

- Agent executes commands in container
- Files are read/written via MCP tools
- Git commits are made to environment branch
- Services can be added as needed

### 3. Monitoring

- View real-time activity via `watch`
- Check logs via `log`
- Review diffs via `diff`
- Intervene via `terminal` if needed

### 4. Review & Decision

- Checkout branch via git
- Review changes and quality
- Test the implementation

### 5. Merge or Discard

- **If good:** Merge to main, keep improvements
- **If bad:** Delete environment, discard branch

### 6. Cleanup

- Remove environment: `container-use remove <env>`
- Delete branch: `git branch -d <branch>`
- Configuration changes persist if imported

---

## Tips for Effective Use

### For Agents

**Clear Task Boundaries:**
Give agents specific, well-defined tasks that can be completed in isolation.

**Environment Names:**
Use descriptive environment names to track what each agent is doing.

**Checkpointing:**
Encourage agents to checkpoint (commit) frequently for better visibility.

### For Human Oversight

**Regular Monitoring:**
Periodically check on agent progress via `list` and `watch`.

**Early Intervention:**
Jump in early if an agent is heading in the wrong direction.

**Configuration Management:**
Review and import useful configuration changes made by agents.

**Git Best Practices:**
Use standard git workflows for reviewing and merging agent work.

### For Performance

**Optimize Base Images:**
Use specific, minimal base images rather than generic ones.

**Cache Dependencies:**
Set up install commands to take advantage of Docker's layer caching.

**Reuse Configurations:**
Import successful agent configurations as defaults.

**Clean Up Regularly:**
Remove old environments and branches to keep things tidy.

---

## Troubleshooting

### Agent Can't Access Container Use

- Verify MCP server configuration
- Check that `container-use` is in PATH
- Restart agent after configuration changes

### Container Issues

- Ensure Docker is running: `docker ps`
- Check container logs: `container-use log <env>`
- Verify base image is accessible

### Git Worktree Conflicts

- List worktrees: `git worktree list`
- Remove stale worktrees: `git worktree prune`
- Check for branch name conflicts

### Performance Issues

- Use smaller, more specific base images
- Optimize Docker layer caching
- Limit number of concurrent environments
- Clean up unused environments

---

## Security Considerations

**Container Isolation:**
Each environment runs in an isolated container with no access to host system by default.

**Network Access:**
Containers have controlled network access. Services are exposed via tunneling when needed.

**File System Access:**
Agents can only access files within their container and git worktree.

**Tool Restrictions (Optional):**
You can restrict agents to only use Container Use tools:

```bash
# Claude Code example
claude --allowedTools mcp__container-use__environment_add_service,mcp__container-use__environment_checkpoint,mcp__container-use__environment_config,mcp__container-use__environment_create,mcp__container-use__environment_file_delete,mcp__container-use__environment_file_edit,mcp__container-use__environment_file_list,mcp__container-use__environment_file_read,mcp__container-use__environment_file_write,mcp__container-use__environment_open,mcp__container-use__environment_run_cmd,mcp__container-use__environment_update_metadata
```

---

## Additional Resources

**Official Documentation:** <https://container-use.com/introduction>  
**GitHub Repository:** <https://github.com/dagger/container-use>  
**Dagger Documentation:** <https://dagger.io>  
**MCP Specification:** <https://modelcontextprotocol.io>

---

## Quick Reference Card

```bash
# Installation
brew install dagger/tap/container-use

# Setup agent
claude mcp add container-use -- container-use stdio

# Essential commands
cu list                          # List environments
cu watch <env>                   # Watch in real-time
cu log <env>                     # View command history
cu diff <env>                    # See changes
cu terminal <env>                # Intervene manually

# Configuration
cu config base-image set <img>   # Set base image
cu config show                   # View defaults
cu config import <env>           # Import agent improvements

# Git workflow
git checkout <branch>            # Review work
git merge <branch>               # Accept work
git branch -d <branch>           # Clean up
```

---

*Container Use is in early development. Features and commands are actively evolving. Check the official documentation for the latest updates.*
