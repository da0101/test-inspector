import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TrackedRepoStore } from '../../src/services/trackedRepos';

test('tracked repo store lists and removes persisted repo roots', async () => {
  const state = new FakeMemento({
    'testInspector.trackedRepoPaths': ['/repo-a', '/repo-b'],
  });
  const store = new TrackedRepoStore(state as unknown as import('vscode').Memento);

  assert.deepEqual(store.list(), ['/repo-a', '/repo-b']);

  await store.remove('/repo-a');

  assert.deepEqual(store.list(), ['/repo-b']);
  assert.deepEqual(state.updated, [['testInspector.trackedRepoPaths', ['/repo-b']]]);
});

class FakeMemento {
  updated: Array<[string, unknown]> = [];

  constructor(private readonly values: Record<string, unknown>) {}

  get<T>(key: string, fallback: T): T {
    return (this.values[key] as T | undefined) ?? fallback;
  }

  keys(): readonly string[] {
    return Object.keys(this.values);
  }

  async update(key: string, value: unknown): Promise<void> {
    this.updated.push([key, value]);
    this.values[key] = value;
  }
}
