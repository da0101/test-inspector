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
