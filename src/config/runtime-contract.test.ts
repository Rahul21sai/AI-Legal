// @vitest-environment node

import packageJson from '../../package.json';

test('pins deployment and development to the Node 24 LTS major', () => {
  expect(packageJson.engines.node).toBe('24.x');
  expect(packageJson.devEngines.runtime.version).toBe('24.x');
  expect(packageJson.devEngines.runtime.onFail).toBe('error');
  expect(packageJson.devDependencies.jsdom).toBe('29.1.1');
});
