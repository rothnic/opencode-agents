import { z } from 'zod';

export const PreMergeConfigSchema = z.object({
  requireWorkVerification: z.boolean().optional().default(true),
  requireTests: z.boolean().optional().default(true),
  minCoverageIncrease: z.number().optional().default(0),
  allowedWithoutTests: z.array(z.string()).optional().default([]),
});

export type PreMergeConfig = z.infer<typeof PreMergeConfigSchema>;

export function parsePreMergeConfig(input: unknown): PreMergeConfig {
  const res = PreMergeConfigSchema.safeParse(input);
  if (res.success) return res.data;
  // fallback to defaults
  return PreMergeConfigSchema.parse({});
}
