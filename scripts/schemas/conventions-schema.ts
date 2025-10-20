import fs from 'node:fs';
import { z } from 'zod';

const AutofixSchema = z
  .object({ enabled: z.boolean().optional(), strategy: z.string().optional() })
  .nullable()
  .optional();

const RuleSchema = z
  .object({
    id: z.string().optional(),
    pattern: z.string().optional(),
    exclude: z.array(z.string()).optional(),
    level: z.union([z.literal('error'), z.literal('warning')]).optional(),
    message: z.string().optional(),
    validator: z.string().optional(),
    autofix: AutofixSchema,
  })
  .catchall(z.unknown());

const FileOrganizationSchema = z.object({ rules: z.array(RuleSchema).optional() }).optional();

const DocumentationSchema = z
  .object({
    fileOrganization: FileOrganizationSchema,
    naming: z.record(z.string(), z.unknown()).optional(),
    structure: z.record(z.string(), z.unknown()).optional(),
  })
  .partial()
  .optional();

const ConventionsSchema = z.object({ documentation: DocumentationSchema }).passthrough();

export type Conventions = z.infer<typeof ConventionsSchema>;
export type Rule = z.infer<typeof RuleSchema>;

export function parseConventionsFromFile(pathToFile = '.opencode/conventions.json'): Conventions {
  if (!fs.existsSync(pathToFile)) {
    throw new Error(`Conventions file not found: ${pathToFile}`);
  }

  const raw = fs.readFileSync(pathToFile, 'utf8');
  const parsed = JSON.parse(raw);
  const res = ConventionsSchema.safeParse(parsed);
  if (!res.success) {
    throw new Error(`Invalid conventions.json: ${JSON.stringify(res.error.format(), null, 2)}`);
  }
  return res.data;
}
