import * as vscode from 'vscode';
import { createAdapters } from './adapters';
import type { CoverageSummary, TestFile, TestProject } from './models';
import {
  emptyBundle,
  synthesizeCaseFile,
  type CaseFileBundle,
} from './services/caseFile';
import { analyzeSourceRisks } from './services/sourceRisk';
import { CaseFilePanel } from './views/caseFile/panel';
import { CasesTreeProvider } from './views/casesView';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Test Inspector');
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  status.command = 'testInspector.openCaseFile';
  status.text = '$(beaker) Test Inspector';
  status.tooltip = 'Open Test Inspector — Case File';
  status.show();

  const casesView = new CasesTreeProvider();
  const adapters = createAdapters();
  let lastRefreshAt = 0;
  const REFRESH_DEBOUNCE_MS = 5000;

  async function refresh(): Promise<CaseFileBundle> {
    lastRefreshAt = Date.now();
    const folders = vscode.workspace.workspaceFolders?.map((f) => f.uri.fsPath) ?? [];
    if (folders.length === 0) {
      output.appendLine('[refresh] no workspace folders open');
      return emptyBundle();
    }
    output.appendLine(`[refresh] scanning ${folders.length} workspace folder(s)`);

    const projects = (
      await Promise.all(adapters.map((a) => a.detectProjects(folders)))
    ).flat();
    if (projects.length === 0) {
      output.appendLine('[refresh] no test projects detected in this workspace');
      return emptyBundle();
    }
    output.appendLine(
      `[refresh] ${projects.length} project(s): ${projects.map((p) => `${p.label}(${p.framework})`).join(', ')}`,
    );

    const allTestFiles: TestFile[] = [];
    const allCoverage: CoverageSummary[] = [];
    const scannedProjects: TestProject[] = [];
    for (const project of projects) {
      const adapter = adapters.find((a) => a.id === project.framework);
      if (!adapter) {
        output.appendLine(`[refresh] no adapter for ${project.framework} — skipping ${project.label}`);
        continue;
      }
      try {
        const rawTests = await adapter.discoverTests(project);
        const findings = await adapter.analyzeQuality(project, rawTests);
        const withFindings: TestFile[] = rawTests.map((t) => ({
          ...t,
          qualityFindings: findings.filter((f) => f.filePath === t.path),
        }));
        allTestFiles.push(...withFindings);

        let coverageMsg = 'no coverage';
        try {
          const coverage = await adapter.readCoverage(project);
          if (coverage) {
            allCoverage.push(coverage);
            coverageMsg = `${coverage.files.length} file(s) covered`;
          }
        } catch (err) {
          coverageMsg = `coverage read failed: ${err instanceof Error ? err.message : String(err)}`;
        }
        scannedProjects.push(project);
        output.appendLine(
          `[refresh] ${project.label}: ${withFindings.length} test file(s), ${findings.length} static finding(s), ${coverageMsg}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        output.appendLine(`[refresh] ${project.label}: error during discovery — ${msg}`);
      }
    }

    let sourceRisks: Awaited<ReturnType<typeof analyzeSourceRisks>> = [];
    try {
      sourceRisks = await analyzeSourceRisks(scannedProjects, allTestFiles, allCoverage);
      output.appendLine(
        `[refresh] source-file risk: ${sourceRisks.length} source file(s) analyzed`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      output.appendLine(`[refresh] source-risk analysis failed: ${msg}`);
    }

    const bundle = await synthesizeCaseFile({ testFiles: allTestFiles, sourceRisks });
    casesView.update(bundle);
    output.appendLine(
      `[refresh] verdicts: ${bundle.totals.THEATER} theater · ${bundle.totals.WEAK} weak · ${bundle.totals.MISSING} missing · ${bundle.totals.STRONG} strong`,
    );
    return bundle;
  }

  context.subscriptions.push(
    output,
    status,
    vscode.window.registerTreeDataProvider('testInspector.cases', casesView),

    vscode.commands.registerCommand('testInspector.openCaseFile', () => {
      CaseFilePanel.show(context);
    }),

    vscode.commands.registerCommand('testInspector.refresh', async () => {
      const panel = CaseFilePanel.show(context);
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Test Inspector: scanning…',
          },
          async () => {
            const bundle = await refresh();
            panel.update(bundle);
          },
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        output.appendLine(`[refresh] error: ${msg}`);
        void vscode.window.showWarningMessage(`Test Inspector: refresh failed — ${msg}`);
      }
    }),

    vscode.commands.registerCommand('testInspector.configureLlm', () => {
      void vscode.window.showInformationMessage(
        'Test Inspector: LLM configuration lands in Phase D — for now the deterministic Case File is the product.',
      );
    }),

    vscode.commands.registerCommand('testInspector.runCurrentFile', () => {
      void vscode.window.showInformationMessage(
        'Test Inspector: per-file run wiring lands in Phase C.',
      );
    }),

    vscode.commands.registerCommand('testInspector.exportCaseFile', () => {
      void vscode.window.showInformationMessage(
        'Test Inspector: Markdown export of the Case File lands in Phase C.',
      );
    }),
  );

  // Auto-scan once on activation if a workspace is open. The 500 ms delay lets
  // any explicit command (e.g. the user clicking Refresh in the welcome panel)
  // fire first; if it does, lastRefreshAt is updated and this auto-trigger
  // short-circuits inside the debounce window so we never double-scan.
  const folders = vscode.workspace.workspaceFolders ?? [];
  if (folders.length > 0) {
    setTimeout(() => {
      if (Date.now() - lastRefreshAt < REFRESH_DEBOUNCE_MS) {
        return;
      }
      output.appendLine('[activate] auto-scanning on first activation');
      void vscode.commands.executeCommand('testInspector.refresh');
    }, 500);
  }
}

export function deactivate(): void {
  // VS Code disposes everything registered through context.subscriptions.
}
