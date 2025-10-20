# IDE Integration and Guardrail System Design

**Created**: 2025-10-19  
**Status**: Design  
**Related**: documentation-conventions-system.md, branch-workflow-with-test-coverage.md

---

## Overview

This document outlines enhancements to our conventions and quality gate system to provide:

1. **Real-time IDE feedback** for convention violations
2. **Document consolidation detection** to prevent documentation sprawl
3. **Human override mechanisms** for guardrail exceptions
4. **File size limits** to improve maintainability and agent editing success
5. **YAML over JSON** where possible for easier editing

---

## 1. IDE Integration: Real-Time Convention Feedback

### Problem

Currently, convention violations are only detected during:

- Pre-commit hooks (too late - work already done)
- Manual script execution (requires developers to remember)

Agents and developers need **immediate feedback** as they write/edit files.

### Solution: VS Code Diagnostics API

#### Approach A: Custom VS Code Extension (Recommended)

Create a lightweight extension that:

- Watches for file changes in `docs/**`
- Runs validation rules from `conventions.yaml`
- Shows squiggly underlines and problems panel entries
- Provides quick-fix actions (rename, move file)

**Benefits**:

- Real-time feedback while typing
- Integrates with VS Code's native UI (Problems panel)
- Can provide auto-fix actions
- Works for both humans and agents (agents see diagnostics too)

**Implementation**:

```typescript
// .vscode-extension/src/diagnosticsProvider.ts
import * as vscode from 'vscode';
import { validateConventions } from './validator';

export class ConventionDiagnostics {
  private diagnosticCollection: vscode.DiagnosticCollection;
  
  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('opencode-conventions');
  }
  
  async updateDiagnostics(document: vscode.TextDocument) {
    if (!document.uri.fsPath.includes('/docs/')) {
      return;
    }
    
    const violations = await validateConventions(document.uri.fsPath);
    const diagnostics: vscode.Diagnostic[] = [];
    
    for (const violation of violations) {
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0), // File-level issue
        violation.message,
        violation.level === 'error' 
          ? vscode.DiagnosticSeverity.Error 
          : vscode.DiagnosticSeverity.Warning
      );
      diagnostic.source = 'opencode-conventions';
      diagnostic.code = violation.ruleId;
      diagnostics.push(diagnostic);
    }
    
    this.diagnosticCollection.set(document.uri, diagnostics);
  }
}
```text
#### Approach B: ESLint-Style Configuration (Simpler)

Use existing linting infrastructure:

- Create `.markdownlint.json` for markdown conventions
- Extend with custom rules via plugin

**Benefits**:

- No custom extension needed
- Leverages existing VS Code markdown extension
- Simpler to maintain

**Limitations**:

- Less flexible than custom extension
- Harder to implement file location rules
- Limited to markdown-specific rules

#### Recommended: Hybrid Approach

1. **Phase 1**: Custom VS Code extension for file organization rules
2. **Phase 2**: Integrate with markdownlint for content rules
3. Keep `scripts/docs-conventions.js` for CI/CD enforcement

### Configuration

```yaml
# .vscode/settings.json additions
{
  "opencode.conventions.enabled": true,
  "opencode.conventions.autoFix": false,
  "opencode.conventions.showInProblems": true,
  "opencode.conventions.level": "warning" // or "error"
}
```text
---

## 2. Document Consolidation Detection

### Problem

Agents create multiple overlapping documents:

- `test-strategy.md`, `testing-approach.md`, `test-plan.md` (all about testing)
- `architecture.md`, `system-design.md`, `technical-overview.md` (all about architecture)

This creates:

- Confusion about canonical source
- Duplicate information
- Maintenance burden
- Stale/conflicting information

### Solution: Semantic Similarity Analysis

#### Pre-Merge Check: Document Overlap Detection

```javascript
// scripts/check-document-overlap.js

/**
 * Detects potentially overlapping or duplicate documents
 * Uses title similarity and content similarity
 */

async function checkDocumentOverlap() {
  const docs = getAllDocs();
  const overlaps = [];
  
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const similarity = calculateSimilarity(docs[i], docs[j]);
      
      if (similarity > 0.7) { // 70% similar
        overlaps.push({
          files: [docs[i].path, docs[j].path],
          similarity: similarity,
          reason: getSimilarityReason(docs[i], docs[j]),
          suggestion: suggestConsolidation(docs[i], docs[j])
        });
      }
    }
  }
  
  return overlaps;
}

function calculateSimilarity(doc1, doc2) {
  // Title similarity (50% weight)
  const titleSimilarity = levenshteinSimilarity(doc1.title, doc2.title);
  
  // Heading overlap (30% weight)
  const headingOverlap = calculateHeadingOverlap(doc1.headings, doc2.headings);
  
  // Topic similarity (20% weight) - via keyword extraction
  const topicSimilarity = calculateTopicSimilarity(doc1.keywords, doc2.keywords);
  
  return (titleSimilarity * 0.5) + (headingOverlap * 0.3) + (topicSimilarity * 0.2);
}

function suggestConsolidation(doc1, doc2) {
  // Suggest which file to keep and merge into
  const sizes = [doc1.lines, doc2.lines];
  const newest = doc1.modified > doc2.modified ? doc1 : doc2;
  const oldest = doc1.modified <= doc2.modified ? doc1 : doc2;
  
  return {
    action: 'merge',
    keepFile: newest.path,
    mergeFrom: oldest.path,
    reason: `${newest.path} is newer (${newest.modified}) and more complete (${newest.lines} lines)`,
    steps: [
      `1. Review both files for unique content`,
      `2. Merge unique sections from ${oldest.path} into ${newest.path}`,
      `3. Delete ${oldest.path}`,
      `4. Update any links to ${oldest.path}`
    ]
  };
}
```text
#### Integration with WORK-VERIFICATION.md

Add consolidation check to pre-merge validation:

```markdown
## Documentation Health

- [ ] No duplicate/overlapping documents detected
- [ ] All new documents have clear, unique purpose
- [ ] Existing documents reviewed for consolidation opportunities
```text
#### Agent Prompts

Add to `.opencode/agents/*.md`:

```markdown
### Before Creating New Documentation

**ALWAYS check for existing documents first**:

1. Search for similar topics: `grep -r "topic" docs/`
2. Review document titles in the target directory
3. If similar document exists, update it instead of creating new
4. Only create new document if topic is genuinely distinct

**Document Purpose Test**:
Can you describe this document's purpose in ONE sentence that doesn't overlap with existing docs?
- ✅ YES → Create new document
- ❌ NO → Update existing document or consolidate
```text
---

## 3. Human Override Mechanism

### Problem

Guardrails are essential but sometimes need exceptions:

- **Hotfixes**: Critical bug requires immediate merge
- **Special cases**: One-off deviations from conventions
- **Experimental work**: Trying new approaches

Agents must follow guardrails, but humans should be able to override with proper tracking.

### Solution: Approval-Based Override System

#### Override Mechanism

```bash
# .opencode/override.yaml
overrides:
  - id: hotfix-2025-10-19-auth-bug
    created: 2025-10-19T14:30:00Z
    creator: human:nroth
    reason: "Critical auth bypass, needs immediate deploy"
    skipChecks:
      - test-coverage
      - work-verification
    expiresAt: 2025-10-19T18:00:00Z  # Auto-expires after 4 hours
    followUpIssue: "#123"  # Must create issue to address skipped checks
    
  - id: experimental-new-architecture
    created: 2025-10-15T10:00:00Z
    creator: human:nroth
    reason: "Exploring new test framework, conventions don't apply yet"
    skipChecks:
      - docs-conventions
    branch: experiment/new-test-framework
    expiresAt: null  # No expiration for experimental branches
```text
#### Pre-Merge Check Integration

```javascript
// scripts/pre-merge-check.js enhancement

function checkForOverride(branchName, checkType) {
  const overrides = loadOverrides();
  
  for (const override of overrides) {
    // Check if override applies to this branch and check type
    if (override.branch === branchName || override.branch === '*') {
      if (override.skipChecks.includes(checkType)) {
        // Check expiration
        if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
          console.warn(`⚠️  Override ${override.id} has expired`);
          return null;
        }
        
        console.log(`✅ Override active: ${override.id}`);
        console.log(`   Reason: ${override.reason}`);
        console.log(`   Creator: ${override.creator}`);
        if (override.followUpIssue) {
          console.log(`   Follow-up: ${override.followUpIssue}`);
        }
        
        return override;
      }
    }
  }
  
  return null;
}
```text
#### Agent Rules

Add to agent specifications:

```markdown
### Guardrail Override Policy

**Agents CANNOT override guardrails**. If a guardrail blocks your work:

1. **Stop and explain** the conflict to the user
2. **Ask for guidance**: "Should I create an override for [check]?"
3. **If user approves**:
   - User creates override entry in `.opencode/override.yaml`
   - User specifies reason, expiration, follow-up issue
   - Agent proceeds with work
4. **If user denies**: Fix the issue properly

**Exception**: Agent acting on explicit human instruction:
- Issue labeled `urgent` + `skip-guardrails`
- User message contains "skip guardrails" or "emergency deploy"
- Agent must still create follow-up issue for any skipped checks
```text
#### CLI Helper

```bash
# scripts/create-override.js
node scripts/create-override.js \
  --reason "Critical auth bug needs immediate deploy" \
  --skip test-coverage,work-verification \
  --expires 4h \
  --issue "#123"
```text
---

## 4. File Size Limits

### Problem

Large files cause issues:

- **For agents**: JSON parsing errors, editing failures, context overflow
- **For humans**: Hard to read, slow to load, difficult to navigate
- **For CI/CD**: Slow processing, large diffs

Common culprits:

- `conventions.json` (too much configuration)
- Generated test evidence files
- Comprehensive architecture docs (10+ pages)

### Solution: Multi-Layered Approach

#### 4.1. Quality Gate: File Size Check

```javascript
// scripts/gate-check-file-size.js

const SIZE_LIMITS = {
  '.json': 500,      // lines
  '.md': 800,        // lines
  '.js': 600,        // lines
  '.yaml': 400,      // lines
  'default': 1000    // lines
};

const EXCEPTIONS = [
  'package-lock.json',
  'test-evidence/**',
  'node_modules/**'
];

function checkFileSize(file) {
  const lines = countLines(file);
  const ext = path.extname(file);
  const limit = SIZE_LIMITS[ext] || SIZE_LIMITS.default;
  
  if (lines > limit) {
    return {
      error: true,
      file: file,
      lines: lines,
      limit: limit,
      message: `File exceeds size limit: ${lines} lines (max ${limit})`,
      suggestions: getSplitSuggestions(file, lines, limit)
    };
  }
  
  return { error: false };
}

function getSplitSuggestions(file, lines, limit) {
  const ext = path.extname(file);
  
  if (ext === '.json') {
    return [
      'Split into multiple JSON files by category',
      'Convert to YAML (typically 20-30% smaller)',
      'Extract large arrays/objects to separate files'
    ];
  }
  
  if (ext === '.md') {
    return [
      'Split into multiple documents by topic',
      'Move detailed sections to separate files with links',
      'Consider if content belongs in multiple smaller guides'
    ];
  }
  
  if (ext === '.js') {
    return [
      'Split into multiple modules',
      'Extract functions into separate files',
      'Move constants/config to separate file'
    ];
  }
  
  return ['Consider splitting this file into smaller, focused files'];
}
```text
#### 4.2. Agent Instructions

Add to `.opencode/agents/code-implementer.md`:

```markdown
### File Size Guidelines

**BEFORE creating or editing a file, check its size**:

```bash
wc -l <file>  # Count lines
```text
**Limits**:

- JSON: 500 lines max → Use YAML instead
- Markdown: 800 lines max → Split into multiple docs
- JavaScript: 600 lines max → Split into modules
- YAML: 400 lines max → Split by category

**If file exceeds limit**:

1. DO NOT add to it
2. Propose splitting strategy to user
3. Create new files as needed
4. Update imports/links

**Splitting Strategies**:

- **Config files**: Split by feature/domain (e.g., `conventions-docs.yaml`, `conventions-code.yaml`)
- **Documentation**: One topic per file, link between them
- **Code**: One module/class per file, clear responsibilities

```text
---

## 5. YAML over JSON

### Problem
JSON is error-prone for agents:
- No comments allowed
- Strict syntax (trailing commas, quotes)
- Hard to read when nested
- Agents frequently introduce syntax errors

YAML advantages:
- Comments supported (inline documentation)
- More forgiving syntax
- More readable, less verbose
- Better for configuration files

### Solution: Convert Configuration to YAML

#### 5.1. Convert conventions.json → conventions.yaml

**Before** (conventions.json - 105 lines):
```json
{
  "version": "1.0.0",
  "documentation": {
    "fileOrganization": {
      "rules": [
        {
          "id": "docs-root-limited",
          "level": "error",
          "description": "Only specific files allowed in docs root",
          "allowed": [
            "README.md",
            "GETTING-STARTED.md",
            "SUMMARY.md"
          ],
          "message": "Files in docs/ root should be limited to README, GETTING-STARTED, or SUMMARY"
        }
      ]
    }
  }
}
```text
**After** (conventions.yaml - ~70 lines, 33% reduction):

```yaml
version: 1.0.0

documentation:
  fileOrganization:
    rules:
      # Only allow specific top-level docs
      - id: docs-root-limited
        level: error
        description: Only specific files allowed in docs root
        scope: '^docs/[^/]+\.md$'
        allowed:
          - README.md
          - GETTING-STARTED.md
          - SUMMARY.md
        message: Files in docs/ root should be limited to README, GETTING-STARTED, or SUMMARY
        suggestions:
          # Architecture-related docs
          - pattern: architecture|design|system|quality|gate|decision|test
            directory: docs/architecture/
          # Planning-related docs
          - pattern: plan|roadmap|phase|milestone
            directory: docs/planning/
          # How-to guides
          - pattern: guide|how-to|tutorial|config
            directory: docs/guides/

      # Consistent naming convention
      - id: consistent-naming
        level: error
        description: Documentation files should use lowercase-with-dashes
        scope: '^docs/.+\.md$'
        validator: '^[a-z0-9-]+\.md$'
        exceptions:
          - README.md
          - GETTING-STARTED.md
          - SUMMARY.md
        message: Use lowercase-with-dashes for documentation files
```text
Benefits:

- Inline comments explain each rule
- More readable structure
- Shorter (YAML is typically 20-40% smaller)
- Easier for agents to edit (more forgiving syntax)

#### 5.2. Update Scripts to Support YAML

```javascript
// scripts/docs-conventions.js

const fs = require('fs');
const yaml = require('js-yaml');

function loadConventions() {
  // Try YAML first (preferred)
  if (fs.existsSync('.opencode/conventions.yaml')) {
    const content = fs.readFileSync('.opencode/conventions.yaml', 'utf8');
    return yaml.load(content);
  }
  
  // Fall back to JSON (legacy)
  if (fs.existsSync('.opencode/conventions.json')) {
    const content = fs.readFileSync('.opencode/conventions.json', 'utf8');
    return JSON.parse(content);
  }
  
  throw new Error('No conventions file found (.yaml or .json)');
}
```text
#### 5.3. Migration Plan

1. **Install js-yaml**: `npm install --save-dev js-yaml`
2. **Convert existing JSON to YAML**: Use online converter or script
3. **Update all scripts** to load YAML first, JSON as fallback
4. **Keep both formats** during transition period
5. **Deprecate JSON** after all agents updated
6. **Document in GETTING-STARTED.md**: "Always use YAML for config"

---

## 6. Implementation Plan

### Phase 1: Critical Fixes (This Sprint)

1. ✅ Convert conventions.json to conventions.yaml
2. ✅ Add file size check to quality gates
3. ✅ Create document overlap detection script
4. ✅ Design override system (`.opencode/override.yaml`)

### Phase 2: IDE Integration (Next Sprint)

1. Create VS Code extension for convention diagnostics
2. Integrate with Problems panel
3. Add quick-fix actions (rename, move file)
4. Test with agents (do they see diagnostics?)

### Phase 3: Advanced Features (Future)

1. Semantic document similarity (vs simple keyword matching)
2. Auto-consolidation suggestions
3. Override workflow CLI tools
4. Dashboard for override tracking

---

## 7. Agent Instructions Update

All agent specs (`.opencode/agents/*.md`) need these additions:

```markdown
## Quality and Conventions

### File Size Limits
- Check file size before editing: `wc -l <file>`
- JSON max 500 lines → Use YAML instead
- Markdown max 800 lines → Split into multiple docs
- If file too large: propose split, don't edit directly

### Configuration Format
- **ALWAYS use YAML** for configuration (`.yaml` not `.json`)
- YAML is easier to edit and less error-prone
- Supports comments for documentation
- More forgiving syntax

### Document Consolidation
- **Before creating new doc**: Search for similar existing docs
- If similar doc exists: update it instead
- If overlap found: propose consolidation to user
- One topic per document, clear unique purpose

### Guardrail Overrides
- **You CANNOT skip guardrails** without human approval
- If blocked by guardrail: explain issue, ask for override
- User creates override in `.opencode/override.yaml`
- Never create overrides yourself

### IDE Integration
- Your edits will show real-time validation in the IDE
- Pay attention to diagnostics in Problems panel
- Fix violations before committing
```text
---

## 8. Configuration

### .vscode/settings.json

```json
{
  "opencode.conventions.enabled": true,
  "opencode.fileSizeLimit.enabled": true,
  "opencode.documentOverlap.enabled": true,
  "opencode.preferYaml": true
}
```text
### .opencode/quality-gates.yaml

```yaml
gates:
  - name: file-size-check
    script: scripts/gate-check-file-size.js
    level: error
    
  - name: document-overlap
    script: scripts/check-document-overlap.js
    level: warning  # Warning only, requires human review
    
  - name: conventions-check
    script: scripts/docs-conventions.js
    args: [--staged]
    level: error
```text
---

## Success Metrics

### Short Term (1 week)

- [ ] Zero JSON syntax errors from agents
- [ ] File size violations detected before commit
- [ ] YAML conventions file in use

### Medium Term (1 month)

- [ ] <5 overlapping documents in repository
- [ ] IDE integration working in VS Code
- [ ] At least 1 human override used successfully

### Long Term (3 months)

- [ ] 90%+ agent compliance with conventions (no violations)
- [ ] Zero files >1000 lines
- [ ] All configuration in YAML format
- [ ] Document overlap <2% of total docs

---

## References

- **VS Code Extension API**: <https://code.visualstudio.com/api>
- **Diagnostics API**: <https://code.visualstudio.com/api/language-extensions/programmatic-language-features#provide-diagnostics>
- **js-yaml Library**: <https://github.com/nodeca/js-yaml>
- **Related Designs**: documentation-conventions-system.md, branch-workflow-with-test-coverage.md
