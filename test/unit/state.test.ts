import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InspectorState } from '../../src/services/state';
import type { TestProject } from '../../src/models';

test('state drops stale project-scoped analysis when projects change', () => {
  const state = new InspectorState();
  const kept = projectFixture('node:/repo-a');
  const removed = projectFixture('node:/repo-b');
  state.projects = [kept, removed];
  state.testFiles = [
    { path: '/repo-a/a.test.ts', projectId: kept.id, status: 'unknown', testCases: [], qualityFindings: [] },
    { path: '/repo-b/b.test.ts', projectId: removed.id, status: 'unknown', testCases: [], qualityFindings: [] },
  ];
  state.coverage = [
    { projectId: kept.id, files: [], totals: { linesPct: 80 } },
    { projectId: removed.id, files: [], totals: { linesPct: 20 } },
  ];
  state.sourceRisks = [
    { projectId: kept.id, path: '/repo-a/src/a.ts', relatedTests: [], findings: [], score: 1, criticality: 1, signals: [], recommendation: '' },
    { projectId: removed.id, path: '/repo-b/src/b.ts', relatedTests: [], findings: [], score: 1, criticality: 1, signals: [], recommendation: '' },
  ];
  state.setupIssues = [
    setupIssueFixture(kept.id),
    setupIssueFixture(removed.id),
  ];
  state.selectedProjectId = removed.id;

  state.setProjects([kept]);

  assert.deepEqual(state.projects.map((p) => p.id), [kept.id]);
  assert.deepEqual(state.testFiles.map((f) => f.projectId), [kept.id]);
  assert.deepEqual(state.coverage.map((c) => c.projectId), [kept.id]);
  assert.deepEqual(state.sourceRisks.map((r) => r.projectId), [kept.id]);
  assert.deepEqual(state.setupIssues.map((i) => i.projectId), [kept.id]);
  assert.equal(state.selectedProjectId, null);
});

test('state de-duplicates notices and keeps newest bounded', () => {
  const state = new InspectorState();

  state.addNotice({ severity: 'warning', message: 'same', projectId: 'one' });
  state.addNotice({ severity: 'warning', message: 'same', projectId: 'one' });
  for (let index = 0; index < 35; index++) {
    state.addNotice({ severity: 'info', message: `notice ${index}` });
  }

  assert.equal(state.notices.length, 30);
  assert.equal(state.notices[0].message, 'notice 34');
  assert.equal(state.notices.filter((notice) => notice.message === 'same').length, 0);
});

function projectFixture(id: string): TestProject {
  return {
    id,
    rootPath: id.replace(/^node:/, ''),
    framework: 'node',
    label: id,
    configFiles: [],
  };
}

function setupIssueFixture(projectId: string) {
  return {
    id: `missing-node-modules:${projectId}`,
    kind: 'missing-node-modules' as const,
    projectId,
    severity: 'warning' as const,
    title: 'Missing node_modules',
    detail: 'Dependencies are not installed.',
    action: 'Run npm install.',
  };
}
