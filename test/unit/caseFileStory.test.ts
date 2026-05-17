import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { TestFile } from '../../src/models';
import { generateStory, generateSuggestion } from '../../src/services/caseFileStory';
import type { CaseSignal } from '../../src/services/caseFile';

test('caseFileStory explains strong tests and healthy suggestions', () => {
  const testFile = testFileFixture('/repo/test/api.test.ts');

  const story = generateStory(testFile, [], 'STRONG');
  const suggestion = generateSuggestion('STRONG', testFile);

  assert.equal(story.headline, 'api.test.ts');
  assert.match(story.paragraph, /No theater patterns/);
  assert.equal(suggestion.kind, 'review');
});

test('caseFileStory explains theater signals with concrete reasons', () => {
  const signals: CaseSignal[] = [
    { name: 'mocks-unit-under-test', weight: 45 },
    { name: 'mock-only-assertions', weight: 20 },
    { name: 'trivial-assertion', weight: 20 },
    { name: 'snapshot-only', weight: 20 },
    { name: 'no-assertion', weight: 20 },
    { name: 'vague-title', weight: 8, detail: '2 names are vague' },
    { name: 'orphan-test', weight: 15 },
    { name: 'skipped-test', weight: 15 },
    { name: 'focused-test', weight: 20 },
    { name: 'parse-error', weight: 50 },
  ];

  const story = generateStory(testFileFixture('/repo/test/theater.test.ts'), signals, 'THEATER');
  const suggestion = generateSuggestion('THEATER', testFileFixture('/repo/test/theater.test.ts'));

  assert.match(story.headline, /10 weak signals/);
  assert.match(story.paragraph, /mocks the unit under test/);
  assert.match(story.paragraph, /marked skipped/);
  assert.equal(suggestion.kind, 'delete');
});

test('caseFileStory falls back when weak signals are unknown', () => {
  const story = generateStory(
    testFileFixture('/repo/test/unknown.test.ts'),
    [{ name: 'custom-signal', weight: 1 }],
    'WEAK'
  );
  const suggestion = generateSuggestion('WEAK', testFileFixture('/repo/test/unknown.test.ts'));

  assert.match(story.paragraph, /multiple weak signals/);
  assert.equal(suggestion.kind, 'rewrite');
});

function testFileFixture(filePath: string): TestFile {
  return {
    path: filePath,
    projectId: 'node:/repo',
    status: 'unknown',
    testCases: [],
    qualityFindings: [],
  };
}
