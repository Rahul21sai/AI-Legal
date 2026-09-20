import type { SourceSnapshot, SourceStatus } from './contracts';
import { hashSourceExcerpts, normaliseSourceText } from './normalise';

function decodeHtml(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

async function extractLiveText(
  response: Response,
  format: SourceSnapshot['sourceFormat'],
): Promise<string> {
  if (format === 'ecourts-section-json') {
    const value = (await response.json()) as unknown;
    if (
      typeof value !== 'object' ||
      value === null ||
      !('section' in value) ||
      typeof value.section !== 'object' ||
      value.section === null ||
      !('text' in value.section) ||
      typeof value.section.text !== 'string'
    ) {
      return '';
    }
    return value.section.text;
  }
  return decodeHtml(await response.text());
}

export async function verifySource(
  snapshot: SourceSnapshot,
  fetchImpl: typeof fetch,
  signal: AbortSignal,
): Promise<SourceStatus> {
  try {
    const response = await fetchImpl(snapshot.sourceUrl, {
      headers: { accept: snapshot.sourceFormat === 'html' ? 'text/html' : 'application/json' },
      signal,
    });
    if (!response.ok) {
      return {
        state: 'UNREACHABLE',
        sourceId: snapshot.id,
        httpStatus: response.status,
      };
    }
    const liveText = normaliseSourceText(
      await extractLiveText(response, snapshot.sourceFormat),
    );
    const matches = snapshot.excerpts.every((excerpt) =>
      liveText.includes(normaliseSourceText(excerpt)),
    );
    if (!matches) return { state: 'CHANGED', sourceId: snapshot.id };
    return {
      state: 'MATCH',
      sourceId: snapshot.id,
      liveSha256: hashSourceExcerpts(snapshot.excerpts),
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError')
    ) {
      return { state: 'TIMEOUT', sourceId: snapshot.id };
    }
    return { state: 'UNREACHABLE', sourceId: snapshot.id };
  }
}
