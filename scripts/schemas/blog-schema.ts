import { z } from 'zod';

export const BlogMetadataSchema = z
  .object({
    title: z.string().optional(),
    status: z.string().optional(),
    phase: z.string().optional(),
    // allow word_count as number or string -> normalize to number
    word_count: z
      .union([z.number(), z.string()])
      .optional()
      .transform(v => (typeof v === 'string' ? Number(v) : v))
      .optional(),
    last_updated: z.string().optional(),
  })
  .catchall(z.unknown());

export type BlogMetadata = z.infer<typeof BlogMetadataSchema>;

export function parseFrontmatterMetadata(input: unknown): BlogMetadata {
  const parsed = BlogMetadataSchema.safeParse(input);
  if (parsed.success) return parsed.data;
  // Fallback: return empty object with optional fields undefined
  return {} as BlogMetadata;
}
