# ZLI Command Organization Pattern

> Best practices for organizing ZLI commands with shared Zod schemas for type-safe CLI development.

## Core Principles

1. **Single Source of Truth**: Zod schemas define both runtime validation and TypeScript types
2. **Schema Separation**: Keep schemas separate from command implementations for reusability
3. **Composability**: Build complex schemas from simpler, reusable pieces
4. **Type Inference**: Let TypeScript infer types from schemas using `z.infer<typeof Schema>`
5. **Clear Boundaries**: Commands use schemas but don't define them

## Directory Structure

```text
scripts/
├── cli.ts                          # Main CLI entry point
├── schemas/                        # Reusable Zod schemas (single source of truth)
│   ├── common-options.schema.ts    # Shared CLI options (verbose, dry-run, etc.)
│   ├── output-format.schema.ts     # Output format enums (json, text, junit)
│   ├── severity.schema.ts          # Severity levels (error, warn, info)
│   ├── gates/                      # Gate-specific schemas
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
└── commands/                       # Command implementations
    ├── gates/                      # Quality gate commands
    │   ├── gate-check.ts
    │   ├── file-location.ts
    │   └── file-size.ts
    ├── validation/                 # Validation commands
    │   ├── audit.ts
    │   ├── version.ts
    │   └── docs.ts
    ├── utils/                      # Utility commands
    │   ├── status.ts
    │   └── verify.ts
    └── blog.ts                     # Blog maintenance
```text
## Schema Organization Patterns

### 1. Common Options Schema

Extract frequently used options into composable schemas:

```typescript
// scripts/schemas/common-options.schema.ts
import { z } from 'zod';

export const VerboseOptionSchema = z.object({
  verbose: z.boolean().default(false).describe('Enable verbose output'),
});

export const DryRunOptionSchema = z.object({
  dryRun: z.boolean().default(false).describe('Preview changes without applying'),
});

export const FixOptionSchema = z.object({
  fix: z.boolean().default(false).describe('Automatically fix issues'),
});

export const OutputFormatSchema = z.enum(['json', 'text', 'junit', 'compact'])
  .default('text')
  .describe('Output format');

export const SeverityLevelSchema = z.enum(['error', 'warn', 'info'])
  .default('error')
  .describe('Minimum severity level');

// Composable base options
export const CommonOptionsSchema = z.object({
  verbose: z.boolean().default(false).describe('Enable verbose output'),
  dryRun: z.boolean().default(false).describe('Preview changes without applying'),
});

export type CommonOptions = z.infer<typeof CommonOptionsSchema>;
export type OutputFormat = z.infer<typeof OutputFormatSchema>;
export type SeverityLevel = z.infer<typeof SeverityLevelSchema>;
```text
### 2. Command-Specific Schema

Build command schemas by composing common options:

```typescript
// scripts/schemas/gates/file-size.schema.ts
import { z } from 'zod';
import { CommonOptionsSchema, OutputFormatSchema, SeverityLevelSchema } from '../common-options.schema.js';

export const FileSizeCheckOptionsSchema = CommonOptionsSchema.extend({
  staged: z.boolean().default(false).describe('Check only staged files'),
  output: OutputFormatSchema,
  severity: SeverityLevelSchema,
  maxSize: z.number().optional().describe('Override default max file size (KB)'),
});

export type FileSizeCheckOptions = z.infer<typeof FileSizeCheckOptionsSchema>;

// Result schemas for type-safe outputs
export const FileSizeViolationSchema = z.object({
  file: z.string(),
  size: z.number(),
  limit: z.number(),
  severity: SeverityLevelSchema,
});

export const FileSizeResultSchema = z.object({
  success: z.boolean(),
  violations: z.array(FileSizeViolationSchema),
  checked: z.number(),
  timestamp: z.string(),
});

export type FileSizeResult = z.infer<typeof FileSizeResultSchema>;
```text
### 3. Command Implementation

Commands import and use schemas, with clear separation:

```typescript
// scripts/commands/gates/file-size.ts
import { defineCommand, defineOptions } from '@robingenz/zli';
import { FileSizeCheckOptionsSchema, type FileSizeCheckOptions } from '../../schemas/gates/file-size.schema.js';

/**
 * Check file sizes against configured limits
 */
export const fileSizeCheckCommand = defineCommand({
  description: 'Check file sizes against configured limits',
  options: defineOptions(FileSizeCheckOptionsSchema, {
    v: 'verbose',
    d: 'dryRun',
    s: 'staged',
    o: 'output',
  }),
  action: async (options: FileSizeCheckOptions) => {
    // Type-safe implementation
    if (options.verbose) {
      console.log('Running file size check with options:', options);
    }
    
    const result = await checkFileSizes(options);
    
    if (options.output === 'json') {
      console.log(JSON.stringify(result, null, 2));
    }
    
    process.exit(result.success ? 0 : 1);
  },
});

// Helper functions with proper types
async function checkFileSizes(options: FileSizeCheckOptions): Promise<FileSizeResult> {
  // Implementation...
}
```text
### 4. CLI Integration

Main CLI imports and registers all commands:

```typescript
// scripts/cli.ts
import { defineConfig, processConfig } from '@robingenz/zli';
import { fileSizeCheckCommand } from './commands/gates/file-size.js';
import { auditCommand } from './commands/validation/audit.js';
import { statusCommand } from './commands/utils/status.js';

const config = defineConfig({
  name: 'opencode',
  description: 'OpenCode Agents CLI - Type-safe development automation',
  commands: {
    // Grouped by category
    gates: {
      description: 'Quality gate checks',
      commands: {
        'file-size': fileSizeCheckCommand,
        'file-location': fileLocationCheckCommand,
        'pre-merge': preMergeCheckCommand,
      },
    },
    validate: {
      description: 'Validation commands',
      commands: {
        audit: auditCommand,
        version: versionCommand,
        docs: docsCommand,
      },
    },
    utils: {
      description: 'Utility commands',
      commands: {
        status: statusCommand,
        verify: verifyCommand,
      },
    },
    blog: blogCommand,
  },
});

processConfig(config);
```text
## Best Practices

### DO ✅

1. **Define schemas once, use everywhere**

   ```typescript
   // Schema defines both validation and types
   export const MySchema = z.object({ foo: z.string() });
   export type MyType = z.infer<typeof MySchema>;
   ```

1. **Compose from smaller schemas**

   ```typescript
   const ExtendedSchema = BaseSchema.extend({ extra: z.string() });
   ```

1. **Export both schema and type**

   ```typescript
   export const FooSchema = z.object({ /* ... */ });
   export type Foo = z.infer<typeof FooSchema>;
   ```

1. **Use descriptive schema names**

   ```typescript
   // Good
   FileSizeCheckOptionsSchema
   FileSizeViolationSchema
   
   // Bad
   OptionsSchema
   DataSchema
   ```

1. **Group related schemas by domain**

   ```
   schemas/gates/
   schemas/validation/
   schemas/utils/
   ```

1. **Document schemas with descriptions**

   ```typescript
   z.string().describe('Path to configuration file')
   ```

### DON'T ❌

1. **Don't define schemas inline in commands**

   ```typescript
   // Bad - schema defined in command
   defineOptions(z.object({ foo: z.string() }))
   
   // Good - schema imported
   defineOptions(FooOptionsSchema)
   ```

1. **Don't duplicate type definitions**

   ```typescript
   // Bad - manual type definition
   interface Options { foo: string; }
   const schema = z.object({ foo: z.string() });
   
   // Good - infer from schema
   const schema = z.object({ foo: z.string() });
   type Options = z.infer<typeof schema>;
   ```

1. **Don't mix validation logic in commands**

   ```typescript
   // Bad - validation in command
   if (typeof options.foo !== 'string') throw new Error();
   
   // Good - schema handles validation
   const validated = FooSchema.parse(options);
   ```

1. **Don't use 'any' types**

   ```typescript
   // Bad
   async function process(data: any) { }
   
   // Good
   async function process(data: ProcessInput) { }
   ```

1. **Don't skip error typing**

   ```typescript
   // Bad
   } catch (error) {
     console.log(error.message); // error is 'unknown'
   }
   
   // Good
   } catch (error) {
     if (error instanceof Error) {
       console.log(error.message);
     }
   }
   ```

## Schema Reuse Across Layers

The same schemas can be used in multiple contexts:

```typescript
// 1. CLI validation
const options = FileSizeCheckOptionsSchema.parse(cliArgs);

// 2. API endpoints (if building web service)
app.post('/api/check-size', async (req, res) => {
  const validated = FileSizeCheckOptionsSchema.parse(req.body);
  // ...
});

// 3. Configuration files
const config = FileSizeCheckOptionsSchema.parse(
  JSON.parse(fs.readFileSync('config.json'))
);

// 4. Test fixtures
const testOptions: FileSizeCheckOptions = {
  verbose: false,
  dryRun: true,
  staged: false,
  output: 'json',
  severity: 'error',
};
```text
## Migration Path

When converting existing scripts to ZLI commands:

1. **Extract schema first**
   - Identify all inputs/options
   - Create Zod schema in `scripts/schemas/`
   - Export schema and inferred type

1. **Update function signatures**
   - Replace `any` with schema-inferred types
   - Add proper error types
   - Remove manual validation

1. **Create command wrapper**
   - Import schema from separate file
   - Use `defineCommand` and `defineOptions`
   - Keep business logic separate

1. **Test with schema**
   - Use schema for test fixtures
   - Validate edge cases with `.safeParse()`
   - Ensure type safety end-to-end

## Benefits

1. **Type Safety**: TypeScript catches errors at compile time
2. **Runtime Validation**: Zod validates at runtime, catching bad inputs
3. **Single Source of Truth**: Schema defines both types and validation
4. **Reusability**: Schemas used across CLI, API, config, tests
5. **Documentation**: Schema descriptions serve as inline docs
6. **Maintainability**: Changes to schema automatically flow to all consumers
7. **Testability**: Easy to create valid test fixtures from schemas

## References

- [ZLI Documentation](https://github.com/robingenz/zli)
- [Zod Documentation](https://zod.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
