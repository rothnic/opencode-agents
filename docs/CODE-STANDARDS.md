# Code Standards

This document defines the coding standards and quality rules enforced in this repository.

## ES Modules (Required)

**Rule**: All JavaScript/TypeScript files MUST use ES modules (`import`/`export`), not CommonJS (`require`/`module.exports`).

**Why**:

- Package.json has `"type": "module"` for modern JavaScript
- TypeScript compiles to ES modules
- Better tree-shaking and static analysis
- Node.js native ESM support (v12.20+)
- Vitest requires ES modules for best performance

**Enforcement**: Biome rule `noCommonJs` set to `error` level.

**Examples**:

✅ **Correct** (ES Modules):

```javascript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadConfig() {
  return JSON.parse(readFileSync('config.json', 'utf8'));
}

export default class MyClass {}
```text
❌ **Incorrect** (CommonJS):

```javascript
const fs = require('fs');  // ERROR: Use import instead
const path = require('path');

function loadConfig() {
  return JSON.parse(fs.readFileSync('config.json', 'utf8'));
}

module.exports = { loadConfig };  // ERROR: Use export instead
```text
### Node.js Built-in Imports

**Rule**: Always use `node:` protocol for Node.js built-in modules.

✅ **Correct**:

```javascript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
```text
❌ **Incorrect**:

```javascript
import { readFileSync } from 'fs';  // Missing node: protocol
```text
**Enforcement**: Biome rule `useNodejsImportProtocol` set to `error` level.

## Inline Directives (Temporary Waivers)

Sometimes you need to temporarily bypass a linting rule. Use Biome ignore comments with **required metadata**:

### Format

```javascript
// biome-ignore lint/rule/name: Reason for waiver (Issue: #123, Expires: 2025-11-01)
```text
### Required Fields

1. **Reason**: Clear explanation of why the rule is bypassed
2. **Issue**: GitHub issue number tracking the fix
3. **Expires**: Date when this waiver should be revisited (YYYY-MM-DD)

### Examples

✅ **Correct** (Temporary waiver):

```javascript
// biome-ignore lint/style/noCommonJs: Legacy script needs refactor (Issue: #456, Expires: 2025-11-15)
const legacyModule = require('./legacy.js');
```text
✅ **Correct** (Permanent exception with justification):

```javascript
// biome-ignore lint/suspicious/noExplicitAny: Third-party API returns untyped data (Permanent, documented in #789)
function parseApiResponse(data: any) {
  return data;
}
```text
❌ **Incorrect** (Missing metadata):

```javascript
// biome-ignore lint/style/noCommonJs: TODO fix later
const fs = require('fs');
```text
### Creating GitHub Issues for Waivers

When adding a temporary waiver:

1. **Create GitHub issue** describing the problem
2. **Label** with `tech-debt` and `linting-waiver`
3. **Set milestone** based on expiration date
4. **Reference** the issue number in the ignore comment

Example issue:

```markdown
Title: Refactor gate-check.js to ES modules

Description:
- File: scripts/gate-check.js
- Rule: noCommonJs
- Expires: 2025-11-15
- Action: Convert require() to import statements

Context:
Added temporary waiver in commit abc123. Script needs ES module refactor
but blocked by [reason]. Should be completed by expiration date.
```text
## Cognitive Complexity

**Rule**: Functions should have cognitive complexity ≤ 15.

**Why**: High complexity = hard to test, maintain, and understand.

**Enforcement**: Biome rule `noExcessiveCognitiveComplexity` set to `warn` level (max: 15).

**Solution**: Refactor complex functions into smaller, focused functions.

❌ **Too Complex** (complexity: 21):

```javascript
function checkFileLocations(fix = false) {
  // 150 lines of nested if/else and loops
  // Cognitive complexity: 21
}
```text
✅ **Refactored**:

```javascript
function checkFileLocations(fix = false) {
  const violations = findViolations();
  
  if (fix) {
    return fixViolations(violations);
  }
  
  return reportViolations(violations);
}

function findViolations() {
  // Focused: just finding violations
}

function fixViolations(violations) {
  // Focused: just fixing
}
```text
## TypeScript Strict Mode

**Rule**: All TypeScript code must pass strict type checking.

**Enforcement**:

- `tsconfig.json` has `"strict": true`
- Additional checks: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`

**Examples**:

✅ **Correct**:

```typescript
function processUser(user: User): string {
  return user.name.toUpperCase();
}
```text
❌ **Incorrect**:

```typescript
function processUser(user) {  // ERROR: Implicit 'any' type
  return user.name.toUpperCase();
}
```text
## Quality Gates

All code must pass these gates before merge:

### Pre-commit Hook

1. ✅ Type checking (`npm run type-check`)
2. ✅ Linting (`npm run lint:staged`)
3. ✅ Tests (`npm run test:changed`)
4. ✅ Security audit (`npm run security`)

### CI Pipeline

1. ✅ Full type check
2. ✅ Full linting (no errors)
3. ✅ All tests pass with 80% coverage
4. ✅ No security vulnerabilities
5. ✅ No circular dependencies

### Override Options

**Option 1**: Fix the issue (preferred)

**Option 2**: Add inline directive with:

- Clear reason
- GitHub issue
- Expiration date

**Option 3**: Update Biome config if rule is wrong for the project

- Requires team discussion
- Document in this file
- Update biome.json with comment explaining why

## Best Practices Summary

| Practice | Rule | Level | Auto-fix |
|----------|------|-------|----------|
| Use ES modules | `noCommonJs` | error | ✅ Yes |
| Use `node:` protocol | `useNodejsImportProtocol` | error | ✅ Yes |
| Avoid `any` type | `noExplicitAny` | error | ❌ Manual |
| Use `===` not `==` | `noDoubleEquals` | error | ✅ Yes |
| Use `const` when possible | `useConst` | error | ✅ Yes |
| Cognitive complexity ≤15 | `noExcessiveCognitiveComplexity` | warn | ❌ Manual |
| No unused variables | `noUnusedVariables` | error | ❌ Manual |
| Template literals | `useTemplate` | warn | ✅ Yes |

## Migration Guide

Converting CommonJS to ES modules:

```bash
# Step 1: Let Biome identify all issues
npm run lint

# Step 2: Auto-fix what's possible
npm run lint:fix

# Step 3: Manually fix remaining issues
# Look for: require(), module.exports, __dirname, __filename

# Step 4: Update imports
# Before:
const fs = require('fs');
const { join } = require('path');
module.exports = { myFunc };

# After:
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
export { myFunc };

# Step 5: Handle __dirname/__filename
# Before:
const configPath = path.join(__dirname, 'config.json');

# After:
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = join(__dirname, 'config.json');

# Step 6: Verify
npm run type-check
npm test
```text
## References

- [Biome Lint Rules](https://biomejs.dev/linter/rules/)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- [Vitest ES Modules](https://vitest.dev/guide/common-errors.html#cannot-find-module)
