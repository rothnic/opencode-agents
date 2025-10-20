/**
 * Project Status Schemas
 *
 * Type-safe schemas for comprehensive project status reporting.
 */

import { z } from 'zod';
import { CommonOptionsSchema, OutputFormatSchema } from '../common-options.schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const StatusOptionsSchema = CommonOptionsSchema.extend({
  output: OutputFormatSchema,
  section: z
    .enum([
      'package',
      'git',
      'dependencies',
      'tests',
      'lint',
      'types',
      'coverage',
      'structure',
      'all',
    ])
    .default('all')
    .describe('Which status section to show'),
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const PackageInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  type: z.string(),
});

export const GitInfoSchema = z.object({
  branch: z.string(),
  commits: z.number(),
  uncommitted: z.number(),
  lastCommit: z.string(),
  remote: z.string(),
});

export const DependencyStatsSchema = z.object({
  total: z.number(),
  dependencies: z.number(),
  devDependencies: z.number(),
  outdated: z.number(),
});

export const TestStatsSchema = z.object({
  framework: z.string(),
  total: z.number(),
  passed: z.number(),
  failed: z.number(),
  duration: z.number().optional(),
});

export const LintStatsSchema = z.object({
  tool: z.string(),
  errors: z.number(),
  warnings: z.number(),
  files: z.number(),
});

export const TypeCheckStatsSchema = z.object({
  errors: z.number(),
  warnings: z.number(),
  files: z.number(),
});

export const CoverageStatsSchema = z.object({
  lines: z.number(),
  statements: z.number(),
  functions: z.number(),
  branches: z.number(),
});

export const ProjectStructureSchema = z.object({
  scripts: z.number(),
  tests: z.number(),
  docs: z.number(),
  configs: z.number(),
  rootFiles: z.number(),
});

export const ProjectStatusSchema = z.object({
  package: PackageInfoSchema,
  git: GitInfoSchema,
  dependencies: DependencyStatsSchema,
  tests: TestStatsSchema.optional(),
  lint: LintStatsSchema.optional(),
  types: TypeCheckStatsSchema.optional(),
  coverage: CoverageStatsSchema.optional(),
  structure: ProjectStructureSchema,
  timestamp: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type StatusOptions = z.infer<typeof StatusOptionsSchema>;
export type PackageInfo = z.infer<typeof PackageInfoSchema>;
export type GitInfo = z.infer<typeof GitInfoSchema>;
export type DependencyStats = z.infer<typeof DependencyStatsSchema>;
export type TestStats = z.infer<typeof TestStatsSchema>;
export type LintStats = z.infer<typeof LintStatsSchema>;
export type TypeCheckStats = z.infer<typeof TypeCheckStatsSchema>;
export type CoverageStats = z.infer<typeof CoverageStatsSchema>;
export type ProjectStructure = z.infer<typeof ProjectStructureSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
