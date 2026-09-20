import niSnapshotsJson from '@/domain/rule-packs/snapshots/ni-act-138.json';
import rbiSnapshotsJson from '@/domain/rule-packs/snapshots/rbi-ios-2026.json';
import type { RulePack } from '@/domain/rule-packs/types';
import { sourceSnapshotSchema, type SourceSnapshot } from './contracts';
import { hashSourceExcerpts } from './normalise';

const snapshots: readonly SourceSnapshot[] = [
  ...niSnapshotsJson,
  ...rbiSnapshotsJson,
].map((value) => sourceSnapshotSchema.parse(value));

const registry = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));

export function hasSnapshot(id: string): boolean {
  return registry.has(id);
}

export function getSnapshot(id: string): SourceSnapshot {
  const snapshot = registry.get(id);
  if (!snapshot) throw new Error('UNKNOWN_SOURCE_ID');
  if (hashSourceExcerpts(snapshot.excerpts) !== snapshot.normalizedSha256) {
    throw new Error(`SOURCE_HASH_MISMATCH:${id}`);
  }
  return snapshot;
}

export function getSnapshotsForPack(pack: RulePack): readonly SourceSnapshot[] {
  return pack.sourceRefs.map(getSnapshot);
}
