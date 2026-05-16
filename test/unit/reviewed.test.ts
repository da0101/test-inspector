import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { ReviewedStore } from '../../src/services/reviewed';

let tempCounter = 0;
async function newTempDir(): Promise<string> {
  const dir = path.join(os.tmpdir(), `test-inspector-reviewed-${Date.now()}-${tempCounter++}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

test('reviewed · marks a file and persists to disk; reload finds it', async () => {
  const dir = await newTempDir();
  const file = path.join(dir, 'foo.test.ts');
  await fs.writeFile(file, "test('a', () => expect(true).toBe(true));", 'utf8');

  const a = new ReviewedStore(dir);
  await a.load();
  await a.markReviewed(file);

  const b = new ReviewedStore(dir);
  await b.load();
  assert.equal(await b.shouldHide(file), true);
});

test('reviewed · returns false after the file content changes', async () => {
  const dir = await newTempDir();
  const file = path.join(dir, 'foo.test.ts');
  await fs.writeFile(file, 'old content', 'utf8');

  const store = new ReviewedStore(dir);
  await store.load();
  await store.markReviewed(file);

  await fs.writeFile(file, 'new content — user fixed the test', 'utf8');
  assert.equal(await store.shouldHide(file), false);
});

test('reviewed · returns false for a path that was never marked', async () => {
  const dir = await newTempDir();
  const store = new ReviewedStore(dir);
  await store.load();
  assert.equal(await store.shouldHide('/nonexistent/path.ts'), false);
});

test('reviewed · returns false when the file no longer exists', async () => {
  const dir = await newTempDir();
  const file = path.join(dir, 'goner.test.ts');
  await fs.writeFile(file, 'content', 'utf8');

  const store = new ReviewedStore(dir);
  await store.load();
  await store.markReviewed(file);
  await fs.rm(file);

  assert.equal(await store.shouldHide(file), false);
});
