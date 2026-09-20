import packageJson from '../../../../package.json';

import { getAllSnapshots } from '@/sources/registry';

type PublicSnapshotVersion = Readonly<{
  id: string;
  retrievedAt: string;
  normalizedSha256: string;
}>;

export function createHealthHandler(dependencies: Readonly<{
  version: string;
  environment: Readonly<{
    GEMINI_API_KEY?: string | undefined;
    GEMINI_MODEL?: string | undefined;
  }>;
  snapshots: readonly PublicSnapshotVersion[];
}>) {
  return async function handle(): Promise<Response> {
    return Response.json(
      {
        status: 'ok',
        version: dependencies.version,
        gemini: {
          configured: Boolean(dependencies.environment.GEMINI_API_KEY),
          model: dependencies.environment.GEMINI_MODEL || 'gemini-3.8-flash',
        },
        snapshots: dependencies.snapshots.map((snapshot) => ({
          id: snapshot.id,
          retrievedAt: snapshot.retrievedAt,
          sha256: snapshot.normalizedSha256,
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  };
}

export async function GET(): Promise<Response> {
  return createHealthHandler({
    version: packageJson.version,
    environment: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL: process.env.GEMINI_MODEL,
    },
    snapshots: getAllSnapshots(),
  })();
}
