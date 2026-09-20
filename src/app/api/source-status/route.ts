import { getSnapshot, hasSnapshot } from '@/sources/registry';
import type { SourceStatus } from '@/sources/contracts';
import { verifySource } from '@/sources/verify-source';

export function createSourceStatusHandler(
  dependencies: Readonly<{
    hasSource(id: string): boolean;
    verify(id: string): Promise<SourceStatus>;
  }>,
) {
  return async function handle(request: Request): Promise<Response> {
    const sourceId = new URL(request.url).searchParams.get('sourceId');
    if (!sourceId || !dependencies.hasSource(sourceId)) {
      return Response.json(
        { state: 'INVALID_SOURCE_ID' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const status = await dependencies.verify(sourceId);
    return Response.json(status, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      },
    });
  };
}

export async function GET(request: Request): Promise<Response> {
  return createSourceStatusHandler({
    hasSource: hasSnapshot,
    verify: async (id) =>
      verifySource(getSnapshot(id), fetch, AbortSignal.timeout(2_000)),
  })(request);
}
