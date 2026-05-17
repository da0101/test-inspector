import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildChangedFileRisks } from '../../src/services/git';
import { buildReport, renderMarkdownReport } from '../../src/services/report';

test('maps changed source files to likely tests and renders report', () => {
  const project = {
    id: 'react:/repo',
    rootPath: '/repo',
    framework: 'react' as const,
    label: 'React app',
    configFiles: []
  };
  const risks = buildChangedFileRisks(
    ['/repo/src/Button.tsx'],
    [project],
    [{ path: '/repo/src/Button.test.tsx', projectId: project.id, testCases: [], status: 'unknown', qualityFindings: [] }],
    [{ projectId: project.id, files: [{ path: 'src/Button.tsx', linesPct: 40 }], totals: { linesPct: 40 } }],
    []
  );
  assert.equal(risks[0].relatedTests.length, 1);
  assert.equal(risks[0].coverage?.linesPct, 40);
  const markdown = renderMarkdownReport(buildReport([project], [], [], risks));
  assert.match(markdown, /Changed Files Risk/);
  assert.match(markdown, /Button\.tsx/);
});

test('renders report fallbacks for no coverage, no changed files, and no findings', () => {
  const project = {
    id: 'node:/repo',
    rootPath: '/repo',
    framework: 'node' as const,
    label: 'Node app',
    configFiles: []
  };
  const markdown = renderMarkdownReport(buildReport([project], [], [], []));

  assert.match(markdown, /- Coverage: unknown/);
  assert.match(markdown, /\| - \| 0 \| unknown \| - \|/);
  assert.match(markdown, /- None/);
});

test('renders quality findings with line numbers and unique recommended commands', () => {
  const project = {
    id: 'react:/repo',
    rootPath: '/repo',
    framework: 'react' as const,
    label: 'React app',
    configFiles: []
  };
  const testFile = {
    path: '/repo/src/Button.test.tsx',
    projectId: project.id,
    status: 'unknown' as const,
    testCases: [
      { id: 'a', name: 'passes success state', filePath: '/repo/src/Button.test.tsx', status: 'passed' as const },
      { id: 'b', name: 'rejects error state', filePath: '/repo/src/Button.test.tsx', status: 'failed' as const },
      { id: 'c', name: 'skips external dependency', filePath: '/repo/src/Button.test.tsx', status: 'skipped' as const },
    ],
    qualityFindings: [
      { id: 'f1', severity: 'warning' as const, kind: 'weak-test' as const, filePath: '/repo/src/Button.test.tsx', line: 12, message: 'Weak assertion.' },
    ],
  };
  const changedFiles = [
    { path: '/repo/src/Button.tsx', projectId: project.id, relatedTests: [], findings: [], recommendedCommand: 'npm test -- Button.test.tsx' },
    { path: '/repo/src/Input.tsx', projectId: project.id, relatedTests: [], findings: [], recommendedCommand: 'npm test -- Button.test.tsx' },
  ];

  const markdown = renderMarkdownReport(buildReport(
    [project],
    [testFile],
    [
      { projectId: project.id, files: [], totals: { linesPct: 50 } },
      { projectId: project.id, files: [], totals: { linesPct: 75 } },
    ],
    changedFiles
  ));

  assert.match(markdown, /- Passing: 1/);
  assert.match(markdown, /- Failing: 1/);
  assert.match(markdown, /- Skipped: 1/);
  assert.match(markdown, /- Coverage: 62\.5% lines/);
  assert.match(markdown, /Button\.test\.tsx:12/);
  assert.equal((markdown.match(/npm test -- Button\.test\.tsx/g) ?? []).length, 1);
});
