/**
 * Gate Check Command Schemas
 *
 * Type-safe schemas for quality gate checking operations.
 */

import { z } from 'zod';
import { CheckOptionsSchema } from '../common-options.schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const GateCheckOptionsSchema = CheckOptionsSchema.extend({
  gate: z
    .enum(['fileSize', 'fileLocation', 'preMerge', 'all'])
    .default('all')
    .describe('Which gate to run'),
  staged: z.boolean().default(false).describe('Check only staged files'),
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const GateViolationSchema = z.object({
  type: z.string(),
  file: z.string(),
  message: z.string(),
  severity: z.enum(['error', 'warn', 'info']),
  fixable: z.boolean().default(false),
  fix: z.string().optional(),
});

export const GateCheckResultSchema = z.object({
  success: z.boolean(),
  gate: z.string(),
  violations: z.array(GateViolationSchema),
  checked: z.number(),
  fixed: z.number().default(0),
  timestamp: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type GateCheckOptions = z.infer<typeof GateCheckOptionsSchema>;
export type GateViolation = z.infer<typeof GateViolationSchema>;
export type GateCheckResult = z.infer<typeof GateCheckResultSchema>;
