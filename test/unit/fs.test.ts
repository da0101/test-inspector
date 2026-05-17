import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { findUp, pathExists, readJsonIfExists, readTextIfExists, walkFiles } from '../../src/utils/fs';

test('fs utils read existing files and return null/false for missing files', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-fs-'));
  try {
    const file = path.join(root, 'data.json');
    await writeFile(file, JSON.stringify({ ok: true }));

    assert.equal(await pathExists(file), true);
    assert.equal(await pathExists(path.join(root, 'missing.json')), false);
    assert.equal(await readTextIfExists(file), '{"ok":true}');
    assert.deepEqual(await readJsonIfExists(file), { ok: true });
    assert.equal(await readTextIfExists(path.join(root, 'missing.json')), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fs utils walk files with excludes, include filters, and max file limit', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-walk-'));
  try {
    await mkdir(path.join(root, 'src'), { recursive: true });
    await mkdir(path.join(root, 'node_modules', 'pkg'), { recursive: true });
    await writeFile(path.join(root, 'src', 'a.ts'), 'a');
    await writeFile(path.join(root, 'src', 'b.js'), 'b');
    await writeFile(path.join(root, 'node_modules', 'pkg', 'ignored.ts'), 'ignored');

    const files = await walkFiles(root, {
      maxFiles: 1,
      include: (filePath) => filePath.endsWith('.ts'),
    });

    assert.equal(files.length, 1);
    assert.match(files[0]!, /src\/a\.ts$/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('fs utils findUp stops at the configured boundary', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'test-inspector-find-up-'));
  try {
    const nested = path.join(root, 'a', 'b');
    await mkdir(nested, { recursive: true });
    await writeFile(path.join(root, 'marker.txt'), 'root');

    assert.equal(await findUp('marker.txt', nested, root), path.join(root, 'marker.txt'));
    assert.equal(await findUp('missing.txt', nested, root), null);
    assert.equal(await findUp('marker.txt', nested, path.join(root, 'a')), null);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
