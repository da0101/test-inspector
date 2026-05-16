import * as vscode from 'vscode';
import { CasesTreeProvider } from './views/casesView';
import { CaseFilePanel } from './views/caseFile/panel';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Test Inspector');
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  status.command = 'testInspector.openCaseFile';
  status.text = '$(beaker) Test Inspector';
  status.tooltip = 'Open Test Inspector — Case File';
  status.show();

  const casesView = new CasesTreeProvider();

  context.subscriptions.push(
    output,
    status,
    vscode.window.registerTreeDataProvider('testInspector.cases', casesView),

    vscode.commands.registerCommand('testInspector.openCaseFile', () => {
      CaseFilePanel.show(context);
    }),

    vscode.commands.registerCommand('testInspector.refresh', () => {
      void vscode.window.showInformationMessage(
        'Test Inspector: the refresh pipeline lands in Phase B. Today the Case File renders an empty state.',
      );
    }),

    vscode.commands.registerCommand('testInspector.configureLlm', () => {
      void vscode.window.showInformationMessage(
        'Test Inspector: LLM configuration lands in Phase D — for now the deterministic Case File is the product.',
      );
    }),

    vscode.commands.registerCommand('testInspector.runCurrentFile', () => {
      void vscode.window.showInformationMessage(
        'Test Inspector: per-file run wiring lands in Phase B with the refresh pipeline.',
      );
    }),

    vscode.commands.registerCommand('testInspector.exportCaseFile', () => {
      void vscode.window.showInformationMessage(
        'Test Inspector: Markdown export of the Case File lands in Phase B.',
      );
    }),
  );
}

export function deactivate(): void {
  // VS Code disposes everything registered through context.subscriptions.
}
