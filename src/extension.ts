import { promises as fs } from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { createAdapters } from './adapters';
import { TestFrameworkAdapter } from './adapters/types';
import { TestProject } from './models';
import { analyzeFeatureAreas } from './services/features';
import { investigateFeatureArea } from './services/featureInvestigator';
import { buildChangedFileRisks, getChangedFiles } from './services/git';
import { renderFeatureInvestigationMarkdown, renderInvestigationMarkdown } from './services/investigationReport';
import { findRiskForFile, investigateSourceRisk } from './services/investigator';
import { LlmProvider, OpenAiCompatibleProvider, secretKey } from './services/llm';
import { buildReport, renderMarkdownReport } from './services/report';
import { runCoverage } from './services/runner';
import { analyzeSetupIssues } from './services/setup';
import { analyzeSourceRisks } from './services/sourceRisk';
import { InspectorState } from './services/state';
import { TestInspectorController } from './services/testController';
import { ChangedFilesView } from './views/changedFilesView';
import { CoverageView } from './views/coverageView';
import { Dashboard } from './views/dashboard';
import { FeatureInvestigationView } from './views/featureInvestigationView';
import { InvestigationView } from './views/investigationView';
import { ProjectsView } from './views/projectsView';
import { QualityView } from './views/qualityView';
import { TestsView } from './views/testsView';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const state = new InspectorState();
  const adapters = createAdapters();
  const projectsView = new ProjectsView(state);
  const testsView = new TestsView(state);
  const coverageView = new CoverageView(state);
  const qualityView = new QualityView(state);
  const changedFilesView = new ChangedFilesView(state);
  const testController = new TestInspectorController(state);
  const dashboard = new Dashboard(state);
  const investigationView = new InvestigationView();
  const featureInvestigationView = new FeatureInvestigationView();
  const llmProvider = new OpenAiCompatibleProvider(context.secrets);
  const output = vscode.window.createOutputChannel('Test Inspector');
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 90);
  status.command = 'testInspector.openDashboard';
  status.text = '$(beaker) Test Inspector';
  status.tooltip = 'Open Test Inspector dashboard';
  status.show();

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('testInspector.projects', projectsView),
    vscode.window.registerTreeDataProvider('testInspector.tests', testsView),
    vscode.window.registerTreeDataProvider('testInspector.coverage', coverageView),
    vscode.window.registerTreeDataProvider('testInspector.quality', qualityView),
    vscode.window.registerTreeDataProvider('testInspector.changedFiles', changedFilesView),
    testController,
    output,
    status,
    vscode.commands.registerCommand('testInspector.openDashboard', () => {
      dashboard.show();
    }),
    vscode.commands.registerCommand('testInspector.selectProject', async (projectId?: string) => {
      await runSafely(output, async () => {
        await selectProjectFilter(state, projectId);
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.clearProjectFilter', async () => {
      await runSafely(output, async () => {
        state.selectedProjectId = null;
        state.selectedFeatureId = null;
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.selectFeature', async (featureId?: string) => {
      await runSafely(output, async () => {
        await selectFeatureFilter(state, featureId);
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.clearFeatureFilter', async () => {
      await runSafely(output, async () => {
        state.selectedFeatureId = null;
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.clearNotices', async () => {
      await runSafely(output, async () => {
        state.clearNotices();
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.configureLlm', async () => {
      await runSafely(output, () => configureLlm(context, output));
    }),
    vscode.commands.registerCommand('testInspector.openFile', async (filePath?: string) => {
      await runSafely(output, () => openFile(filePath));
    }),
    vscode.commands.registerCommand('testInspector.exportInvestigation', async () => {
      await runSafely(output, () => exportInvestigation(state, output));
    }),
    vscode.commands.registerCommand('testInspector.runFeatureTests', async (featureId?: string) => {
      await runSafely(output, () => runFeatureTests(state, output, featureId));
    }),
    vscode.commands.registerCommand('testInspector.analyzeFeature', async (featureId?: string) => {
      await runSafely(output, async () => {
        await analyzeFeature(state, output, status, llmProvider, featureInvestigationView, featureId);
      });
    }),
    vscode.commands.registerCommand('testInspector.exportFeatureInvestigation', async () => {
      await runSafely(output, () => exportFeatureInvestigation(state, output));
    }),
    vscode.commands.registerCommand('testInspector.analyzeTopRisk', async () => {
      await runSafely(output, async () => {
        await analyzeTopRisk(state, output, status, llmProvider, investigationView);
      });
    }),
    vscode.commands.registerCommand('testInspector.analyzeCurrentFile', async () => {
      await runSafely(output, async () => {
        await analyzeCurrentFile(state, output, status, llmProvider, investigationView);
      });
    }),
    vscode.commands.registerCommand('testInspector.analyzeFile', async (filePath?: string) => {
      await runSafely(output, async () => {
        await analyzeFilePath(state, output, status, llmProvider, investigationView, filePath);
      });
    }),
    vscode.commands.registerCommand('testInspector.refreshAll', async () => {
      await runSafely(output, async () => {
        await refreshAll(state, adapters, output, status);
        testController.refresh();
        refreshViews();
        dashboard.show();
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.refreshProjects', async () => {
      await runSafely(output, async () => {
        await withProgress('Detecting test projects', status, async () => {
          await refreshProjects(state, adapters, output);
        });
        refreshViews();
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.discoverTests', async () => {
      await runSafely(output, async () => {
        await withProgress('Discovering tests', status, async () => {
          await discoverAllTests(state, adapters, output);
          await analyzeSetup(state, output);
        });
        testController.refresh();
        refreshViews();
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.generateCoverage', async () => {
      await runSafely(output, async () => {
        await withProgress('Generating coverage', status, async () => {
          await generateCoverage(state, adapters, output);
          await analyzeSetup(state, output);
          await analyzeRisks(state, output);
          await analyzeFeatures(state, output);
        });
        refreshViews();
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.showChangedRisk', async () => {
      await runSafely(output, async () => {
        await withProgress('Analyzing changed-file risk', status, async () => {
          await refreshChangedFiles(state, output);
        });
        refreshViews();
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.exportReport', async () => {
      await runSafely(output, () => exportReport(state, output));
    }),
    vscode.commands.registerCommand('testInspector.runAll', async (node?: { project?: TestProject }) => {
      await runSafely(output, async () => {
        await runForProject(state, adapters, output, status, node?.project);
        testController.refresh();
        refreshViews();
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.runCurrentFile', async (node?: { testFile?: { path: string; projectId: string } }) => {
      await runSafely(output, async () => {
        await runCurrentFile(state, adapters, output, status, node);
        testController.refresh();
        refreshViews();
        dashboard.refresh();
      });
    }),
    vscode.commands.registerCommand('testInspector.runRelated', async () => {
      await runSafely(output, async () => {
        await runRelatedForActiveFile(state, adapters, output, status);
        testController.refresh();
        refreshViews();
        dashboard.refresh();
      });
    })
  );

  function refreshViews(): void {
    projectsView.refresh();
    testsView.refresh();
    coverageView.refresh();
    qualityView.refresh();
    changedFilesView.refresh();
  }

  await runSafely(output, async () => {
    await refreshAll(state, adapters, output, status);
    testController.refresh();
    refreshViews();
    dashboard.show();
    dashboard.refresh();
  });
}

export function deactivate(): void {
  // VS Code disposes subscriptions registered during activation.
}

async function refreshAll(
  state: InspectorState,
  adapters: TestFrameworkAdapter[],
  output: vscode.OutputChannel,
  status: vscode.StatusBarItem
): Promise<void> {
  await withProgress('Refreshing Test Inspector', status, async () => {
    await refreshProjects(state, adapters, output);
    await discoverAllTests(state, adapters, output);
    await readCoverage(state, adapters, output);
    await analyzeSetup(state, output);
    await refreshChangedFiles(state, output);
    await analyzeRisks(state, output);
    await analyzeFeatures(state, output);
  });
}

async function selectProjectFilter(state: InspectorState, projectId?: string): Promise<void> {
  if (projectId) {
    state.selectedProjectId = state.projects.some((project) => project.id === projectId) ? projectId : null;
    state.selectedFeatureId = null;
    return;
  }
  if (!state.projects.length) {
    void vscode.window.showInformationMessage('No detected projects yet. Run Refresh All first.');
    return;
  }
  const picked = await vscode.window.showQuickPick(
    [
      { label: 'All Projects', description: 'Show the full workspace', projectId: null as string | null },
      ...state.projects.map((project) => ({
        label: project.label,
        description: project.framework,
        detail: project.rootPath,
        projectId: project.id
      }))
    ],
    { placeHolder: 'Select project scope for Test Inspector dashboard' }
  );
  if (picked) {
    state.selectedProjectId = picked.projectId;
    state.selectedFeatureId = null;
  }
}

async function selectFeatureFilter(state: InspectorState, featureId?: string): Promise<void> {
  if (featureId) {
    const feature = state.featureAreas.find((area) => area.id === featureId);
    state.selectedFeatureId = feature?.id ?? null;
    if (feature) {
      state.selectedProjectId = feature.projectId;
    }
    return;
  }
  const features = state.featureAreas.filter((area) => !state.selectedProjectId || area.projectId === state.selectedProjectId);
  if (!features.length) {
    void vscode.window.showInformationMessage('No feature areas detected yet. Run Refresh All first.');
    return;
  }
  const picked = await vscode.window.showQuickPick(
    [
      { label: 'All Features', description: 'Show all feature areas in the current project scope', featureId: null as string | null },
      ...features.map((feature) => ({
        label: feature.label,
        description: `risk ${feature.riskScore} · ${feature.testFiles.length} tests`,
        detail: feature.rootPath,
        featureId: feature.id
      }))
    ],
    { placeHolder: 'Select feature scope for Test Inspector dashboard' }
  );
  if (picked) {
    state.selectedFeatureId = picked.featureId;
  }
}

async function refreshProjects(state: InspectorState, adapters: TestFrameworkAdapter[], output: vscode.OutputChannel): Promise<void> {
  const folders = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? [];
  output.appendLine(`[refresh] scanning ${folders.length} workspace folder(s)`);
  const projects = (await Promise.all(adapters.map((adapter) => adapter.detectProjects(folders)))).flat();
  state.setProjects(dedupeProjects(projects));
  output.appendLine(`[refresh] detected ${state.projects.length} project(s)`);
}

async function discoverAllTests(state: InspectorState, adapters: TestFrameworkAdapter[], output: vscode.OutputChannel): Promise<void> {
  for (const project of state.projects) {
    try {
      output.appendLine(`[discover] ${project.label}`);
      const adapter = adapterFor(project, adapters);
      const tests = await adapter.discoverTests(project);
      const findings = await adapter.analyzeQuality(project, tests);
      const testsWithFindings = tests.map((test) => ({
        ...test,
        qualityFindings: findings.filter((finding) => finding.filePath === test.path)
      }));
      state.setTests(project.id, testsWithFindings);
      output.appendLine(`[discover] ${project.label}: ${tests.length} file(s), ${findings.length} finding(s)`);
    } catch (error) {
      output.appendLine(`[discover] ${project.label}: ${formatError(error)}`);
    }
  }
}

async function readCoverage(state: InspectorState, adapters: TestFrameworkAdapter[], output: vscode.OutputChannel): Promise<void> {
  for (const project of state.projects) {
    try {
      const adapter = adapterFor(project, adapters);
      const coverage = await adapter.readCoverage(project);
      state.setCoverage(project.id, coverage);
      output.appendLine(`[coverage] ${project.label}: ${coverage ? `${coverage.files.length} file(s)` : 'not found'}`);
    } catch (error) {
      output.appendLine(`[coverage] ${project.label}: ${formatError(error)}`);
    }
  }
}

async function generateCoverage(state: InspectorState, adapters: TestFrameworkAdapter[], output: vscode.OutputChannel): Promise<void> {
  output.show(true);
  for (const project of state.projects) {
    if (!project.coverageCommand && (project.framework === 'react' || project.framework === 'firebase-functions')) {
      const discoveredTests = state.testFiles.filter((testFile) => testFile.projectId === project.id).length;
      output.appendLine(`[coverage] ${project.label}: skipped because no explicit coverage script was found`);
      state.addNotice({
        severity: 'warning',
        projectId: project.id,
        message: `${project.label} tests were found, but coverage is not configured.`,
        detail:
          discoveredTests > 0
            ? coverageSetupHint(project, discoveredTests)
            : 'Add a package.json coverage script or run coverage manually, then refresh.'
      });
      continue;
    }
    const approved = await vscode.window.showWarningMessage(
      `Generate coverage for ${project.label}? This can be slow on large repos.`,
      { modal: true },
      'Generate Coverage'
    );
    if (approved !== 'Generate Coverage') {
      output.appendLine(`[coverage] ${project.label}: cancelled by user`);
      continue;
    }
    output.appendLine(`[coverage] generating ${project.label}`);
    const result = await runCoverage(project, (line) => {
      if (line) {
        output.appendLine(line);
      }
    });
    if (result.exitCode !== 0) {
      output.appendLine(`[coverage] ${project.label}: command failed (${result.exitCode ?? 'not started'})`);
      state.addNotice({
        severity: 'warning',
        projectId: project.id,
        message: `Coverage failed for ${project.label}.`,
        detail: 'Open the Test Inspector output channel for the command error.'
      });
    }
    const adapter = adapterFor(project, adapters);
    const coverage = await adapter.readCoverage(project);
    state.setCoverage(project.id, coverage);
    output.appendLine(`[coverage] ${project.label}: ${coverage ? `${coverage.files.length} file(s)` : 'coverage file still not found'}`);
    if (!coverage) {
      state.addNotice({
        severity: 'warning',
        projectId: project.id,
        message: `${project.label} coverage file was not found after running coverage.`,
        detail: 'Confirm the project writes LCOV or coverage.py JSON/XML in a supported location.'
      });
    }
  }
}

function coverageSetupHint(project: TestProject, discoveredTests: number): string {
  const count = `${discoveredTests} test file${discoveredTests === 1 ? '' : 's'}`;
  if (project.framework === 'firebase-functions') {
    return `I found ${count}, but functions/package.json has no coverage script. Add "coverage": "jest --coverage --runInBand --watchman=false" and make sure dependencies are installed in functions.`;
  }
  return `I found ${count}, but package.json has no coverage, test:coverage, or test script with --coverage.`;
}

async function analyzeRisks(state: InspectorState, output: vscode.OutputChannel): Promise<void> {
  state.sourceRisks = await analyzeSourceRisks(state.projects, state.testFiles, state.coverage);
  output.appendLine(`[risk] ${state.sourceRisks.length} source file risk(s)`);
}

async function analyzeFeatures(state: InspectorState, output: vscode.OutputChannel): Promise<void> {
  state.featureAreas = await analyzeFeatureAreas(state.projects, state.testFiles, state.coverage, state.sourceRisks);
  output.appendLine(`[features] ${state.featureAreas.length} feature area(s)`);
}

async function analyzeSetup(state: InspectorState, output: vscode.OutputChannel): Promise<void> {
  state.setSetupIssues(await analyzeSetupIssues(state.projects, state.testFiles, state.coverage));
  output.appendLine(`[setup] ${state.setupIssues.length} setup issue(s)`);
}

async function analyzeTopRisk(
  state: InspectorState,
  output: vscode.OutputChannel,
  status: vscode.StatusBarItem,
  llmProvider: LlmProvider,
  view: InvestigationView
): Promise<void> {
  if (!state.sourceRisks.length) {
    await analyzeRisks(state, output);
  }
  const risk = state.sourceRisks[0];
  if (!risk) {
    void vscode.window.showInformationMessage('No source risks found. Run Test Inspector: Refresh All first.');
    return;
  }
  await analyzeRisk(state, output, status, llmProvider, view, risk.path);
}

async function analyzeCurrentFile(
  state: InspectorState,
  output: vscode.OutputChannel,
  status: vscode.StatusBarItem,
  llmProvider: LlmProvider,
  view: InvestigationView
): Promise<void> {
  const filePath = vscode.window.activeTextEditor?.document.uri.fsPath;
  if (!filePath) {
    void vscode.window.showWarningMessage('Open a source file first.');
    return;
  }
  await analyzeRisk(state, output, status, llmProvider, view, filePath);
}

async function analyzeFilePath(
  state: InspectorState,
  output: vscode.OutputChannel,
  status: vscode.StatusBarItem,
  llmProvider: LlmProvider,
  view: InvestigationView,
  filePath?: string
): Promise<void> {
  if (!filePath) {
    await analyzeTopRisk(state, output, status, llmProvider, view);
    return;
  }
  await analyzeRisk(state, output, status, llmProvider, view, filePath);
}

async function analyzeRisk(
  state: InspectorState,
  output: vscode.OutputChannel,
  status: vscode.StatusBarItem,
  llmProvider: LlmProvider,
  view: InvestigationView,
  filePath: string
): Promise<void> {
  if (!state.sourceRisks.length) {
    await analyzeRisks(state, output);
    await analyzeFeatures(state, output);
  }
  const risk = findRiskForFile(filePath, state.sourceRisks) ?? (await buildOnDemandRisk(filePath, state, output));
  if (!risk) {
    void vscode.window.showInformationMessage('Could not analyze this file. Open a source file inside a detected Test Inspector project.');
    return;
  }
  const project = state.projects.find((candidate) => candidate.id === risk.projectId);
  if (!project) {
    void vscode.window.showWarningMessage('Could not find the project for this risk.');
    return;
  }

  const provider = await chooseLlmProvider(llmProvider);
  output.appendLine(`[investigate] ${risk.path}`);
  const report = await withProgress(`Investigating ${path.basename(risk.path)}`, status, () =>
    investigateSourceRisk(risk, project, state.testFiles, provider)
  );
  state.latestInvestigation = report;
  view.show(report);
}

async function buildOnDemandRisk(filePath: string, state: InspectorState, output: vscode.OutputChannel) {
  const project = owningProject(filePath, state.projects);
  if (!project) {
    return null;
  }
  const risks = await analyzeSourceRisks([project], state.testFiles.filter((test) => test.projectId === project.id), state.coverage);
  const risk = findRiskForFile(filePath, risks);
  if (!risk) {
    return null;
  }
  state.sourceRisks = [risk, ...state.sourceRisks.filter((item) => item.path !== risk.path)].sort((a, b) => b.score - a.score);
  state.featureAreas = await analyzeFeatureAreas(state.projects, state.testFiles, state.coverage, state.sourceRisks);
  output.appendLine(`[risk] built on-demand risk for ${filePath}`);
  return risk;
}

async function openFile(filePath?: string): Promise<void> {
  if (!filePath) {
    return;
  }
  const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
  await vscode.window.showTextDocument(document, { preview: false });
}

async function exportInvestigation(state: InspectorState, output: vscode.OutputChannel): Promise<void> {
  if (!state.latestInvestigation) {
    void vscode.window.showInformationMessage('No investigation report exists yet. Run Analyze Top Risk first.');
    return;
  }
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) {
    return;
  }
  const safeName = path.basename(state.latestInvestigation.sourcePath).replace(/[^A-Za-z0-9_.-]/g, '-');
  const reportPath = path.join(root, `test-inspector-investigation-${safeName}.md`);
  await fs.writeFile(reportPath, renderInvestigationMarkdown(state.latestInvestigation), 'utf8');
  output.appendLine(`[investigate] wrote ${reportPath}`);
  const doc = await vscode.workspace.openTextDocument(reportPath);
  await vscode.window.showTextDocument(doc, { preview: false });
}

async function runFeatureTests(state: InspectorState, output: vscode.OutputChannel, featureId?: string): Promise<void> {
  let feature = featureId
    ? state.featureAreas.find((area) => area.id === featureId)
    : state.selectedFeatureId
      ? state.featureAreas.find((area) => area.id === state.selectedFeatureId)
      : undefined;
  if (!feature) {
    const picked = await vscode.window.showQuickPick(
      state.featureAreas.map((area) => ({
        label: area.label,
        description: `risk ${area.riskScore} · ${area.testFiles.length} tests · ${area.sourceFiles.length} source files`,
        detail: area.recommendedCommand,
        area
      })),
      { placeHolder: 'Select a feature area to test' }
    );
    feature = picked?.area;
  }
  if (!feature?.recommendedCommand) {
    void vscode.window.showInformationMessage('No targeted test command found for this feature.');
    return;
  }
  const project = state.projects.find((candidate) => candidate.id === feature.projectId);
  output.appendLine(`[feature] ${feature.label}: ${feature.recommendedCommand}`);
  const action = await vscode.window.showInformationMessage(`Targeted test command for ${feature.label}`, 'Run In Terminal', 'Show Output Only');
  if (action === 'Run In Terminal') {
    const terminal = vscode.window.createTerminal('Test Inspector Feature Tests');
    terminal.show();
    terminal.sendText(`cd ${JSON.stringify(project?.rootPath ?? feature.rootPath)}`);
    terminal.sendText(feature.recommendedCommand);
  } else {
    output.show(true);
  }
}

async function analyzeFeature(
  state: InspectorState,
  output: vscode.OutputChannel,
  status: vscode.StatusBarItem,
  llmProvider: LlmProvider,
  view: FeatureInvestigationView,
  featureId?: string
): Promise<void> {
  let feature = featureId
    ? state.featureAreas.find((area) => area.id === featureId)
    : state.selectedFeatureId
      ? state.featureAreas.find((area) => area.id === state.selectedFeatureId)
      : undefined;
  if (!feature) {
    const picked = await vscode.window.showQuickPick(
      state.featureAreas.map((area) => ({
        label: area.label,
        description: `${state.projects.find((project) => project.id === area.projectId)?.framework ?? 'project'} · risk ${area.riskScore}`,
        detail: area.rootPath,
        area
      })),
      { placeHolder: 'Select a feature area to analyze' }
    );
    feature = picked?.area;
  }
  if (!feature) {
    return;
  }
  const project = state.projects.find((candidate) => candidate.id === feature.projectId);
  if (!project) {
    void vscode.window.showWarningMessage('Could not find project for this feature.');
    return;
  }
  const provider = await chooseLlmProvider(llmProvider);
  output.appendLine(`[feature] investigating ${feature.label}`);
  const report = await withProgress(`Investigating feature ${feature.label}`, status, () =>
    investigateFeatureArea(feature, project, state.sourceRisks, state.testFiles, provider)
  );
  state.latestFeatureInvestigation = report;
  view.show(report);
}

async function exportFeatureInvestigation(state: InspectorState, output: vscode.OutputChannel): Promise<void> {
  if (!state.latestFeatureInvestigation) {
    void vscode.window.showInformationMessage('No feature investigation report exists yet. Run Analyze Feature first.');
    return;
  }
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) {
    return;
  }
  const safeName = state.latestFeatureInvestigation.feature.label.replace(/[^A-Za-z0-9_.-]/g, '-');
  const reportPath = path.join(root, `test-inspector-feature-${safeName}.md`);
  await fs.writeFile(reportPath, renderFeatureInvestigationMarkdown(state.latestFeatureInvestigation), 'utf8');
  output.appendLine(`[feature] wrote ${reportPath}`);
  const doc = await vscode.workspace.openTextDocument(reportPath);
  await vscode.window.showTextDocument(doc, { preview: false });
}

async function chooseLlmProvider(provider: LlmProvider): Promise<LlmProvider> {
  if (!(await provider.isConfigured())) {
    return disabledLlmProvider();
  }
  const choice = await vscode.window.showWarningMessage(
    'Run semantic investigation with the configured LLM? This sends the selected source file and related tests to your configured provider.',
    { modal: true },
    'Use LLM',
    'Deterministic Only'
  );
  return choice === 'Use LLM' ? provider : disabledLlmProvider();
}

function disabledLlmProvider(): LlmProvider {
  return {
    id: 'disabled',
    async isConfigured() {
      return false;
    },
    async complete() {
      return '';
    }
  };
}

async function configureLlm(context: vscode.ExtensionContext, output: vscode.OutputChannel): Promise<void> {
  const baseUrl = await vscode.window.showInputBox({
    title: 'Test Inspector LLM Base URL',
    prompt: 'OpenAI-compatible chat completions base URL',
    value: vscode.workspace.getConfiguration('testInspector.llm').get<string>('baseUrl') ?? 'https://api.openai.com/v1'
  });
  if (!baseUrl) {
    return;
  }
  const model = await vscode.window.showInputBox({
    title: 'Test Inspector LLM Model',
    prompt: 'Model for semantic investigation',
    value: vscode.workspace.getConfiguration('testInspector.llm').get<string>('model') ?? 'gpt-4.1-mini'
  });
  if (!model) {
    return;
  }
  const apiKey = await vscode.window.showInputBox({
    title: 'Test Inspector LLM API Key',
    prompt: 'Stored securely in VS Code SecretStorage',
    password: true,
    ignoreFocusOut: true
  });
  if (!apiKey) {
    return;
  }

  await vscode.workspace.getConfiguration('testInspector.llm').update('baseUrl', baseUrl, vscode.ConfigurationTarget.Workspace);
  await vscode.workspace.getConfiguration('testInspector.llm').update('model', model, vscode.ConfigurationTarget.Workspace);
  await context.secrets.store(secretKey(), apiKey);
  output.appendLine(`[llm] configured ${baseUrl} ${model}`);
  void vscode.window.showInformationMessage('Test Inspector LLM configured for this VS Code profile/workspace.');
}

async function refreshChangedFiles(state: InspectorState, output: vscode.OutputChannel): Promise<void> {
  const folders = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? [];
  const changed = (await Promise.all(folders.map((folder) => getChangedFiles(folder)))).flat();
  state.changedFiles = buildChangedFileRisks(
    changed,
    state.projects,
    state.testFiles,
    state.coverage,
    state.testFiles.flatMap((testFile) => testFile.qualityFindings)
  );
  output.appendLine(`[risk] ${state.changedFiles.length} changed source file(s)`);
}

async function runForProject(
  state: InspectorState,
  adapters: TestFrameworkAdapter[],
  output: vscode.OutputChannel,
  status: vscode.StatusBarItem,
  requestedProject?: TestProject
): Promise<void> {
  const project = requestedProject ?? (await pickProject(state.projects));
  if (!project) {
    return;
  }
  const approved = await vscode.window.showWarningMessage(`Run all tests for ${project.label}? This can be slow on large repos.`, { modal: true }, 'Run Tests');
  if (approved !== 'Run Tests') {
    output.appendLine(`[run] ${project.label}: cancelled by user`);
    return;
  }
  const adapter = adapterFor(project, adapters);
  output.show(true);
  output.appendLine(`[run] ${project.label}`);
  const result = await withProgress(`Running ${project.label}`, status, () => adapter.runAll(project));
  appendRunOutput(output, result.command, result.stdout, result.stderr);
  if (result.testFiles.length) {
    state.setTests(project.id, result.testFiles);
  }
  showRunResult(result.command, result.exitCode);
}

async function runCurrentFile(
  state: InspectorState,
  adapters: TestFrameworkAdapter[],
  output: vscode.OutputChannel,
  status: vscode.StatusBarItem,
  node?: { testFile?: { path: string; projectId: string } }
): Promise<void> {
  const filePath = node?.testFile?.path ?? vscode.window.activeTextEditor?.document.uri.fsPath;
  if (!filePath) {
    void vscode.window.showWarningMessage('Open a test file first.');
    return;
  }
  const project = state.projects.find((candidate) => candidate.id === node?.testFile?.projectId) ?? owningProject(filePath, state.projects);
  if (!project) {
    void vscode.window.showWarningMessage('No Test Inspector project owns the current file.');
    return;
  }
  const adapter = adapterFor(project, adapters);
  output.show(true);
  output.appendLine(`[run] ${filePath}`);
  const result = await withProgress(`Running ${path.basename(filePath)}`, status, () => adapter.runFile(project, filePath));
  appendRunOutput(output, result.command, result.stdout, result.stderr);
  if (result.testFiles.length) {
    state.setTests(project.id, result.testFiles);
  }
  showRunResult(result.command, result.exitCode);
}

async function runRelatedForActiveFile(
  state: InspectorState,
  adapters: TestFrameworkAdapter[],
  output: vscode.OutputChannel,
  status: vscode.StatusBarItem
): Promise<void> {
  const filePath = vscode.window.activeTextEditor?.document.uri.fsPath;
  if (!filePath) {
    void vscode.window.showWarningMessage('Open a source file first.');
    return;
  }
  const project = owningProject(filePath, state.projects);
  if (!project) {
    void vscode.window.showWarningMessage('No Test Inspector project owns the current file.');
    return;
  }
  const adapter = adapterFor(project, adapters);
  output.show(true);
  output.appendLine(`[run-related] ${filePath}`);
  const result = await withProgress(`Running related tests for ${path.basename(filePath)}`, status, () => adapter.runRelated(project, filePath));
  if (!result) {
    void vscode.window.showInformationMessage(`Related-test execution is not available for ${project.framework}.`);
    return;
  }
  appendRunOutput(output, result.command, result.stdout, result.stderr);
  if (result.testFiles.length) {
    state.setTests(project.id, result.testFiles);
  }
  showRunResult(result.command, result.exitCode);
}

async function exportReport(state: InspectorState, output: vscode.OutputChannel): Promise<void> {
  await refreshChangedFiles(state, output);
  const report = buildReport(state.projects, state.testFiles, state.coverage, state.changedFiles);
  const markdown = renderMarkdownReport(report);
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) {
    return;
  }
  const reportPath = path.join(root, 'test-inspector-report.md');
  await fs.writeFile(reportPath, markdown, 'utf8');
  const doc = await vscode.workspace.openTextDocument(reportPath);
  await vscode.window.showTextDocument(doc, { preview: false });
  output.appendLine(`[report] wrote ${reportPath}`);
}

function adapterFor(project: TestProject, adapters: TestFrameworkAdapter[]): TestFrameworkAdapter {
  const adapter = adapters.find((candidate) => candidate.id === project.framework);
  if (!adapter) {
    throw new Error(`No adapter registered for ${project.framework}`);
  }
  return adapter;
}

async function pickProject(projects: TestProject[]): Promise<TestProject | undefined> {
  if (projects.length === 1) {
    return projects[0];
  }
  const picked = await vscode.window.showQuickPick(
    projects.map((project) => ({ label: project.label, description: project.framework, project })),
    { placeHolder: 'Select a test project' }
  );
  return picked?.project;
}

function owningProject(filePath: string, projects: TestProject[]): TestProject | undefined {
  return projects.filter((project) => filePath.startsWith(project.rootPath)).sort((a, b) => b.rootPath.length - a.rootPath.length)[0];
}

function showRunResult(command: string, exitCode: number | null): void {
  const status = exitCode === 0 ? 'passed' : exitCode === null ? 'could not start' : `exited ${exitCode}`;
  const message = `Test Inspector: ${command} ${status}.`;
  if (exitCode === 0) {
    void vscode.window.showInformationMessage(message);
  } else {
    void vscode.window.showWarningMessage(message);
  }
}

function dedupeProjects(projects: TestProject[]): TestProject[] {
  const unique = [...new Map(projects.map((project) => [project.id, project])).values()];
  return unique.sort((a, b) => a.rootPath.localeCompare(b.rootPath) || a.framework.localeCompare(b.framework));
}

function withProgress<T>(title: string, status: vscode.StatusBarItem, task: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  const interval = setInterval(() => {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    status.text = `$(sync~spin) ${title} ${seconds}s`;
  }, 1000);
  status.text = `$(sync~spin) ${title}`;
  return Promise.resolve(
    vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title, cancellable: false }, async () => {
      try {
        return await task();
      } finally {
        clearInterval(interval);
        status.text = '$(beaker) Test Inspector';
      }
    })
  );
}

async function runSafely(output: vscode.OutputChannel, task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (error) {
    const message = formatError(error);
    output.appendLine(`[error] ${message}`);
    output.show(true);
    void vscode.window.showErrorMessage(`Test Inspector failed: ${message}`);
  }
}

function appendRunOutput(output: vscode.OutputChannel, command: string, stdout: string, stderr: string): void {
  output.appendLine(`$ ${command}`);
  if (stdout.trim()) {
    output.appendLine(stdout.trim());
  }
  if (stderr.trim()) {
    output.appendLine(stderr.trim());
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
