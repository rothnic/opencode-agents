/**
 * Repository Audit Schemas
 *
 * Type-safe schemas for comprehensive repository state auditing.
 */

import { z } from 'zod';
import { CheckOptionsSchema } from '../common-options.schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const AuditOptionsSchema = CheckOptionsSchema.extend({
  category: z
    .enum([
      'outdatedReferences',
      'backupFiles',
      'staleStatus',
      'uncommittedChanges',
      'missingFiles',
      'all',
    ])
    .default('all')
    .describe('Category of issues to check'),
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const AuditIssueSchema = z.object({
  type: z.enum(['error', 'warning', 'info']),
  category: z.string(),
  file: z.string(),
  description: z.string(),
  autoFixable: z.boolean().default(false),
  ruleNeeded: z.string().optional(),
  fix: z.function().optional(),
});

export const AuditResultSchema = z.object({
  success: z.boolean(),
  issues: z.array(AuditIssueSchema),
  stats: z.object({
    errors: z.number(),
    warnings: z.number(),
    info: z.number(),
    fixed: z.number(),
  }),
  timestamp: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const PatternConfigSchema = z.object({
  replacement: z.string(),
  message: z.string(),
  searchIn: z.array(z.string()),
  exceptions: z.array(z.string()).optional(),
});

export const ValidationRulesSchema = z.object({
  version: z.string(),
  rules: z.object({
    outdatedReferences: z.object({
      enabled: z.boolean(),
      patterns: z.record(z.string(), PatternConfigSchema),
    }),
    backupFiles: z.object({
      enabled: z.boolean(),
      patterns: z.array(z.string()),
      searchIn: z.array(z.string()),
    }),
    staleStatus: z.object({
      enabled: z.boolean(),
      maxAgeHours: z.number(),
      file: z.string(),
    }),
    uncommittedChanges: z.object({
      enabled: z.boolean(),
      maxCount: z.number(),
    }),
    missingFiles: z.object({
      enabled: z.boolean(),
      requiredFiles: z.array(z.string()),
    }),
  }),
  versionMilestones: z.object({
    preRelease: z.string(),
    production: z.string(),
  }),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type AuditOptions = z.infer<typeof AuditOptionsSchema>;
export type AuditIssue = z.infer<typeof AuditIssueSchema>;
export type AuditResult = z.infer<typeof AuditResultSchema>;
export type PatternConfig = z.infer<typeof PatternConfigSchema>;
export type ValidationRules = z.infer<typeof ValidationRulesSchema>;
