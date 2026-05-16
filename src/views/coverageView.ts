import * as vscode from 'vscode';
import { InspectorState } from '../services/state';
import { InspectorTreeNode, toTreeItem } from './items';

export class CoverageView implements vscode.TreeDataProvider<InspectorTreeNode> {
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
      return this.state.coverage.map((summary) => {
        const project = this.state.projects.find((item) => item.id === summary.projectId);
        return {
          type: 'coverageProject',
          projectId: summary.projectId,
          label: project?.label ?? summary.projectId,
          linesPct: summary.totals.linesPct
        };
      });
    }
    if (element.type === 'coverageProject') {
      const summary = this.state.coverage.find((candidate) => candidate.projectId === element.projectId);
      if (!summary) {
        return [];
      }
      return summary.files.map((coverage) => ({
        type: 'coverageFile',
        coverage,
        project: this.state.projects.find((project) => project.id === summary.projectId)
      }));
    }
    return [];
  }
}
