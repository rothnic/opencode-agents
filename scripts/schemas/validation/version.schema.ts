/**
 * Version Severity Check Schemas
 *
 * Type-safe schemas for version-based severity escalation.
 */

import { z } from 'zod';
import { CommonOptionsSchema } from '../common-options.schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const VersionCheckOptionsSchema = CommonOptionsSchema.extend({
  action: z
    .enum(['check', 'apply'])
    .default('check')
    .describe('Check status or apply severity rules'),
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const VersionPhaseSchema = z.enum(['development', 'preRelease', 'production']);

export const SeverityEscalationSchema = z.object({
  rule: z.string(),
  currentSeverity: z.enum(['info', 'warning', 'error']),
  reason: z.string(),
});

export const VersionStatusSchema = z.object({
  version: z.string(),
  phase: VersionPhaseSchema,
  milestones: z.object({
    preRelease: z.string(),
    production: z.string(),
  }),
  escalations: z.array(SeverityEscalationSchema),
  timestamp: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type VersionCheckOptions = z.infer<typeof VersionCheckOptionsSchema>;
export type VersionPhase = z.infer<typeof VersionPhaseSchema>;
export type SeverityEscalation = z.infer<typeof SeverityEscalationSchema>;
export type VersionStatus = z.infer<typeof VersionStatusSchema>;
