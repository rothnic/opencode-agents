/**
 * File Location Check Schemas
 *
 * Validates files are in the correct locations according to project conventions.
 */

import { z } from 'zod';
import { CheckOptionsSchema } from '../common-options.schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const FileLocationCheckOptionsSchema = CheckOptionsSchema.extend({
  staged: z.boolean().default(false).describe('Check only staged files'),
  root: z.boolean().default(false).describe('Check root directory only'),
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const FileLocationViolationSchema = z.object({
  file: z.string(),
  currentLocation: z.string(),
  suggestedLocation: z.string().optional(),
  reason: z.string(),
  autoFixable: z.boolean(),
});

export const FileLocationResultSchema = z.object({
  success: z.boolean(),
  violations: z.array(FileLocationViolationSchema),
  checked: z.number(),
  fixed: z.number().default(0),
  timestamp: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const FileLocationRuleSchema = z.object({
  pattern: z.string(),
  allowedLocations: z.array(z.string()),
  suggestion: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type FileLocationCheckOptions = z.infer<typeof FileLocationCheckOptionsSchema>;
export type FileLocationViolation = z.infer<typeof FileLocationViolationSchema>;
export type FileLocationResult = z.infer<typeof FileLocationResultSchema>;
export type FileLocationRule = z.infer<typeof FileLocationRuleSchema>;
