import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderCaseFileHtml } from '../../src/views/caseFile/template';
import { renderCase, renderKpiTile, renderTab } from '../../src/views/caseFile/template/render';
import type { CaseFile, CaseFileBundle } from '../../src/services/caseFile';

test('case file template renders scope, KPI tiles, tabs, and escaped case content', () => {
  const html = renderCaseFileHtml(bundleFixture(), { nonce: 'nonce-test', cspSource: 'vscode-resource:' });

  assert.match(html, /Test Inspector — Case File/);
  assert.match(html, /repo &lt;one&gt;/);
  assert.match(html, /feature &amp; api/);
  assert.match(html, /Runtime evidence/);
  assert.match(html, /2\/2 passing/);
  assert.match(html, /78\.1%/);
  assert.match(html, /65%/);
  assert.match(html, /coverage run passed/);
  assert.match(html, /1 case card/);
  assert.match(html, /Number of test files Test Inspector discovered/);
  assert.match(html, /Percentage of executable source lines hit by unit tests/);
  assert.match(html, /Metric guide/);
  assert.match(html, /Actionable findings shown below/);
  assert.match(html, /Actual test files discovered/);
  assert.match(html, /not executed test count/);
  assert.match(html, /Suggested test gaps/);
  assert.match(html, /core behavior is effectively untested/);
  assert.match(html, /data-verdict="MISSING"/);
  assert.match(html, /data-project="node:\/repo"/);
  assert.match(html, /Show evidence/);
  assert.match(html, /vscode\.postMessage/);
});

test('case file render helpers keep active and disabled states machine-readable', () => {
  assert.match(renderKpiTile('MISSING', 2, 4), /data-verdict="MISSING"/);
  assert.match(renderKpiTile('MISSING', 2, 4), /Missing source files/);
  assert.match(renderKpiTile('MISSING', 2, 4), /Critical source files where Test Inspector found no related test evidence/);
  assert.match(renderKpiTile('STRONG', 2, 4), /Strong test files/);
  assert.match(renderKpiTile('STRONG', 2, 4), /file quality, not executed test-case count/);
  assert.match(renderKpiTile('WEAK', 2, 4), /Weak case cards/);
  assert.match(renderKpiTile('MISSING', 2, 4), /50% of cards/);
  assert.match(renderTab({ projectId: '*', label: 'All', count: 1, active: true }), /aria-selected="true"/);
  assert.match(renderCase(caseFixture(), bundleFixture().projects![0]), /Open file/);
});

function bundleFixture(): CaseFileBundle {
  return {
    scanTimestamp: 1,
    scope: { repoName: 'repo <one>', branch: 'main', featureLabel: 'feature & api' },
    projects: [{ id: 'node:/repo', rootPath: '/repo', framework: 'node', label: 'Node repo', configFiles: [] }],
    testFiles: [
      {
        path: '/repo/test/api.test.ts',
        projectId: 'node:/repo',
        status: 'unknown',
        qualityFindings: [],
        testCases: [
          { id: 'one', name: 'one', filePath: '/repo/test/api.test.ts', status: 'passed' },
          { id: 'two', name: 'two', filePath: '/repo/test/api.test.ts', status: 'passed' },
        ],
      },
    ],
    coverage: [{ projectId: 'node:/repo', files: [], totals: { linesPct: 78.1, branchesPct: 65, functionsPct: 68.8 } }],
    runtime: { testCases: 2, passed: 2, failed: 0, generatedAt: 1, command: 'npm run coverage' },
    cases: [caseFixture()],
    totals: { THEATER: 0, WEAK: 0, MISSING: 1, STRONG: 0, OK: 0 },
  };
}

function caseFixture(): CaseFile {
  return {
    target: { kind: 'source', path: '/repo/src/api.ts', projectId: 'node:/repo' },
    verdict: 'MISSING',
    killPriority: 60,
    story: { headline: 'api.ts — critical <code>', paragraph: 'Needs tests for branch & error path.' },
    evidence: {
      signals: [{ name: 'no-related-tests', weight: 30, detail: 'none' }],
      relatedTests: [],
      gaps: [
        {
          title: 'api.ts: core behavior is effectively untested',
          severity: 'critical',
          reason: 'No related test file was found for critical source code.',
          evidence: ['no related tests found'],
          suggestedTest: 'Add one happy-path test and one failure-path test.',
        },
      ],
    },
    suggestion: { kind: 'add', text: 'Add tests.' },
  };
}
