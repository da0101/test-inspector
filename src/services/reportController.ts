import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import type { CaseFile, CaseFileAiReview, CaseFileBundle, CaseVerdict } from './caseFile';
import { activeProvider, enrichCase, type LlmProvider, type LlmProviderId } from './llm';
import { exportCaseFileAsMarkdown, type CaseFileReportMode } from './exportMarkdown';

type Registry = Map<LlmProviderId, LlmProvider>;

const VERDICTS: CaseVerdict[] = ['THEATER', 'WEAK', 'MISSING', 'STRONG'];

const VERDICT_LABEL: Record<CaseVerdict, string> = {
  THEATER: 'Theater',
  WEAK: 'Weak',
  MISSING: 'Missing',
  STRONG: 'Strong',
  OK: 'OK'
};

export async function generateCaseFileReport(opts: {
  bundle: CaseFileBundle;
  workspaceRoot?: string;
  registry: Registry;
  output: vscode.OutputChannel;
}): Promise<void> {
  if (opts.bundle.cases.length === 0) {
    void vscode.window.showInformationMessage('Test Inspector: nothing to report yet - scan first.');
    return;
  }

  const mode = await pickReportMode();
  if (!mode) return;

  const verdicts = await pickVerdicts(opts.bundle);
  if (!verdicts) return;

  await generateCaseFileReportForSelection({ ...opts, mode, verdicts });
}

export async function generateCaseFileReportForSelection(opts: {
  bundle: CaseFileBundle;
  workspaceRoot?: string;
  registry: Registry;
  output: vscode.OutputChannel;
  mode: CaseFileReportMode;
  verdicts: CaseVerdict[];
  onProgress?: (message: string) => void;
}): Promise<boolean> {
  if (opts.bundle.cases.length === 0) {
    throw new Error('Scan a target before generating a report.');
  }
  if (opts.verdicts.length === 0) {
    throw new Error('Choose at least one report group.');
  }

  let reportBundle = cloneForReport(opts.bundle, opts.verdicts);
  const aiErrors: string[] = [];
  if (opts.mode === 'ai') {
    const provider = activeProvider(opts.registry);
    if (!provider) {
      throw new Error('Configure an AI reviewer before generating an AI optimized report.');
    }
    if (!(await provider.isConfigured())) {
      throw new Error(`${provider.displayName} is selected, but no API key is stored.`);
    }
    reportBundle = await enrichReportBundle(reportBundle, provider, opts.output, aiErrors, opts.onProgress);
  }

  const targetUri = await vscode.window.showSaveDialog({
    defaultUri: defaultReportUri(opts.workspaceRoot, opts.mode),
    filters: { Markdown: ['md'] }
  });
  if (!targetUri) return false;

  const markdown = exportCaseFileAsMarkdown(reportBundle, { mode: opts.mode, verdicts: opts.verdicts, aiErrors });
  await vscode.workspace.fs.writeFile(targetUri, Buffer.from(markdown, 'utf8'));
  void vscode.window.showInformationMessage(`Test Inspector: report exported to ${vscode.workspace.asRelativePath(targetUri)}`);
  return true;
}

async function pickReportMode(): Promise<CaseFileReportMode | undefined> {
  const picked = await vscode.window.showQuickPick(
    [
      {
        label: 'Deterministic report',
        description: 'offline',
        detail: 'Scores, findings, tests, coverage, and suggestions from local analysis only.',
        mode: 'deterministic' as const
      },
      {
        label: 'AI optimized report',
        description: 'uses configured reviewer',
        detail: 'Keeps deterministic scores, then adds evidence-grounded AI explanations and suggested fixes.',
        mode: 'ai' as const
      }
    ],
    { placeHolder: 'Choose report mode' }
  );
  return picked?.mode;
}

async function pickVerdicts(bundle: CaseFileBundle): Promise<CaseVerdict[] | undefined> {
  const items = VERDICTS.map((verdict) => ({
    label: VERDICT_LABEL[verdict],
    description: `${bundle.totals[verdict] ?? 0} case(s)`,
    picked: verdict === 'THEATER' || verdict === 'WEAK' || verdict === 'MISSING',
    verdict
  })).filter((item) => (bundle.totals[item.verdict] ?? 0) > 0);

  const picked = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: 'Choose report groups. Leave default, select one, or combine groups like Theater + Missing.'
  });
  if (!picked) return undefined;
  return picked.map((item) => item.verdict);
}

function cloneForReport(bundle: CaseFileBundle, verdicts: CaseVerdict[]): CaseFileBundle {
  const allowed = new Set(verdicts);
  return {
    ...bundle,
    cases: bundle.cases.filter((item) => allowed.has(item.verdict)).map((item) => ({ ...item }))
  };
}

async function enrichReportBundle(
  bundle: CaseFileBundle,
  provider: LlmProvider,
  output: vscode.OutputChannel,
  errors: string[],
  onProgress?: (message: string) => void
): Promise<CaseFileBundle> {
  for (let index = 0; index < bundle.cases.length; index++) {
    const item = bundle.cases[index]!;
    onProgress?.(`${index + 1}/${bundle.cases.length} ${path.basename(item.target.path)}`);
    item.aiReview = await reviewCase(item, bundle, provider, output, errors);
  }
  return bundle;
}

async function reviewCase(
  caseFile: CaseFile,
  bundle: CaseFileBundle,
  provider: LlmProvider,
  output: vscode.OutputChannel,
  errors: string[]
): Promise<CaseFileAiReview> {
  try {
    const fileContent = await fs.readFile(caseFile.target.path, 'utf8');
    const result = await enrichCase(provider, {
      caseFile,
      fileContent,
      relatedContent: await readRelatedContent(caseFile, bundle)
    });
    if (!result.ok) {
      errors.push(`${path.basename(caseFile.target.path)}: ${result.error}`);
      return { status: 'error', provider: provider.displayName, reviewedAt: Date.now(), error: result.error };
    }
    output.appendLine(`[report] AI reviewed ${caseFile.target.path}`);
    return {
      status: result.explanation.verdictAlignsWithEvidence ? 'accepted' : 'challenged',
      provider: result.provider,
      model: result.model,
      reviewedAt: Date.now(),
      explanation: result.explanation.explanation,
      evidenceAnchors: result.explanation.evidenceAnchors,
      suggestedFix: result.explanation.suggestedFix,
      uncertaintyNotes: result.explanation.uncertaintyNotes,
      droppedAnchors: result.droppedAnchors
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`${path.basename(caseFile.target.path)}: ${message}`);
    return { status: 'error', provider: provider.displayName, reviewedAt: Date.now(), error: message };
  }
}

async function readRelatedContent(caseFile: CaseFile, bundle: CaseFileBundle): Promise<{ path: string; content: string }[]> {
  const paths = new Set(caseFile.evidence.relatedTests.slice(0, 3).map((related) => related.path));
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
      // Related context is useful but the report can proceed without it.
    }
  }
  return relatedContent;
}

function defaultReportUri(workspaceRoot: string | undefined, mode: CaseFileReportMode): vscode.Uri | undefined {
  if (!workspaceRoot) return undefined;
  const suffix = mode === 'ai' ? 'ai-report' : 'deterministic-report';
  return vscode.Uri.file(path.join(workspaceRoot, `test-inspector-${suffix}.md`));
}
