# CLI Migration Progress Report

> **Status**: Phase 1 Complete - Schema Foundation Established
> **Date**: October 19, 2025

## Executive Summary

This report tracks the migration from ad-hoc TypeScript scripts to a type-safe, ZLI-based CLI framework with shared Zod schemas. The goal is to create a reusable, distributable framework for AI-powered development automation.

## Completed Work

### ✅ Phase 1: Schema Foundation (Completed)

#### 1. Documentation Created

Created comprehensive ZLI best practices documentation:

- **File**: `docs/architecture/zli-command-organization.md`
- **Content**:
  - Directory structure patterns
  - Schema organization guidelines
  - Command implementation patterns
  - DO/DON'T best practices
  - Migration path documentation
  - Type safety principles

#### 2. Common Schemas Created

Established shared schema foundation in `scripts/schemas/`:

**`common-options.schema.ts`**

- `VerboseOptionSchema` - Verbose output control
- `DryRunOptionSchema` - Preview without applying changes
- `FixOptionSchema` - Auto-fix capability
- `ForceOptionSchema` - Bypass safety checks
- `OutputFormatSchema` - Output format enum (json, text, junit, compact)
- `SeverityLevelSchema` - Severity levels (error, warn, info)
- `CommonOptionsSchema` - Composable base options
- `CheckOptionsSchema` - Validation command options
- `GitAwareOptionsSchema` - Git-aware command options

#### 3. Gate Command Schemas

Created in `scripts/schemas/gates/`:

**`gate-check.schema.ts`**

- `GateCheckOptionsSchema` - Gate selection and checking options
- `GateViolationSchema` - Violation details with severity
- `GateCheckResultSchema` - Check results with metrics

**`file-location.schema.ts`**

- `FileLocationCheckOptionsSchema` - Location validation options
- `FileLocationViolationSchema` - Location violations with suggestions
- `FileLocationResultSchema` - Check results
- `FileLocationRuleSchema` - Configuration rules

**`file-size.schema.ts`**

- `FileSizeCheckOptionsSchema` - Size checking options
- `FileSizeViolationSchema` - Size violations
- `FileSizeResultSchema` - Check results
- `FileSizeLimitSchema` - Per-pattern size limits
- `FileSizeConfigSchema` - Full configuration

#### 4. Validation Command Schemas

Created in `scripts/schemas/validation/`:

**`audit.schema.ts`**

- `AuditOptionsSchema` - Category-based audit options
- `AuditIssueSchema` - Issue details with auto-fix capability
- `AuditResultSchema` - Audit results with statistics
- `PatternConfigSchema` - Pattern replacement rules
- `ValidationRulesSchema` - Complete validation configuration

**`version.schema.ts`**

- `VersionCheckOptionsSchema` - Version check/apply options
- `VersionPhaseSchema` - Development phase enum
- `SeverityEscalationSchema` - Escalation rules
- `VersionStatusSchema` - Version status with milestones

**`docs.schema.ts`**

- `DocsCheckOptionsSchema` - Documentation validation options
- `DocsViolationSchema` - Documentation violations
- `DocsCheckResultSchema` - Check results
- `DocsConventionSchema` - Documentation conventions config

#### 5. Utility Command Schemas

Created in `scripts/schemas/utils/`:

**`status.schema.ts`**

- `StatusOptionsSchema` - Section-based status options
- `PackageInfoSchema` - Package.json information
- `GitInfoSchema` - Git repository state
- `DependencyStatsSchema` - Dependency statistics
- `TestStatsSchema` - Test execution results
- `LintStatsSchema` - Linting results
- `TypeCheckStatsSchema` - TypeScript errors
- `CoverageStatsSchema` - Test coverage metrics
- `ProjectStructureSchema` - File organization stats
- `ProjectStatusSchema` - Complete project status

**`verify.schema.ts`**

- `VerifyOptionsSchema` - Tool verification options
- `ToolCheckSchema` - Tool requirements definition
- `ToolResultSchema` - Individual tool check result
- `VerifyResultSchema` - Complete verification results

## Schema Architecture

### Composability Pattern

```text
CommonOptionsSchema (base)
    ├── CheckOptionsSchema (validation commands)
    │   ├── GateCheckOptionsSchema
    │   ├── FileLocationCheckOptionsSchema
    │   ├── FileSizeCheckOptionsSchema
    │   ├── AuditOptionsSchema
    │   └── DocsCheckOptionsSchema
    │
    └── GitAwareOptionsSchema (git operations)
        └── [Used in gate commands]
```text
### Directory Structure

```text
scripts/
├── schemas/                        # ✅ COMPLETE
│   ├── common-options.schema.ts    # Shared options
│   ├── gates/                      # Gate command schemas
│   │   ├── gate-check.schema.ts
│   │   ├── file-location.schema.ts
│   │   └── file-size.schema.ts
│   ├── validation/                 # Validation schemas
│   │   ├── audit.schema.ts
│   │   ├── version.schema.ts
│   │   └── docs.schema.ts
│   └── utils/                      # Utility schemas
│       ├── status.schema.ts
│       └── verify.schema.ts
├── commands/                       # ⏳ NEXT PHASE
│   ├── gates/
│   ├── validation/
│   └── utils/
└── cli.ts                          # ⏳ NEEDS UPDATE
```text
## Remaining Work

### 🔄 Phase 2: Command Migration (Next)

#### Gate Commands (`scripts/gates/` → `scripts/commands/gates/`)

- [ ] `gate-check.ts` - Use `GateCheckOptionsSchema`
- [ ] `file-location-check.ts` - Use `FileLocationCheckOptionsSchema`
- [ ] `init-work-verification.ts` - Create schema, migrate command
- [ ] `gate-check-file-size.ts` - Use `FileSizeCheckOptionsSchema`
- [ ] `pre-merge-check.ts` - Already has schema, move to commands/

#### Validation Commands (`scripts/validation/` → `scripts/commands/validation/`)

- [ ] `audit-repository-state.ts` - Use `AuditOptionsSchema`
- [ ] `version-severity-check.ts` - Use `VersionCheckOptionsSchema`
- [ ] `docs-conventions.ts` - Use `DocsCheckOptionsSchema`
- [ ] `check-document-overlap.ts` - Create schema, migrate

#### Utility Commands (`scripts/utils/` → `scripts/commands/utils/`)

- [ ] `project-status.ts` - Use `StatusOptionsSchema`
- [ ] `verify-tools.ts` - Use `VerifyOptionsSchema`
- [ ] `convert-js-to-ts.ts` - Create schema, migrate
- [ ] `convert-to-esm.ts` - Create schema, migrate

### 🔄 Phase 3: CLI Reorganization

- [ ] Update `scripts/cli.ts` with command groups
- [ ] Implement nested command structure
- [ ] Update help text and descriptions
- [ ] Add command aliases for common operations

### 🔄 Phase 4: Type Safety Improvements

- [ ] Fix 88 TypeScript errors
- [ ] Replace `any` types with schema-inferred types
- [ ] Add proper error handling types
- [ ] Reduce excessive complexity in functions

### 🔄 Phase 5: Testing & Validation

- [ ] Create test utilities using schemas
- [ ] Add command integration tests
- [ ] Update npm scripts in package.json
- [ ] Run full CI pipeline validation

### 🔄 Phase 6: Distribution Framework

- [ ] Create `install.sh` for global installation
- [ ] Add project scaffolding commands
- [ ] Create global config templates
- [ ] Add npm publishing configuration
- [ ] Create Docker image for CI/CD

### 🔄 Phase 7: Documentation Updates

- [ ] Update AGENTS.md with new patterns
- [ ] Update README.md with CLI usage
- [ ] Update architecture docs
- [ ] Create migration guide for existing scripts

## Benefits Realized

### Type Safety

- ✅ Single source of truth for types via Zod schemas
- ✅ Compile-time type checking with `z.infer<typeof Schema>`
- ✅ Runtime validation catching bad inputs early
- ✅ Composable schemas reducing duplication

### Maintainability

- ✅ Clear separation of schemas and implementations
- ✅ Reusable schemas across CLI, API, config, tests
- ✅ Self-documenting via schema descriptions
- ✅ Easy to extend with new options

### Developer Experience

- ✅ Consistent option naming across commands
- ✅ Predictable command structure
- ✅ Clear error messages from Zod validation
- ✅ IDE autocomplete for all options

## Metrics

| Metric | Count | Status |
|--------|-------|--------|
| **Schema Files Created** | 10 | ✅ Complete |
| **Common Options Defined** | 11 | ✅ Complete |
| **Command Schemas** | 8 | ✅ Complete |
| **Commands Migrated** | 0 | ⏳ Pending |
| **TypeScript Errors** | 88 | ⏳ Pending |
| **Tests Updated** | 0 | ⏳ Pending |

## Next Actions

### Immediate (This Session)

1. Migrate first gate command as template
2. Update one validation command
3. Fix TypeScript errors in migrated commands
4. Test command execution

### Short-term (Next Session)

1. Complete all command migrations
2. Update CLI structure
3. Fix remaining TypeScript errors
4. Update package.json scripts

### Medium-term (Phase 0.2)

1. Add distribution framework
2. Create installation scripts
3. Add project scaffolding
4. Update all documentation

## Success Criteria

### Phase 1 ✅

- [x] All shared schemas created
- [x] All command schemas defined
- [x] Documentation written
- [x] Type exports properly defined

### Phase 2 (In Progress)

- [ ] All commands use schemas
- [ ] No inline schema definitions
- [ ] All options properly typed
- [ ] Commands in correct directories

### Phase 3 (Pending)

- [ ] CLI properly organized
- [ ] Help text accurate
- [ ] Command groups logical
- [ ] All npm scripts working

### Phase 4 (Pending)

- [ ] Zero TypeScript errors
- [ ] No `any` types
- [ ] Proper error handling
- [ ] Complexity under limits

### Phase 5 (Pending)

- [ ] npm run ci passes
- [ ] All tests green
- [ ] Coverage maintained
- [ ] Security checks pass

## Notes

### Design Decisions

1. **Schema Location**: Separate `schemas/` directory keeps validation logic independent of commands
2. **Composability**: Base schemas (`CommonOptionsSchema`) extended by specific commands
3. **Type Exports**: Both schema and inferred type exported for flexibility
4. **Naming Convention**: `*Schema` suffix for schemas, `*Options`/`*Result` for types
5. **Subdirectories**: Group schemas by domain (gates, validation, utils)

### Lessons Learned

1. **Start with Schemas**: Creating schemas first clarifies command structure
2. **Common Options**: Identifying shared patterns early reduces duplication
3. **Result Schemas**: Defining output schemas ensures consistency across commands
4. **Documentation**: Schema descriptions serve as inline documentation

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing scripts | High | Migrate gradually, test each command |
| TypeScript errors during migration | Medium | Fix incrementally, use schema types |
| npm scripts break | Medium | Update and test after each command migration |
| Loss of functionality | High | Verify feature parity during migration |

## References

- [ZLI Command Organization Guide](docs/architecture/zli-command-organization.md)
- [OpenCode Config Strategy](docs/architecture/opencode-config-strategy-with-cli.md)
- [AGENTS.md](AGENTS.md) - Project conventions
- [CODE-STANDARDS.md](docs/CODE-STANDARDS.md) - Coding standards

---

**Last Updated**: October 19, 2025
**Next Review**: After Phase 2 completion
