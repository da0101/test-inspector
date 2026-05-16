import * as vscode from 'vscode';
import { InspectorState } from '../services/state';
import { InspectorTreeNode, toTreeItem } from './items';

export class ProjectsView implements vscode.TreeDataProvider<InspectorTreeNode> {
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
      return this.state.projects.map((project) => ({ type: 'project', project }));
    }
    if (element.type === 'project') {
      return [
        { type: 'detail', label: element.project.rootPath, icon: new vscode.ThemeIcon('root-folder') },
        { type: 'detail', label: element.project.testCommand ?? 'No test command detected', icon: new vscode.ThemeIcon('terminal') },
        ...element.project.configFiles.map((config) => ({ type: 'detail' as const, label: config, icon: new vscode.ThemeIcon('settings-gear') }))
      ];
    }
    return [];
  }
}
