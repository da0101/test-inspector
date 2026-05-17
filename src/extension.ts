import * as path from 'node:path';
import * as vscode from 'vscode';
import { createAdapters } from './adapters';
import { createAiReviewer, configureLlm } from './services/aiReviewController';
import { emptyBundle, type CaseFileBundle } from './services/caseFile';
import { CaseFileScanner, detectScannableProjects } from './services/caseFileScanner';
import { buildCoveragePlan, formatCoveragePreview, generateCoverageForPlan } from './services/coverageController';
import { createProviderRegistry } from './services/llm';
import { generateCaseFileReportForSelection } from './services/reportController';
import { ReviewedStore } from './services/reviewed';
import { TargetController, type ActiveTarget } from './services/targetController';
import { CaseFilePanel } from './views/caseFile/panel';
import { CasesTreeProvider } from './views/casesView';
import { ReviewerViewProvider } from './views/reviewer/panel';
import { ReportsViewProvider } from './views/reports/panel';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Test Inspector');
  output.appendLine(`[activate] Test Inspector ${context.extension.packageJSON.version ?? 'dev'} activated`);

  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  status.command = 'testInspector.openCaseFile';
  status.text = '$(beaker) Test Inspector';
  status.tooltip = 'Open Test Inspector — Case File';
  status.show();

  const casesView = new CasesTreeProvider();
  const adapters = createAdapters();
  const llmRegistry = safeCreateProviderRegistry(context, output);
  const reviewCaseWithAi = createAiReviewer(llmRegistry, output);
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const reviewed = workspaceRoot ? new ReviewedStore(workspaceRoot) : null;
  const scanner = new CaseFileScanner(adapters, output, reviewed);

  let lastRefreshAt = 0;
  let latestBundle: CaseFileBundle = emptyBundle();
  let latestSuccessfulRun: { generatedAt: number; command: string } | null = null;
  let reportsView: ReportsViewProvider;

  if (reviewed) {
    reviewed.load().catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      output.appendLine(`[activate] ReviewedStore load failed (cards will not be hidden): ${msg}`);
    });
  }

  const scanWorkspace = async (targetOverride?: ActiveTarget, featureLabel?: string): Promise<void> => {
    output.appendLine('[command] scan requested');
    if (!vscode.workspace.isTrusted) {
      output.appendLine('[scan] refused — workspace is untrusted');
      void vscode.window.showWarningMessage('Test Inspector: this workspace is not trusted. Open as Trusted Workspace to scan.');
      return;
    }

    const panel = CaseFilePanel.show(context, { onAiReview: reviewCaseWithAi });
    const target = targetOverride ?? targetController.target;
    const scope = target
      ? {
          repoName: target.repo.name,
          repoPath: target.repo.path,
          worktreePath: target.worktree.path,
          branch: target.worktree.branch,
          featureLabel: featureLabel ?? targetController.featureScope.label
        }
      : { featureLabel: featureLabel ?? targetController.featureScope.label };

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: target ? `Test Inspector: scanning ${target.repo.name}...` : 'Test Inspector: scanning...'
        },
        async () => {
          lastRefreshAt = Date.now();
          const rawBundle = await scanner.scan(target ? [target.worktree.path] : workspaceFolders(), scope);
          latestBundle = targetController.setLatestRawBundle(rawBundle);
          if (latestSuccessfulRun && latestBundle.runtime) {
            latestBundle.runtime = {
              ...latestBundle.runtime,
              passed: latestBundle.runtime.testCases,
              failed: 0,
              generatedAt: latestSuccessfulRun.generatedAt,
              command: latestSuccessfulRun.command
            };
          }
          casesView.update(latestBundle);
          reportsView.update(latestBundle);
          panel.update(latestBundle);
          output.appendLine(
            `[refresh] verdicts: ${latestBundle.totals.THEATER} theater · ${latestBundle.totals.WEAK} weak · ${latestBundle.totals.MISSING} missing · ${latestBundle.totals.STRONG} strong`
          );
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      output.appendLine(`[refresh] error: ${msg}`);
      void vscode.window.showWarningMessage(`Test Inspector: refresh failed — ${msg}`);
    }
  };

  const coverageFolders = (): { target: ActiveTarget | null; folders: string[] } => {
    const target = targetController.target;
    return { target, folders: target ? [target.worktree.path] : workspaceFolders() };
  };

  const generateCoverage = async (onProgress?: (message: string) => void): Promise<boolean> => {
    if (!vscode.workspace.isTrusted) {
      output.appendLine('[coverage] refused — workspace is untrusted');
      void vscode.window.showWarningMessage('Test Inspector: open as Trusted Workspace before running tests or coverage.');
      return false;
    }
    const { target, folders } = coverageFolders();
    if (folders.length === 0) {
      void vscode.window.showInformationMessage('Test Inspector: open a workspace or choose a target before generating coverage.');
      return false;
    }
    const plan = await buildCoveragePlan(adapters, folders);
    if (plan.skippedSupport > 0) {
      output.appendLine(`[coverage] skipped ${plan.skippedSupport} support fixture project(s)`);
    }
    if (plan.planned.length === 0) {
      const skipped = plan.skipped.map((project) => project.label).join(', ') || 'No projects';
      void vscode.window.showWarningMessage(`Test Inspector: no explicit coverage command configured. Skipped: ${skipped}.`);
      return false;
    }

    const preview = formatCoveragePreview(plan.planned);
    const approved = await vscode.window.showWarningMessage(
      `Run coverage for ${plan.planned.length} project(s)?\n\n${preview}`,
      { modal: true },
      'Run coverage'
    );
    if (approved !== 'Run coverage') {
      return false;
    }

    const result = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Test Inspector: generating coverage...' },
      async () => generateCoverageForPlan(adapters, plan.planned, (line) => {
        output.appendLine(line);
        onProgress?.(line.replace(/^\[coverage\]\s*/, ''));
      })
    );
    const failed = result.runs.filter((run) => run.exitCode !== 0);
    if (failed.length > 0) {
      throw new Error(`Coverage failed for ${failed.map((run) => run.projectId).join(', ')}.`);
    }
    if (result.coverage.length === 0) {
      throw new Error('Coverage command finished, but no supported coverage file was found.');
    }
    latestSuccessfulRun = {
      generatedAt: Date.now(),
      command: result.runs.map((run) => run.command).join(' && ')
    };
    await scanWorkspace(target ?? undefined, target ? targetController.featureScope.label : undefined);
    return true;
  };

  const runCurrentFile = async (): Promise<void> => {
    if (!vscode.workspace.isTrusted) {
      output.appendLine('[run] refused — workspace is untrusted');
      void vscode.window.showWarningMessage('Test Inspector: open as Trusted Workspace before running tests.');
      return;
    }
    const filePath = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (!filePath) {
      void vscode.window.showInformationMessage('Test Inspector: open a test file first.');
      return;
    }
    const { folders } = coverageFolders();
    const { projects } = await detectScannableProjects(adapters, folders.length ? folders : workspaceFolders());
    const project = projects.find((candidate) => isInside(candidate.rootPath, filePath));
    if (!project) {
      void vscode.window.showWarningMessage('Test Inspector: current file is not inside a detected test project.');
      return;
    }
    const adapter = adapters.find((candidate) => candidate.id === project.framework);
    if (!adapter) return;
    output.appendLine(`[run] ${project.label}: ${filePath}`);
    const result = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: `Test Inspector: running ${vscode.workspace.asRelativePath(filePath)}...` },
      async () => adapter.runFile(project, filePath)
    );
    output.appendLine(result.stdout.trim());
    output.appendLine(result.stderr.trim());
    const message = result.exitCode === 0 ? 'Test Inspector: test file passed.' : 'Test Inspector: test file failed. See output.';
    void (result.exitCode === 0 ? vscode.window.showInformationMessage(message) : vscode.window.showWarningMessage(message));
  };

  const targetController = new TargetController({
    context,
    output,
    onScanTarget: (target, featureScope) => scanWorkspace(target, featureScope.label),
    onPublishBundle: (bundle) => {
      latestBundle = bundle;
      casesView.update(bundle);
      reportsView.update(bundle);
      CaseFilePanel.show(context, { onAiReview: reviewCaseWithAi }).update(bundle);
    }
  });

  const reviewerView = new ReviewerViewProvider(context, llmRegistry, output);
  reportsView = new ReportsViewProvider(context, (mode, verdicts, onProgress) =>
    generateCaseFileReportForSelection({ bundle: latestBundle, workspaceRoot, registry: llmRegistry, output, mode, verdicts, onProgress }),
    (onProgress) => generateCoverage(onProgress)
  );
  context.subscriptions.push(
    output,
    status,
    vscode.window.registerTreeDataProvider('testInspector.targets', targetController.view),
    vscode.window.registerTreeDataProvider('testInspector.cases', casesView),
    vscode.window.registerWebviewViewProvider(ReportsViewProvider.viewType, reportsView),
    vscode.window.registerWebviewViewProvider(ReviewerViewProvider.viewType, reviewerView)
  );

  const registerCommand = (command: string, callback: (...args: unknown[]) => unknown): void => {
    context.subscriptions.push(vscode.commands.registerCommand(command, async (...args: unknown[]) => {
      output.appendLine(`[command] ${command}`);
      return callback(...args);
    }));
    output.appendLine(`[activate] registered ${command}`);
  };

  registerCommand('testInspector.openCaseFile', () => CaseFilePanel.show(context, { onAiReview: reviewCaseWithAi }));
  registerCommand('testInspector.openDashboard', () => CaseFilePanel.show(context, { onAiReview: reviewCaseWithAi }));
  registerCommand('testInspector.scan', () => scanWorkspace());
  registerCommand('testInspector.refresh', () => scanWorkspace());
  registerCommand('testInspector.refreshAll', () => scanWorkspace());
  registerCommand('testInspector.refreshTargets', () => targetController.refreshTargets());
  registerCommand('testInspector.addRepository', () => targetController.addRepository());
  registerCommand('testInspector.removeRepository', (repo?: unknown) => targetController.removeRepository(repo));
  registerCommand('testInspector.scanTarget', (worktree?: unknown, repo?: unknown) => targetController.scanTarget(worktree, repo));
  registerCommand('testInspector.selectFeatureScope', () => targetController.selectFeatureScope());
  registerCommand('testInspector.configureLlm', () => configureLlm(context, output));
  registerCommand('testInspector.runCurrentFile', () => runCurrentFile());
  registerCommand('testInspector.generateCoverage', () => generateCoverage());
  registerCommand('testInspector.exportCaseFile', () => reportsView.focus());
  registerCommand('testInspector.generateReport', () => reportsView.focus());
  registerCommand('_testInspector.markReviewed', async (filePath?: unknown) => {
    if (typeof filePath !== 'string') return;
    if (!reviewed) {
      void vscode.window.showWarningMessage('Test Inspector: open a workspace folder to enable Mark Reviewed.');
      return;
    }
    await reviewed.markReviewed(filePath);
    output.appendLine(`[review] marked reviewed: ${filePath}`);
    void scanWorkspace();
  });

  output.appendLine(`[activate] command registration complete; workspace folders: ${(vscode.workspace.workspaceFolders ?? []).length}`);
  void targetController.refreshTargets();
  scheduleInitialScan(() => lastRefreshAt, scanWorkspace, output);
}

export function deactivate(): void {
  // VS Code disposes everything registered through context.subscriptions.
}

function safeCreateProviderRegistry(context: vscode.ExtensionContext, output: vscode.OutputChannel): ReturnType<typeof createProviderRegistry> {
  try {
    const registry = createProviderRegistry(context.secrets);
    output.appendLine('[activate] llmRegistry created');
    return registry;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    output.appendLine(`[activate] llmRegistry FAILED: ${msg}`);
    return new Map();
  }
}

function workspaceFolders(): string[] {
  return vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? [];
}

function isInside(rootPath: string, filePath: string): boolean {
  const relative = path.relative(rootPath, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function scheduleInitialScan(
  lastRefreshAt: () => number,
  scanWorkspace: () => Promise<void>,
  output: vscode.OutputChannel
): void {
  if (workspaceFolders().length === 0) return;
  setTimeout(() => {
    if (Date.now() - lastRefreshAt() < 5000) return;
    output.appendLine('[activate] auto-scanning on first activation');
    void scanWorkspace().catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      output.appendLine(`[activate] auto-scan failed: ${msg}`);
    });
  }, 500);
}
