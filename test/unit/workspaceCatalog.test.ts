import assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';
import { discoverRepositoryCatalog, normalizeRepoRoot, parseAgentboardReposMarkdown, parseWorktreePorcelain } from '../../src/services/workspaceCatalog';

test('parses git worktree porcelain without mutating repository state', () => {
  const raw = [
    'worktree /repos/app',
    'HEAD abc123',
    'branch refs/heads/main',
    '',
    'worktree /repos/app-feature',
    'HEAD def456',
    'branch refs/heads/feature/pdf-upload',
    ''
  ].join('\n');

  const worktrees = parseWorktreePorcelain(raw, '/repos/app', 'tracked');

  assert.deepEqual(
    worktrees.map((worktree) => ({
      path: worktree.path,
      branch: worktree.branch,
      isMain: worktree.isMain,
      source: worktree.source
    })),
    [
      { path: '/repos/app', branch: 'main', isMain: true, source: 'tracked' },
      { path: '/repos/app-feature', branch: 'feature/pdf-upload', isMain: false, source: 'tracked' }
    ]
  );
});

test('parses Agentboard repo tables as optional child repo expansion', () => {
  const hub = path.resolve('/workspace/hub');
  const text = [
    '| Repo ID | Path | Role / stack hint | Deep reference |',
    '|---|---|---|---|',
    '| takecare-platform | `../takecare-platform` | hub | `takecare-platform.md` |',
    '| _repo-1_ | `../placeholder` | _todo_ | `repo-1.md` |',
    '| mobile | `/repos/mobile` | flutter | `mobile.md` |'
  ].join('\n');

  assert.deepEqual(parseAgentboardReposMarkdown(text, hub), [
    path.resolve('/workspace/takecare-platform'),
    '/repos/mobile'
  ]);
});

test('normalizes invalid repository roots to null', async () => {
  assert.equal(await normalizeRepoRoot('/path/that/does/not/exist'), null);
});

test('catalog discovery skips invalid and duplicate candidate paths', async () => {
  const repos = await discoverRepositoryCatalog({
    trackedRepoPaths: ['/path/that/does/not/exist', '/path/that/does/not/exist'],
    workspaceFolders: ['/another/missing/path'],
  });

  assert.deepEqual(repos, []);
});

test('parses malformed worktree blocks by keeping only blocks with worktree paths', () => {
  const raw = [
    'HEAD abc123',
    'branch refs/heads/missing-worktree',
    '',
    'worktree /repos/app-detached',
    'HEAD def456',
    '',
  ].join('\n');

  const worktrees = parseWorktreePorcelain(raw, '/repos/app', 'workspace');

  assert.equal(worktrees.length, 1);
  assert.equal(worktrees[0]!.path, '/repos/app-detached');
  assert.equal(worktrees[0]!.branch, '(detached)');
  assert.equal(worktrees[0]!.isMain, false);
});
