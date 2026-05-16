import * as vscode from 'vscode';
import { InspectorState } from './state';

export class TestInspectorController {
  private readonly controller = vscode.tests.createTestController('testInspector', 'Test Inspector');

  constructor(private readonly state: InspectorState) {}

  dispose(): void {
    this.controller.dispose();
  }

  refresh(): void {
    const items = this.state.testFiles.map((testFile) => {
      const fileItem = this.controller.createTestItem(testFile.path, vscode.workspace.asRelativePath(testFile.path), vscode.Uri.file(testFile.path));
      fileItem.canResolveChildren = false;
      for (const testCase of testFile.testCases) {
        const item = this.controller.createTestItem(testCase.id, testCase.name, vscode.Uri.file(testCase.filePath));
        if (testCase.line) {
          const line = Math.max(testCase.line - 1, 0);
          item.range = new vscode.Range(line, 0, line, 0);
        }
        fileItem.children.add(item);
      }
      return fileItem;
    });
    this.controller.items.replace(items);
  }
}
