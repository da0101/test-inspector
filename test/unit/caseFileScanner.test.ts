import assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';
import { createAdapters } from '../../src/adapters';
import { CaseFileScanner } from '../../src/services/caseFileScanner';

test('scanner skips support fixture projects when scanning this repo', async () => {
  const output = { lines: [] as string[], appendLine(value: string) { this.lines.push(value); } };
  const scanner = new CaseFileScanner(createAdapters(), output, null);

  const bundle = await scanner.scan([process.cwd()]);
  const projects = bundle.projects ?? [];
  const fixtureProject = projects.find((project) => normalize(project.rootPath).includes('/test/fixtures/'));
  const selfProject = projects.find((project) => project.rootPath === process.cwd());

  assert.equal(fixtureProject, undefined);
  assert.equal(selfProject?.framework, 'node');
  assert.ok(output.lines.some((line) => line.includes('support fixture project')));
});

function normalize(value: string): string {
  return value.split(path.sep).join('/');
}
