import * as path from 'node:path';
import * as vscode from 'vscode';
import { emptyBundle, type CaseFile, type CaseFileBundle, type CaseVerdict } from '../services/caseFile';

type Node = GroupNode | CaseNode;

type GroupNode = {
  kind: 'group';
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
      return VERDICT_ORDER
        .filter((v) => this.bundle.totals[v] > 0)
        .map((v) => ({
          kind: 'group' as const,
          verdict: v,
          cases: this.bundle.cases.filter((c) => c.verdict === v),
        }));
    }
    if (node.kind === 'group') {
      return node.cases.map((c) => ({ kind: 'case' as const, case: c }));
    }
    return [];
  }

  getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === 'group') {
      const item = new vscode.TreeItem(
        `${VERDICT_LABEL[node.verdict]} (${node.cases.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
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
    item.description = c.story.headline.replace(`${path.basename(c.target.path)} — `, '');
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
}
