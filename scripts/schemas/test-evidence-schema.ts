import { z } from 'zod';

export const TestEvidenceOptionsSchema = z.object({
  testFile: z.string().optional(),
  force: z.boolean().optional().default(false),
});

export type TestEvidenceOptions = z.infer<typeof TestEvidenceOptionsSchema>;

export function parseTestEvidenceOptions(input: unknown): TestEvidenceOptions {
  const res = TestEvidenceOptionsSchema.safeParse(input);
  if (res.success) return res.data;
  return TestEvidenceOptionsSchema.parse({});
}
