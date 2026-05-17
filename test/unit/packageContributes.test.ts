import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

type PackageJson = {
  contributes: {
    commands: Array<{ command: string; title: string; icon?: string }>;
    menus: { 'view/title': Array<{ command: string; when: string; group: string }> };
    viewsWelcome: Array<{ view: string; contents: string }>;
  };
};

test('package contributes a visible Case File refresh action for rescanning findings', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as PackageJson;
  const refreshCommand = pkg.contributes.commands.find((item) => item.command === 'testInspector.refresh');
  const casesToolbarCommands = pkg.contributes.menus['view/title']
    .filter((item) => item.when === 'view == testInspector.cases')
    .map((item) => item.command);
  const casesWelcome = pkg.contributes.viewsWelcome.find((item) => item.view === 'testInspector.cases')?.contents ?? '';

  assert.equal(refreshCommand?.title, 'Test Inspector: Refresh Case File');
  assert.equal(refreshCommand?.icon, '$(refresh)');
  assert.ok(casesToolbarCommands.includes('testInspector.refresh'));
  assert.equal(casesToolbarCommands.includes('testInspector.scan'), false);
  assert.match(casesWelcome, /Refresh Case File/);
});
