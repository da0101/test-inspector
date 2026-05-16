import * as vscode from 'vscode';
import { InspectorState } from '../services/state';
import { InspectorTreeNode, toTreeItem } from './items';

export class TestsView implements vscode.TreeDataProvider<InspectorTreeNode> {
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
      return this.state.testFiles.map((testFile) => ({
        type: 'testFile',
        testFile,
        project: this.state.projects.find((project) => project.id === testFile.projectId)
      }));
    }
    if (element.type === 'testFile') {
      return element.testFile.testCases.map((testCase) => ({
        type: 'testCase',
        label: testCase.name,
        status: testCase.status,
        line: testCase.line
      }));
    }
    return [];
  }
}
