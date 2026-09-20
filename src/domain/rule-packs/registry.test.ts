// @vitest-environment node

import { rulePacks } from './registry';
import { getSnapshot } from '@/sources/registry';

test('resolves every rule-pack source reference to a hash-verified snapshot', () => {
  for (const pack of rulePacks) {
    for (const sourceRef of pack.sourceRefs) {
      expect(getSnapshot(sourceRef)).toMatchObject({ id: sourceRef });
    }
  }
});
