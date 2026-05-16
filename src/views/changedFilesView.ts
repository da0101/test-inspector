import * as vscode from 'vscode';
import { InspectorState } from '../services/state';
import { InspectorTreeNode, toTreeItem } from './items';

export class ChangedFilesView implements vscode.TreeDataProvider<InspectorTreeNode> {
  private readonly changed = new vscode.EventEmitter<InspectorTreeNode | undefined | null | void>();
  readonly onDidChangeTreeData = this.changed.event;

  constructor(private readonly state: InspectorState) {}

  refresh(): void {
    this.changed.fire();
  }

  getTreeItem(element: InspectorTreeNode): vscode.TreeItem {
    return toTreeItem(element);
  }

  getChildren(element?: InspectorTreeNode): InspectorTreeNode[] {
    if (!element) {
      return this.state.changedFiles.map((risk) => ({ type: 'changedFile', risk }));
    }
    if (element.type === 'changedFile') {
      return [
        ...element.risk.relatedTests.map((test) => ({ type: 'detail' as const, label: test, icon: new vscode.ThemeIcon('beaker') })),
        ...(element.risk.coverage
          ? [
              {
                type: 'detail' as const,
                label: 'Coverage',
                description: element.risk.coverage.linesPct === undefined ? 'unknown' : `${element.risk.coverage.linesPct}%`,
                icon: new vscode.ThemeIcon('graph')
              }
            ]
          : []),
        ...element.risk.findings.map((finding) => ({ type: 'finding' as const, finding })),
        ...(element.risk.recommendedCommand
          ? [{ type: 'detail' as const, label: element.risk.recommendedCommand, icon: new vscode.ThemeIcon('terminal') }]
          : [])
      ];
    }
    return [];
  }
}
