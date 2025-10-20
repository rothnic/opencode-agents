/**
 * Common CLI Option Schemas
 *
 * Reusable Zod schemas for frequently used CLI options.
 * These schemas are composed into command-specific schemas.
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// INDIVIDUAL OPTION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verbose output option
 */
export const VerboseOptionSchema = z.object({
  verbose: z.boolean().default(false).describe('Enable verbose output'),
});

/**
 * Dry-run option (preview changes without applying)
 */
export const DryRunOptionSchema = z.object({
  dryRun: z.boolean().default(false).describe('Preview changes without applying'),
});

/**
 * Auto-fix option
 */
export const FixOptionSchema = z.object({
  fix: z.boolean().default(false).describe('Automatically fix issues'),
});

/**
 * Force option (bypass safety checks)
 */
export const ForceOptionSchema = z.object({
  force: z.boolean().default(false).describe('Force operation, bypassing safety checks'),
});

/**
 * Output format enum
 */
export const OutputFormatSchema = z
  .enum(['json', 'text', 'junit', 'compact'])
  .default('text')
  .describe('Output format');

/**
 * Severity level enum
 */
export const SeverityLevelSchema = z
  .enum(['error', 'warn', 'info'])
  .default('error')
  .describe('Minimum severity level');

/**
 * File path option
 */
export const FilePathOptionSchema = z.object({
  file: z.string().optional().describe('Path to specific file'),
});

/**
 * Directory path option
 */
export const DirectoryPathOptionSchema = z.object({
  directory: z.string().optional().describe('Path to directory'),
});

/**
 * Staged files only option (for git operations)
 */
export const StagedOptionSchema = z.object({
  staged: z.boolean().default(false).describe('Check only staged files'),
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSABLE BASE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Common options used across most commands
 */
export const CommonOptionsSchema = z.object({
  verbose: z.boolean().default(false).describe('Enable verbose output'),
  dryRun: z.boolean().default(false).describe('Preview changes without applying'),
});

/**
 * Common options for validation/checking commands
 */
export const CheckOptionsSchema = CommonOptionsSchema.extend({
  fix: z.boolean().default(false).describe('Automatically fix issues'),
  severity: SeverityLevelSchema,
  output: OutputFormatSchema,
});

/**
 * Common options for git-aware commands
 */
export const GitAwareOptionsSchema = CommonOptionsSchema.extend({
  staged: z.boolean().default(false).describe('Check only staged files'),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type VerboseOption = z.infer<typeof VerboseOptionSchema>;
export type DryRunOption = z.infer<typeof DryRunOptionSchema>;
export type FixOption = z.infer<typeof FixOptionSchema>;
export type ForceOption = z.infer<typeof ForceOptionSchema>;
export type OutputFormat = z.infer<typeof OutputFormatSchema>;
export type SeverityLevel = z.infer<typeof SeverityLevelSchema>;
export type FilePathOption = z.infer<typeof FilePathOptionSchema>;
export type DirectoryPathOption = z.infer<typeof DirectoryPathOptionSchema>;
export type StagedOption = z.infer<typeof StagedOptionSchema>;
export type CommonOptions = z.infer<typeof CommonOptionsSchema>;
export type CheckOptions = z.infer<typeof CheckOptionsSchema>;
export type GitAwareOptions = z.infer<typeof GitAwareOptionsSchema>;
