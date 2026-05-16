import * as path from 'node:path';
import * as vscode from 'vscode';
import type { TestProject } from '../models';
import {
  emptyBundle,
  type CaseFile,
  type CaseFileBundle,
  type CaseVerdict,
} from '../services/caseFile';

type Node = ProjectNode | GroupNode | CaseNode;

type ProjectNode = {
  kind: 'project';
  projectId: string;
  label: string;
  framework?: string;
  cases: CaseFile[];
};

type GroupNode = {
  kind: 'group';
  projectId: string;
  verdict: CaseVerdict;
  cases: CaseFile[];
};

type CaseNode = {
  kind: 'case';
  case: CaseFile;
};

const VERDICT_ORDER: CaseVerdict[] = ['THEATER', 'WEAK', 'MISSING', 'STRONG', 'OK'];
const VERDICT_LABEL: Record<CaseVerdict, string> = {
  THEATER: 'Theater',
  WEAK: 'Weak',
  MISSING: 'Missing',
  STRONG: 'Strong',
  OK: 'OK',
};
const VERDICT_ICON: Record<CaseVerdict, vscode.ThemeIcon> = {
  THEATER: new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground')),
  WEAK: new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground')),
  MISSING: new vscode.ThemeIcon('circle-outline'),
  STRONG: new vscode.ThemeIcon('pass', new vscode.ThemeColor('testing.iconPassed')),
  OK: new vscode.ThemeIcon('check'),
};

const FRAMEWORK_ICON: Record<string, string> = {
  flutter: 'device-mobile',
  react: 'browser',
  vue: 'browser',
  django: 'server',
  fastapi: 'server',
  'firebase-functions': 'cloud',
};

export class CasesTreeProvider implements vscode.TreeDataProvider<Node> {
  private readonly emitter = new vscode.EventEmitter<Node | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;
  private bundle: CaseFileBundle = emptyBundle();

  update(bundle: CaseFileBundle): void {
    this.bundle = bundle;
    this.emitter.fire(undefined);
  }

  getChildren(node?: Node): Node[] {
    if (!node) {
      return this.topLevelChildren();
    }
    if (node.kind === 'project') {
      return this.verdictGroupsForProject(node);
    }
    if (node.kind === 'group') {
      return node.cases.map((c) => ({ kind: 'case', case: c }));
    }
    return [];
  }

  getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === 'project') {
      const counts = countByVerdict(node.cases);
      const summary = VERDICT_ORDER
        .filter((v) => counts[v] > 0)
        .map((v) => `${counts[v]} ${VERDICT_LABEL[v].toLowerCase()}`)
        .join(' · ');
      const item = new vscode.TreeItem(
        `${node.label} (${node.framework ?? 'project'})`,
        vscode.TreeItemCollapsibleState.Expanded,
      );
      item.description = summary;
      item.iconPath = new vscode.ThemeIcon(FRAMEWORK_ICON[node.framework ?? ''] ?? 'folder-library');
      item.contextValue = 'caseProject';
      item.tooltip = `${node.label} — ${node.cases.length} case(s)`;
      return item;
    }
    if (node.kind === 'group') {
      const item = new vscode.TreeItem(
        `${VERDICT_LABEL[node.verdict]} (${node.cases.length})`,
        vscode.TreeItemCollapsibleState.Collapsed,
      );
      item.iconPath = VERDICT_ICON[node.verdict];
      item.contextValue = `caseGroup.${node.verdict.toLowerCase()}`;
      return item;
    }
    const c = node.case;
    const item = new vscode.TreeItem(
      path.basename(c.target.path),
      vscode.TreeItemCollapsibleState.None,
    );
    item.description = stripPrefix(c.story.headline, path.basename(c.target.path));
    item.tooltip = c.story.paragraph;
    item.iconPath = VERDICT_ICON[c.verdict];
    item.contextValue = `caseFile.${c.verdict.toLowerCase()}`;
    item.resourceUri = vscode.Uri.file(c.target.path);
    item.command = {
      command: 'vscode.open',
      title: 'Open',
      arguments: [vscode.Uri.file(c.target.path)],
    };
    return item;
  }

  private topLevelChildren(): Node[] {
    const projectsById = new Map<string, TestProject>();
    for (const p of this.bundle.projects ?? []) {
      projectsById.set(p.id, p);
    }
    const byProject = new Map<string, CaseFile[]>();
    for (const c of this.bundle.cases) {
      const list = byProject.get(c.target.projectId) ?? [];
      list.push(c);
      byProject.set(c.target.projectId, list);
    }
    if (byProject.size <= 1) {
      // single-project workspace: keep the old flat verdict groups for compactness
      return VERDICT_ORDER
        .filter((v) => this.bundle.totals[v] > 0)
        .map((v) => ({
          kind: 'group' as const,
          projectId: this.bundle.cases[0]?.target.projectId ?? '',
          verdict: v,
          cases: this.bundle.cases.filter((c) => c.verdict === v),
        }));
    }
    const nodes: ProjectNode[] = [];
    for (const [projectId, cases] of byProject) {
      const project = projectsById.get(projectId);
      nodes.push({
        kind: 'project',
        projectId,
        label: project?.label ?? projectId,
        framework: project?.framework,
        cases,
      });
    }
    nodes.sort((a, b) => a.label.localeCompare(b.label));
    return nodes;
  }

  private verdictGroupsForProject(node: ProjectNode): GroupNode[] {
    return VERDICT_ORDER
      .filter((v) => node.cases.some((c) => c.verdict === v))
      .map((v) => ({
        kind: 'group' as const,
        projectId: node.projectId,
        verdict: v,
        cases: node.cases.filter((c) => c.verdict === v),
      }));
  }
}

function countByVerdict(cases: CaseFile[]): Record<CaseVerdict, number> {
  const counts: Record<CaseVerdict, number> = { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 };
  for (const c of cases) counts[c.verdict] += 1;
  return counts;
}

function stripPrefix(headline: string, basename: string): string {
  const prefix = `${basename} — `;
  return headline.startsWith(prefix) ? headline.slice(prefix.length) : headline;
}
