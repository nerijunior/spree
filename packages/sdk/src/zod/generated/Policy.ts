// This file is auto-generated. Do not edit directly.
import { z } from 'zod';

export const PolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  body: z.string().nullable(),
  body_html: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Policy = z.infer<typeof PolicySchema>;
