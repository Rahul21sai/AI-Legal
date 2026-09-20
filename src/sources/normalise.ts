import { createHash } from 'node:crypto';

export function normaliseSourceText(value: string): string {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/gu, ' ').trim();
}

export function hashSourceExcerpts(excerpts: readonly string[]): string {
  const normalized = excerpts.map(normaliseSourceText).join('\n');
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}
