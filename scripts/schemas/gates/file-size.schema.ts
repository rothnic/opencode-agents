/**
 * File Size Check Schemas
 *
 * Validates files don't exceed configured size limits.
 */

import { z } from 'zod';
import { CheckOptionsSchema } from '../common-options.schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const FileSizeCheckOptionsSchema = CheckOptionsSchema.extend({
  staged: z.boolean().default(false).describe('Check only staged files'),
  maxSize: z.number().optional().describe('Override default max file size (KB)'),
  exclude: z.array(z.string()).optional().describe('Patterns to exclude'),
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const FileSizeViolationSchema = z.object({
  file: z.string(),
  size: z.number(),
  limit: z.number(),
  severity: z.enum(['error', 'warn', 'info']),
  category: z.string().optional(),
});

export const FileSizeResultSchema = z.object({
  success: z.boolean(),
  violations: z.array(FileSizeViolationSchema),
  checked: z.number(),
  timestamp: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const FileSizeLimitSchema = z.object({
  pattern: z.string(),
  maxKB: z.number(),
  severity: z.enum(['error', 'warn', 'info']).default('error'),
});

export const FileSizeConfigSchema = z.object({
  default: z.number().default(100),
  limits: z.array(FileSizeLimitSchema).optional(),
  excludePatterns: z.array(z.string()).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type FileSizeCheckOptions = z.infer<typeof FileSizeCheckOptionsSchema>;
export type FileSizeViolation = z.infer<typeof FileSizeViolationSchema>;
export type FileSizeResult = z.infer<typeof FileSizeResultSchema>;
export type FileSizeLimit = z.infer<typeof FileSizeLimitSchema>;
export type FileSizeConfig = z.infer<typeof FileSizeConfigSchema>;
