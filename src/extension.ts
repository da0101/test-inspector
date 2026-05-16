import { promises as fs } from 'node:fs';
import * as vscode from 'vscode';
import { createAdapters } from './adapters';
import type { CoverageSummary, TestFile, TestProject } from './models';
import {
  emptyBundle,
  synthesizeCaseFile,
  type CaseFile,
  type CaseFileAiReview,
  type CaseFileBundle,
  type CaseVerdict,
} from './services/caseFile';
import { exportCaseFileAsMarkdown } from './services/exportMarkdown';
import { activeProvider, createProviderRegistry, enrichCase, PROVIDER_IDS, secretKey, type LlmProviderId } from './services/llm';
import { ReviewedStore } from './services/reviewed';
import { analyzeSourceRisks } from './services/sourceRisk';
import { CaseFilePanel } from './views/caseFile/panel';
import { CasesTreeProvider } from './views/casesView';
import { ReviewerViewProvider } from './views/reviewer/panel';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Test Inspector');
  output.appendLine(`[activate] Test Inspector ${context.extension.packageJSON.version ?? 'dev'} activated`);
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  status.command = 'testInspector.openCaseFile';
  status.text = '$(beaker) Test Inspector';
  status.tooltip = 'Open Test Inspector — Case File';
  status.show();

  const casesView = new CasesTreeProvider();
  output.appendLine('[activate] casesView created');
  const adapters = createAdapters();
  output.appendLine(`[activate] adapters created (${adapters.length})`);
  let llmRegistry: ReturnType<typeof createProviderRegistry>;
  try {
    llmRegistry = createProviderRegistry(context.secrets);
    output.appendLine('[activate] llmRegistry created');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    output.appendLine(`[activate] llmRegistry FAILED: ${msg}`);
    llmRegistry = new Map();
  }
  let lastRefreshAt = 0;
  const REFRESH_DEBOUNCE_MS = 5000;
  let latestBundle: CaseFileBundle = emptyBundle();

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const reviewed = workspaceRoot ? new ReviewedStore(workspaceRoot) : null;
  if (reviewed) {
    // Fire-and-forget but log failures so a corrupt .test-inspector/reviewed.json
    // doesn't silently leave reviewed cards un-hidden.
    reviewed.load().catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      output.appendLine(`[activate] ReviewedStore load failed (cards will not be hidden): ${msg}`);
    });
  }

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

    const bundle = await synthesizeCaseFile({
      testFiles: allTestFiles,
      sourceRisks,
      projects: scannedProjects,
    });

    if (reviewed) {
      const visible: CaseFile[] = [];
      let hidden = 0;
      for (const c of bundle.cases) {
        if (await reviewed.shouldHide(c.target.path)) {
          hidden++;
          continue;
        }
        visible.push(c);
      }
      bundle.cases = visible;
      bundle.totals = recountTotals(visible);
      bundle.hiddenReviewedCount = hidden;
      if (hidden > 0) {
        output.appendLine(`[refresh] hidden as reviewed: ${hidden} case(s) (edit .test-inspector/reviewed.json to unhide)`);
      }
    }

    casesView.update(bundle);
    latestBundle = bundle;
    output.appendLine(
      `[refresh] verdicts: ${bundle.totals.THEATER} theater · ${bundle.totals.WEAK} weak · ${bundle.totals.MISSING} missing · ${bundle.totals.STRONG} strong`,
    );
    return bundle;
  }

  const reviewerView = new ReviewerViewProvider(context, llmRegistry, output);
  context.subscriptions.push(
    output,
    status,
    vscode.window.registerTreeDataProvider('testInspector.cases', casesView),
    vscode.window.registerWebviewViewProvider(ReviewerViewProvider.viewType, reviewerView),
  );

  function registerCommand(command: string, callback: (...args: unknown[]) => unknown): void {
    try {
      context.subscriptions.push(
        vscode.commands.registerCommand(command, async (...args: unknown[]) => {
          output.appendLine(`[command] ${command}`);
          return callback(...args);
        }),
      );
      output.appendLine(`[activate] registered ${command}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      output.appendLine(`[activate] failed to register ${command}: ${msg}`);
    }
  }

  async function scanWorkspace(): Promise<void> {
    output.appendLine('[command] scan requested');
    // Workspace trust guard — though the current scan is read-only, we may add
    // subprocess test execution in future. Refusing in untrusted workspaces now
    // means the contract is enforced from day one.
    if (!vscode.workspace.isTrusted) {
      output.appendLine('[scan] refused — workspace is untrusted');
      void vscode.window.showWarningMessage(
        'Test Inspector: this workspace is not trusted. Open as Trusted Workspace to scan.',
      );
      return;
    }
    const panel = CaseFilePanel.show(context, { onAiReview: reviewCaseWithAi });
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Test Inspector: scanning...',
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
  }

  registerCommand('testInspector.openCaseFile', () => {
      CaseFilePanel.show(context, { onAiReview: reviewCaseWithAi });
    });

  registerCommand('testInspector.openDashboard', () => {
      CaseFilePanel.show(context, { onAiReview: reviewCaseWithAi });
    });

  registerCommand('testInspector.scan', scanWorkspace);
  registerCommand('testInspector.refresh', scanWorkspace);
  registerCommand('testInspector.refreshAll', scanWorkspace);

  registerCommand('testInspector.configureLlm', async () => {
      await configureLlm(context, output);
    });

  registerCommand('testInspector.runCurrentFile', () => {
      void vscode.window.showInformationMessage(
        'Test Inspector: per-file run wiring lands in Phase C.',
      );
    });

  registerCommand('testInspector.exportCaseFile', async () => {
      if (latestBundle.cases.length === 0) {
        void vscode.window.showInformationMessage(
          'Test Inspector: nothing to export yet — click Refresh to scan first.',
        );
        return;
      }
      const defaultName = 'test-inspector-case-file.md';
      const targetUri = await vscode.window.showSaveDialog({
        defaultUri: workspaceRoot
          ? vscode.Uri.file(`${workspaceRoot}/${defaultName}`)
          : undefined,
        filters: { Markdown: ['md'] },
      });
      if (!targetUri) return;
      const markdown = exportCaseFileAsMarkdown(latestBundle);
      await vscode.workspace.fs.writeFile(targetUri, Buffer.from(markdown, 'utf8'));
      void vscode.window.showInformationMessage(
        `Test Inspector: Case File exported to ${vscode.workspace.asRelativePath(targetUri)}`,
      );
    });

  registerCommand('_testInspector.markReviewed', async (filePath?: unknown) => {
      if (typeof filePath !== 'string') {
        return;
      }
      if (!reviewed) {
        void vscode.window.showWarningMessage(
          'Test Inspector: open a workspace folder to enable Mark Reviewed.',
        );
        return;
      }
      await reviewed.markReviewed(filePath);
      output.appendLine(`[review] marked reviewed: ${filePath}`);
      void scanWorkspace();
    });

  output.appendLine(`[activate] command registration complete; workspace folders: ${(vscode.workspace.workspaceFolders ?? []).length}`);

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
      void refresh().catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        output.appendLine(`[activate] auto-scan failed: ${msg}`);
      });
    }, 500);
  }

  async function reviewCaseWithAi(caseFile: CaseFile, bundle: CaseFileBundle): Promise<CaseFileAiReview> {
    const provider = activeProvider(llmRegistry);
    if (!provider) {
      return {
        status: 'error',
        reviewedAt: Date.now(),
        error: 'No AI reviewer selected. Run "Test Inspector: Configure LLM (optional reviewer)" and choose OpenAI, Claude, or Gemini.',
      };
    }
    if (!(await provider.isConfigured())) {
      return {
        status: 'error',
        provider: provider.displayName,
        reviewedAt: Date.now(),
        error: `${provider.displayName} is selected, but no API key is stored. Run Configure LLM and add the key.`,
      };
    }

    try {
      const approved = await vscode.window.showWarningMessage(
        `Send ${caseFile.target.kind} file content and up to 3 related files to ${provider.displayName} for evidence-grounded review?`,
        { modal: true },
        'Send for review',
      );
      if (approved !== 'Send for review') {
        return {
          status: 'error',
          provider: provider.displayName,
          reviewedAt: Date.now(),
          error: 'AI review cancelled. No code was sent.',
        };
      }
      const fileContent = await fs.readFile(caseFile.target.path, 'utf8');
      const relatedContent = await readRelatedContent(caseFile, bundle);
      output.appendLine(`[llm] sending ${caseFile.target.path} to ${provider.displayName}…`);
      const result = await enrichCase(provider, { caseFile, fileContent, relatedContent });
      if (!result.ok) {
        output.appendLine(`[llm] enrichment failed: ${result.error}`);
        if (result.rawResponse) {
          output.appendLine(`[llm] raw response (first 800 chars):`);
          output.appendLine(result.rawResponse.slice(0, 800));
          output.appendLine(`[llm] --- end raw response ---`);
        }
        return {
          status: 'error',
          provider: provider.displayName,
          reviewedAt: Date.now(),
          error: result.error,
        };
      }
      output.appendLine(`[llm] enrichment ok: ${result.explanation.evidenceAnchors.length} verified, ${result.droppedAnchors} dropped`);
      return {
        status: result.explanation.verdictAlignsWithEvidence ? 'accepted' : 'challenged',
        provider: result.provider,
        model: result.model,
        reviewedAt: Date.now(),
        explanation: result.explanation.explanation,
        evidenceAnchors: result.explanation.evidenceAnchors,
        suggestedFix: result.explanation.suggestedFix,
        uncertaintyNotes: result.explanation.uncertaintyNotes,
        droppedAnchors: result.droppedAnchors,
      };
    } catch (err) {
      return {
        status: 'error',
        provider: provider.displayName,
        reviewedAt: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export function deactivate(): void {
  // VS Code disposes everything registered through context.subscriptions.
}

function recountTotals(cases: CaseFile[]): Record<CaseVerdict, number> {
  const totals: Record<CaseVerdict, number> = { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0, OK: 0 };
  for (const c of cases) totals[c.verdict] += 1;
  return totals;
}

async function readRelatedContent(caseFile: CaseFile, bundle: CaseFileBundle): Promise<{ path: string; content: string }[]> {
  const paths = new Set<string>();
  for (const related of caseFile.evidence.relatedTests.slice(0, 3)) {
    paths.add(related.path);
  }
  if (caseFile.target.kind === 'test') {
    for (const candidate of bundle.cases) {
      if (candidate.target.kind === 'source' && candidate.evidence.relatedTests.some((related) => related.path === caseFile.target.path)) {
        paths.add(candidate.target.path);
      }
      if (paths.size >= 3) break;
    }
  }

  const relatedContent: { path: string; content: string }[] = [];
  for (const filePath of paths) {
    if (filePath === caseFile.target.path) continue;
    try {
      relatedContent.push({ path: filePath, content: await fs.readFile(filePath, 'utf8') });
    } catch {
      // Related context is helpful but not required for grounded validation.
    }
  }
  return relatedContent;
}

async function configureLlm(context: vscode.ExtensionContext, output: vscode.OutputChannel): Promise<void> {
  const registry = createProviderRegistry(context.secrets);
  const cfg = vscode.workspace.getConfiguration('testInspector.llm');
  const current = cfg.get<string>('provider') || 'none';
  const picked = await vscode.window.showQuickPick(
    [
      { label: 'Disable AI reviewer', id: 'none' as const, description: current === 'none' ? 'current' : undefined },
      ...PROVIDER_IDS.map((id) => {
        const provider = registry.get(id);
        return {
          label: provider?.displayName ?? id,
          id,
          description: current === id ? 'current' : undefined,
          detail: provider?.suggestedModels.join(', '),
        };
      }),
    ],
    { placeHolder: 'Choose the optional AI reviewer provider' },
  );
  if (!picked) return;

  if (picked.id === 'none') {
    await cfg.update('provider', 'none', vscode.ConfigurationTarget.Workspace);
    output.appendLine('[llm] disabled');
    void vscode.window.showInformationMessage('Test Inspector: AI reviewer disabled.');
    return;
  }

  const providerId = picked.id as LlmProviderId;
  const provider = registry.get(providerId);
  if (!provider) return;

  await cfg.update('provider', providerId, vscode.ConfigurationTarget.Workspace);
  const model = await vscode.window.showQuickPick(provider.suggestedModels, {
    placeHolder: `Choose ${provider.displayName} model`,
  });
  if (model) {
    await cfg.update('model', model, vscode.ConfigurationTarget.Workspace);
  }

  const action = await vscode.window.showQuickPick(['Add or replace API key', 'Delete stored API key', 'Keep existing key'], {
    placeHolder: `${provider.displayName} API key`,
  });
  if (!action) return;

  if (action === 'Delete stored API key') {
    await context.secrets.delete(secretKey(providerId));
    output.appendLine(`[llm] deleted ${provider.displayName} key`);
    void vscode.window.showInformationMessage(`Test Inspector: deleted stored ${provider.displayName} API key.`);
    return;
  }

  if (action === 'Add or replace API key') {
    const apiKey = await vscode.window.showInputBox({
      title: `${provider.displayName} API key`,
      prompt: 'Stored in VS Code SecretStorage. It is never written to settings or reports.',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => (value.trim() ? null : 'API key is required.'),
    });
    if (!apiKey) return;
    await context.secrets.store(secretKey(providerId), apiKey.trim());
  }

  const configuredProvider = createProviderRegistry(context.secrets).get(providerId);
  const test = configuredProvider ? await configuredProvider.testConnection() : { ok: false as const, error: 'Provider unavailable.' };
  if (test.ok) {
    output.appendLine(`[llm] ${provider.displayName} configured (${test.modelUsed})`);
    void vscode.window.showInformationMessage(`Test Inspector: ${provider.displayName} reviewer configured.`);
  } else {
    output.appendLine(`[llm] ${provider.displayName} test failed: ${test.error}`);
    void vscode.window.showWarningMessage(`Test Inspector: ${provider.displayName} key saved, but test failed — ${test.error}`);
  }
}
