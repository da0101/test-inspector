import type * as vscode from 'vscode';
import { normalizeRepoRoot } from './workspaceCatalog';

const TRACKED_REPOS_KEY = 'testInspector.trackedRepoPaths';

export class TrackedRepoStore {
  constructor(private readonly state: vscode.Memento) {}

  list(): string[] {
    return this.state.get<string[]>(TRACKED_REPOS_KEY, []);
  }

  async add(inputPath: string): Promise<string | null> {
    const repoRoot = await normalizeRepoRoot(inputPath);
    if (!repoRoot) {
      return null;
    }
    const next = [repoRoot, ...this.list().filter((item) => item !== repoRoot)];
    await this.state.update(TRACKED_REPOS_KEY, next);
    return repoRoot;
  }

  async remove(repoPath: string): Promise<void> {
    await this.state.update(TRACKED_REPOS_KEY, this.list().filter((item) => item !== repoPath));
  }
}
