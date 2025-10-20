/**
 * Tool Verification Schemas
 *
 * Type-safe schemas for verifying development tool installations.
 */

import { z } from 'zod';
import { CommonOptionsSchema, OutputFormatSchema } from '../common-options.schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// COMMAND OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const VerifyOptionsSchema = CommonOptionsSchema.extend({
  output: OutputFormatSchema,
  category: z
    .enum(['core', 'linting', 'testing', 'security', 'all'])
    .default('all')
    .describe('Category of tools to verify'),
});

// ═══════════════════════════════════════════════════════════════════════════
// RESULT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const ToolCheckSchema = z.object({
  name: z.string(),
  command: z.string(),
  required: z.boolean(),
  category: z.enum(['core', 'linting', 'testing', 'security']),
});

export const ToolResultSchema = z.object({
  tool: z.string(),
  installed: z.boolean(),
  version: z.string().optional(),
  error: z.string().optional(),
  category: z.string(),
  required: z.boolean(),
});

export const VerifyResultSchema = z.object({
  success: z.boolean(),
  results: z.array(ToolResultSchema),
  stats: z.object({
    total: z.number(),
    installed: z.number(),
    missing: z.number(),
    missingRequired: z.number(),
  }),
  timestamp: z.string(),
});

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type VerifyOptions = z.infer<typeof VerifyOptionsSchema>;
export type ToolCheck = z.infer<typeof ToolCheckSchema>;
export type ToolResult = z.infer<typeof ToolResultSchema>;
export type VerifyResult = z.infer<typeof VerifyResultSchema>;
