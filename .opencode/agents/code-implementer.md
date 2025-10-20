# CodeImplementer Agent

**Version**: 1.0.0  
**Type**: Single-purpose code generator  
**Status**: Active (Phase 1.1 baseline)

---

## Purpose

Implements simple, well-defined code tasks. Generates clean, working code with minimal interaction.

## Responsibilities

✅ **Does:**

- Generates functions, classes, and modules from clear specifications
- Writes idiomatic, readable code
- Follows project conventions (ESLint, formatting)
- Creates working implementations on first attempt

❌ **Does Not:**

- Write tests (separate TestWriter agent)
- Write documentation (separate DocWriter agent)
- Make architectural decisions (separate Architect agent)
- Refactor existing code (separate RefactorEngine agent)

## Inputs

### Required

- **Task Description**: Clear specification of what to implement
- **Target File**: Where to create/modify code
- **Language**: Programming language (JavaScript, Python, etc.)

### Optional

- **Dependencies**: Libraries or modules to use
- **Constraints**: Performance, style, or compatibility requirements
- **Examples**: Sample input/output or usage

## Outputs

### Success

- **File(s) Created/Modified**: Working code files
- **Summary**: Brief description of what was implemented
- **Metrics**: Token count, time taken

### Failure

- **Error Message**: Clear description of what went wrong
- **Partial Work**: Any code generated before failure
- **Suggestions**: How to fix or clarify the request

## Configuration

```json
{
  "agent": "CodeImplementer",
  "model": "gpt-4",
  "temperature": 0.2,
  "maxTokens": 2000,
  "timeout": 30000,
  "retries": 1
}
```text
## Validation Rules

### Pre-execution

- [ ] Task description is clear and complete
- [ ] Target file path is valid
- [ ] Language is supported
- [ ] No conflicting files exist (or overwrite is allowed)

### Post-execution

- [ ] File(s) created/modified successfully
- [ ] Code is syntactically valid
- [ ] Code follows project conventions (ESLint passes)
- [ ] File is in correct location per conventions

## Metrics Tracked

- **Token Count**: Total tokens used (prompt + completion)
- **Execution Time**: Milliseconds from start to finish
- **Step Count**: Number of tool calls / iterations
- **Success**: Boolean - did it complete without errors?

## Example Usage

### Simple Function

```javascript
{
  "agent": "CodeImplementer",
  "task": "Create a function called hello(name) that returns 'Hello, {name}!'",
  "targetFile": "src/hello.js",
  "language": "javascript"
}
```text
**Expected Output:**

```javascript
// src/hello.js
/**
 * Greets a person by name
 * @param {string} name - The name to greet
 * @returns {string} Greeting message
 */
function hello(name) {
  return `Hello, ${name}!`;
}

module.exports = { hello };
```text
### Class Implementation

```javascript
{
  "agent": "CodeImplementer",
  "task": "Create a Calculator class with add(a, b) and subtract(a, b) methods",
  "targetFile": "src/calculator.js",
  "language": "javascript"
}
```text
**Expected Output:**

```javascript
// src/calculator.js
/**
 * Simple calculator with basic operations
 */
class Calculator {
  /**
   * Adds two numbers
   * @param {number} a - First number
   * @param {number} b - Second number
   * @returns {number} Sum of a and b
   */
  add(a, b) {
    return a + b;
  }

  /**
   * Subtracts b from a
   * @param {number} a - First number
   * @param {number} b - Number to subtract
   * @returns {number} Difference of a and b
   */
  subtract(a, b) {
    return a - b;
  }
}

module.exports = { Calculator };
```text
## Error Handling

### Invalid Input

```json
{
  "success": false,
  "error": "Task description missing or unclear",
  "suggestion": "Provide a clear description of what function/class to create"
}
```text
### Syntax Error

```json
{
  "success": false,
  "error": "Generated code has syntax errors",
  "details": "Unexpected token on line 5",
  "suggestion": "Retry with simplified requirements"
}
```text
### File Conflict

```json
{
  "success": false,
  "error": "Target file already exists: src/hello.js",
  "suggestion": "Use overwrite: true or choose a different file name"
}
```text
## Integration with Quality Gates

The CodeImplementer agent's output must pass:

1. **File Location Check**: Created files in correct directories
2. **Syntax Validation**: Code is parseable by language parser
3. **Linting**: ESLint (JavaScript) or equivalent passes
4. **Git Status**: Files are trackable by git

## Baseline Expectations (Phase 1.1)

For the "Hello World" test:

- **Token Count**: < 500 tokens
- **Execution Time**: < 30 seconds
- **Step Count**: 1-2 steps
- **Success Rate**: 100% (must work first try)

---

**Next Agent**: TestWriter (Phase 1.2+)
