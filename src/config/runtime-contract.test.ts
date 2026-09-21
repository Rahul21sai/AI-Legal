// @vitest-environment node

import packageJson from '../../package.json';

test('pins deployment and development to the Node 22 major', () => {
  expect(packageJson.engines.node).toBe('22.x');
  expect(packageJson.devEngines.runtime.version).toBe('22.x');
  expect(packageJson.devEngines.runtime.onFail).toBe('error');
});
