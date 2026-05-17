import assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';
import { parseAgentboardReposMarkdown, parseWorktreePorcelain } from '../../src/services/workspaceCatalog';

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
