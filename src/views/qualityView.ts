import * as vscode from 'vscode';
import { InspectorState } from '../services/state';
import { InspectorTreeNode, toTreeItem } from './items';

export class QualityView implements vscode.TreeDataProvider<InspectorTreeNode> {
  private readonly changed = new vscode.EventEmitter<InspectorTreeNode | undefined | null | void>();
  readonly onDidChangeTreeData = this.changed.event;

  constructor(private readonly state: InspectorState) {}

  refresh(): void {
    this.changed.fire();
  }

  getTreeItem(element: InspectorTreeNode): vscode.TreeItem {
    return toTreeItem(element);
  }

  getChildren(): InspectorTreeNode[] {
    return this.state.testFiles.flatMap((testFile) => testFile.qualityFindings.map((finding) => ({ type: 'finding' as const, finding })));
  }
}
