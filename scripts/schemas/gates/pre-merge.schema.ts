/**
 * Pre-Merge Check Command Schemas
 *
 * Type-safe schemas for pre-merge validation operations.
 */

import { z } from 'zod';
import { CheckOptionsSchema } from '../common-options.schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const PreMergeConfigSchema = z.object({
  requireWorkVerification: z.boolean().default(true),
  requireTests: z.boolean().default(true),
  minCoverageIncrease: z.number().default(0),
  allowedWithoutTests: z.array(z.string()).default(['docs/', 'chore/']),
});

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION MESSAGE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const ValidationMessageSchema = z.object({
  message: z.string(),
  fix: z.string().nullable().optional(),
});

export const ValidationResultDataSchema = z.object({
  errors: z.array(ValidationMessageSchema).default([]),
  warnings: z.array(ValidationMessageSchema).default([]),
  info: z.array(ValidationMessageSchema).default([]),
});

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const PreMergeCheckOptionsSchema = CheckOptionsSchema.extend({
  branch: z.string().optional().describe('Branch to check (defaults to current)'),
  skipTests: z.boolean().default(false).describe('Skip running tests'),
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const PreMergeCheckResultSchema = z.object({
  success: z.boolean(),
  branch: z.string(),
  branchType: z.string(),
  validationResult: ValidationResultDataSchema,
  timestamp: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type PreMergeConfig = z.infer<typeof PreMergeConfigSchema>;
export type ValidationMessage = z.infer<typeof ValidationMessageSchema>;
export type ValidationResultData = z.infer<typeof ValidationResultDataSchema>;
export type PreMergeCheckOptions = z.infer<typeof PreMergeCheckOptionsSchema>;
export type PreMergeCheckResult = z.infer<typeof PreMergeCheckResultSchema>;
