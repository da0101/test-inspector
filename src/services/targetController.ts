import * as path from 'node:path';
import * as vscode from 'vscode';
import type { FeatureScope, RepositorySummary, WorktreeSummary } from '../models';
import type { CaseFileBundle } from './caseFile';
import { ALL_FEATURES, buildFeatureScopeOptions, filterCaseBundle } from './featureScope';
import { TrackedRepoStore } from './trackedRepos';
import { discoverRepositoryCatalog } from './workspaceCatalog';
import { WorkspaceTargetsProvider } from '../views/targetsView';

export type ActiveTarget = { repo: RepositorySummary; worktree: WorktreeSummary };

type TargetControllerOptions = {
  context: vscode.ExtensionContext;
  output: vscode.OutputChannel;
  onScanTarget: (target: ActiveTarget, featureScope: FeatureScope) => Promise<void>;
  onPublishBundle: (bundle: CaseFileBundle) => void;
};

export class TargetController {
  readonly view = new WorkspaceTargetsProvider();
  private readonly trackedRepos: TrackedRepoStore;
  private activeTarget: ActiveTarget | null = null;
  private activeFeatureScope: FeatureScope = ALL_FEATURES;
  private latestRawBundle: CaseFileBundle | null = null;

  constructor(private readonly options: TargetControllerOptions) {
    this.trackedRepos = new TrackedRepoStore(options.context.globalState);
  }

  get target(): ActiveTarget | null {
    return this.activeTarget;
  }

  get featureScope(): FeatureScope {
    return this.activeFeatureScope;
  }

  setLatestRawBundle(bundle: CaseFileBundle): CaseFileBundle {
    this.latestRawBundle = bundle;
    return filterCaseBundle(bundle, this.activeFeatureScope);
  }

  async refreshTargets(): Promise<void> {
    if (!this.ensureTrusted('refresh targets')) {
      return;
    }
    const repos = await discoverRepositoryCatalog({
      trackedRepoPaths: this.trackedRepos.list(),
      workspaceFolders: vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? []
    });
    this.view.update(repos, this.activeTarget?.worktree.path ?? null);
    this.options.output.appendLine(`[targets] ${repos.length} repo(s), ${repos.reduce((sum, repo) => sum + repo.worktrees.length, 0)} worktree(s)`);
  }

  async addRepository(): Promise<void> {
    if (!this.ensureTrusted('add repository')) {
      return;
    }
    const picked = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: 'Track repository for Test Inspector'
    });
    const folder = picked?.[0]?.fsPath;
    if (!folder) return;
    const repoRoot = await this.trackedRepos.add(folder);
    if (!repoRoot) {
      void vscode.window.showWarningMessage('Test Inspector: selected folder is not inside a Git repository.');
      return;
    }
    this.options.output.appendLine(`[targets] tracked repository: ${repoRoot}`);
    await this.refreshTargets();
    void vscode.window.showInformationMessage(`Test Inspector: tracking ${path.basename(repoRoot)}.`);
  }

  async removeRepository(input?: unknown): Promise<void> {
    const repoPath = typeof input === 'string'
      ? input
      : isRepositorySummary(input)
        ? input.path
        : isRepoNode(input)
          ? input.repo.path
          : undefined;
    if (!repoPath) return;
    await this.trackedRepos.remove(repoPath);
    if (this.activeTarget?.repo.path === repoPath) {
      this.activeTarget = null;
    }
    await this.refreshTargets();
  }

  async scanTarget(worktree?: unknown, repo?: unknown): Promise<void> {
    if (!isWorktreeSummary(worktree) || !isRepositorySummary(repo)) {
      return;
    }
    this.activeTarget = { worktree, repo };
    this.activeFeatureScope = ALL_FEATURES;
    await this.refreshTargets();
    await this.options.onScanTarget(this.activeTarget, this.activeFeatureScope);
  }

  async selectFeatureScope(): Promise<void> {
    if (!this.latestRawBundle || this.latestRawBundle.cases.length === 0) {
      void vscode.window.showInformationMessage('Test Inspector: scan a target before choosing a feature scope.');
      return;
    }
    const options = buildFeatureScopeOptions(this.latestRawBundle);
    const picked = await vscode.window.showQuickPick(
      [
        { label: 'All features', description: 'clear feature scope', query: '' },
        { label: 'Type a feature filter...', description: 'for example pdf upload ocr', query: '__custom__' },
        ...options
      ],
      { placeHolder: 'Choose a feature scope' }
    );
    if (!picked) return;
    if (picked.query === '') {
      this.activeFeatureScope = ALL_FEATURES;
    } else if (picked.query === '__custom__') {
      const query = await vscode.window.showInputBox({
        title: 'Feature filter',
        prompt: 'Filter cases by feature terms, path segment, or workflow keyword.',
        placeHolder: 'pdf upload ocr'
      });
      if (!query?.trim()) return;
      this.activeFeatureScope = { kind: 'query', label: query.trim(), query: query.trim() };
    } else {
      this.activeFeatureScope = { kind: 'query', label: picked.label, query: picked.query };
    }
    this.options.onPublishBundle(filterCaseBundle(this.latestRawBundle, this.activeFeatureScope));
  }

  private ensureTrusted(action: string): boolean {
    if (vscode.workspace.isTrusted) {
      return true;
    }
    this.options.output.appendLine(`[targets] refused ${action} — workspace is untrusted`);
    void vscode.window.showWarningMessage(
      'Test Inspector: repo/worktree discovery uses the local Git CLI. Open as Trusted Workspace to use Targets.',
    );
    return false;
  }
}

function isRepositorySummary(value: unknown): value is RepositorySummary {
  return typeof value === 'object' && value !== null && 'path' in value && 'worktrees' in value;
}

function isWorktreeSummary(value: unknown): value is WorktreeSummary {
  return typeof value === 'object' && value !== null && 'path' in value && 'branch' in value && 'repoPath' in value;
}

function isRepoNode(value: unknown): value is { repo: RepositorySummary } {
  return typeof value === 'object' && value !== null && 'repo' in value && isRepositorySummary((value as { repo: unknown }).repo);
}
