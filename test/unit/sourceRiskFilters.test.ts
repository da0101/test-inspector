import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isRelevantSource } from '../../src/services/sourceRiskFilters';
import type { TestProject } from '../../src/models';

test('source risk filters keep real app source and reject generated/support files by framework', () => {
  assert.equal(isRelevantSource(project('node'), '/repo/src/services/api.ts'), true);
  assert.equal(isRelevantSource(project('node'), '/repo/lib/index.ts'), true);
  assert.equal(isRelevantSource(project('node'), '/repo/testHelpers.ts'), false);
  assert.equal(isRelevantSource(project('node'), '/repo/src/types.ts'), false);

  assert.equal(isRelevantSource(project('react'), '/repo/src/assets/logo.ts'), false);
  assert.equal(isRelevantSource(project('react'), '/repo/pages/login.tsx'), true);
  assert.equal(isRelevantSource(project('firebase-functions'), '/repo/functions/src/index.ts'), true);

  assert.equal(isRelevantSource(project('flutter'), '/repo/lib/features/login.dart'), true);
  assert.equal(isRelevantSource(project('flutter'), '/repo/lib/generated/api.g.dart'), false);
  assert.equal(isRelevantSource(project('flutter'), '/repo/lib/firebase_options.dart'), false);

  assert.equal(isRelevantSource(project('fastapi'), '/repo/app/main.py'), true);
  assert.equal(isRelevantSource(project('django'), '/repo/tests/test_main.py'), false);
  assert.equal(isRelevantSource(project('django'), '/repo/app/migrations/0001.py'), false);
});

function project(framework: TestProject['framework']): TestProject {
  return {
    id: `${framework}:/repo`,
    rootPath: '/repo',
    framework,
    label: framework,
    configFiles: [],
  };
}
