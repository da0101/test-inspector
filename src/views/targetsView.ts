import * as path from 'node:path';
import * as vscode from 'vscode';
import type { RepositorySummary, WorktreeSummary } from '../models';

type TargetNode = RepoNode | WorktreeNode | EmptyNode;

type RepoNode = {
  kind: 'repo';
  repo: RepositorySummary;
};

type WorktreeNode = {
  kind: 'worktree';
  repo: RepositorySummary;
  worktree: WorktreeSummary;
};

type EmptyNode = {
  kind: 'empty';
};

export class WorkspaceTargetsProvider implements vscode.TreeDataProvider<TargetNode> {
  private readonly emitter = new vscode.EventEmitter<TargetNode | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;
  private repos: RepositorySummary[] = [];
  private activeWorktreePath: string | null = null;

  update(repos: RepositorySummary[], activeWorktreePath: string | null): void {
    this.repos = repos;
    this.activeWorktreePath = activeWorktreePath;
    this.emitter.fire(undefined);
  }

  getChildren(node?: TargetNode): TargetNode[] {
    if (!node) {
      return this.repos.length ? this.repos.map((repo) => ({ kind: 'repo', repo })) : [{ kind: 'empty' }];
    }
    if (node.kind === 'repo') {
      return node.repo.worktrees.map((worktree) => ({ kind: 'worktree', repo: node.repo, worktree }));
    }
    return [];
  }

  getTreeItem(node: TargetNode): vscode.TreeItem {
    if (node.kind === 'empty') {
      const item = new vscode.TreeItem('Add a repository to start', vscode.TreeItemCollapsibleState.None);
      item.description = 'tracks tests read-only';
      item.iconPath = new vscode.ThemeIcon('repo');
      item.command = { command: 'testInspector.addRepository', title: 'Add Repository' };
      return item;
    }
    if (node.kind === 'repo') {
      const item = new vscode.TreeItem(node.repo.name, vscode.TreeItemCollapsibleState.Expanded);
      item.description = `${node.repo.worktrees.length} worktree${node.repo.worktrees.length === 1 ? '' : 's'}`;
      item.tooltip = [node.repo.path, node.repo.source, ...node.repo.diagnostics].filter(Boolean).join('\n');
      item.iconPath = new vscode.ThemeIcon('repo');
      item.contextValue = node.repo.source === 'tracked' ? 'trackedRepo' : 'repoCandidate';
      return item;
    }
    const active = node.worktree.path === this.activeWorktreePath;
    const label = node.worktree.isMain ? path.basename(node.worktree.path) : path.basename(node.worktree.path);
    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
    item.description = `${node.worktree.branch}${active ? ' · active' : ''}`;
    item.tooltip = node.worktree.path;
    item.iconPath = new vscode.ThemeIcon(active ? 'target' : 'git-branch', active ? new vscode.ThemeColor('charts.green') : undefined);
    item.contextValue = 'worktreeTarget';
    item.command = {
      command: 'testInspector.scanTarget',
      title: 'Scan This Worktree',
      arguments: [node.worktree, node.repo]
    };
    return item;
  }
}
