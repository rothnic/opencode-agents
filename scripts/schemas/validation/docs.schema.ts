/**
 * Documentation Conventions Check Schemas
 *
 * Type-safe schemas for validating documentation structure and conventions.
 */

import { z } from 'zod';
import { CheckOptionsSchema } from '../common-options.schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const DocsCheckOptionsSchema = CheckOptionsSchema.extend({
  check: z
    .enum(['structure', 'naming', 'content', 'frontmatter', 'all'])
    .default('all')
    .describe('Type of documentation check to run'),
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const DocsViolationSchema = z.object({
  file: z.string(),
  type: z.enum(['structure', 'naming', 'content', 'frontmatter']),
  message: z.string(),
  severity: z.enum(['error', 'warn', 'info']),
  fixable: z.boolean().default(false),
  suggestion: z.string().optional(),
});

export const DocsCheckResultSchema = z.object({
  success: z.boolean(),
  violations: z.array(DocsViolationSchema),
  checked: z.number(),
  fixed: z.number().default(0),
  timestamp: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const DocsConventionSchema = z.object({
  requiredFiles: z.array(z.string()).optional(),
  namingPatterns: z.record(z.string(), z.string()).optional(),
  requiredFrontmatter: z.array(z.string()).optional(),
  maxLineLength: z.number().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type DocsCheckOptions = z.infer<typeof DocsCheckOptionsSchema>;
export type DocsViolation = z.infer<typeof DocsViolationSchema>;
export type DocsCheckResult = z.infer<typeof DocsCheckResultSchema>;
export type DocsConvention = z.infer<typeof DocsConventionSchema>;
