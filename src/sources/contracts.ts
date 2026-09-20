import { z } from 'zod';

export const sourceSnapshotSchema = z
  .object({
    id: z.string().min(1),
    instrumentTitle: z.string().min(1),
    provision: z.string().min(1),
    excerpts: z.array(z.string().min(1)).min(1),
    sourceUrl: z.string().url(),
    sourceFormat: z.enum(['html', 'ecourts-section-json']),
    publisher: z.string().min(1),
    authority: z.enum(['official', 'third-party-mirror']),
    retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    attribution: z.string().min(1),
    authorityNote: z.string().min(1),
    license: z.string().min(1).optional(),
    normalizedSha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

export type SourceSnapshot = z.infer<typeof sourceSnapshotSchema>;

export const sourceStatusSchema = z.discriminatedUnion('state', [
  z
    .object({
      state: z.literal('MATCH'),
      sourceId: z.string(),
      liveSha256: z.string(),
      checkedAt: z.string(),
    })
    .strict(),
  z.object({ state: z.literal('TIMEOUT'), sourceId: z.string() }).strict(),
  z
    .object({
      state: z.literal('UNREACHABLE'),
      sourceId: z.string(),
      httpStatus: z.number().int().optional(),
    })
    .strict(),
  z.object({ state: z.literal('CHANGED'), sourceId: z.string() }).strict(),
]);

export type SourceStatus = z.infer<typeof sourceStatusSchema>;
