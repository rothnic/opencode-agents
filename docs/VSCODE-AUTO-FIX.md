# VS Code Auto-Fix on Save

This project is configured to automatically fix common linting issues on save in VS Code, reducing manual work and token usage for AI agents.

## Quick Setup

1. **Install recommended extensions** (VS Code will prompt):
   - `biomejs.biome` - Fast Rust-based linter/formatter for TS/JS/JSON
   - `DavidAnson.vscode-markdownlint` - Markdown linter with auto-fix
   - `vitest.explorer` - Test runner integration

1. **Reload VS Code** - Settings apply automatically from `.vscode/settings.json`

1. **Test it** - Open any `.md` file, remove blank lines around lists, save → auto-fixed!

## What Gets Auto-Fixed

### On Every Save (All File Types)

- ✅ Code formatting (Biome)
- ✅ Import organization (Biome)
- ✅ Basic code style fixes

### Markdown Files Specifically

- ✅ **Blank lines around lists** (MD032)
- ✅ **Blank lines around code fences** (MD031)
- ✅ **Code fence language specification** (MD040)
- ✅ **Heading spacing** (MD022)
- ✅ **Emphasis formatting** (MD037)
- ✅ **List indentation** (MD007)
- ✅ **Consistent list markers** (MD004)

### What's NOT Auto-Fixed (Requires Manual Fix)

- ❌ Complex refactoring
- ❌ TypeScript type errors
- ❌ Logic errors
- ❌ Test failures

## Manual Commands

If you prefer CLI or need to fix without VS Code:

```bash
# Fix all markdown issues (fast, recommended for agents)
npm run lint:md:fix

# Fix everything (code + markdown)
npm run lint:fix

# Check without fixing
npm run lint
npm run lint:md
```text
## Configuration Files

### `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[markdown]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "DavidAnson.vscode-markdownlint",
    "editor.codeActionsOnSave": {
      "source.fixAll.markdownlint": "explicit"
    }
  }
}
```text
### `.markdownlint.json`

Defines which markdown rules are enabled:

```json
{
  "default": true,
  "MD013": false,  // Line length - disabled (too strict)
  "MD033": false,  // HTML allowed
  "MD041": false   // First line doesn't need to be H1
}
```text
## Benefits for AI Agents

1. **Saves tokens** - Agents don't waste time fixing trivial formatting
2. **Faster iterations** - Fix-on-save is instant
3. **Consistent style** - No debates about formatting
4. **Focus on logic** - Agents can focus on actual problems
5. **Reduced errors** - Catch issues before commit

## Troubleshooting

### Auto-fix not working?

1. Check extensions are installed: `Cmd+Shift+X` → search for `biome` and `markdownlint`
2. Reload VS Code: `Cmd+Shift+P` → "Developer: Reload Window"
3. Check file is in workspace: Auto-fix only works for workspace files
4. Manual fix: `npm run lint:md:fix`

### Want to disable for specific files?

Add to `.markdownlint.json`:

```json
{
  "ignores": ["node_modules/**", "CHANGELOG.md"]
}
```text
## Integration with CI/CD

The same rules run in CI to ensure consistency:

```bash
# Pre-commit hook
npm run lint:staged  # Only staged files

# CI pipeline
npm run ci  # Full check (fails on violations)
```text
## Future Enhancements

- [ ] Git hook to auto-fix on commit
- [ ] Pre-push validation
- [ ] Diff-only linting (only changed lines)
- [ ] Custom rule sets per directory
- [ ] Integration with AI agent prompts
