import * as vscode from 'vscode';

export class CasesTreeProvider implements vscode.TreeDataProvider<never> {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;

  getChildren(): never[] {
    return [];
  }

  getTreeItem(element: never): vscode.TreeItem {
    return element;
  }

  refresh(): void {
    this.emitter.fire();
  }
}
