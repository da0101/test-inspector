import * as path from 'node:path';
import type { SourceFileRisk } from '../models';

export type TestGapSeverity = 'critical' | 'important' | 'useful';

export type TestGap = {
  title: string;
  severity: TestGapSeverity;
  reason: string;
  evidence: string[];
  suggestedTest: string;
};

export function inferTestGaps(risk: SourceFileRisk): TestGap[] {
  const gaps: TestGap[] = [];
  const fileName = path.basename(risk.path);
  const noTests = risk.relatedTests.length === 0;
  const linesPct = risk.coverage?.linesPct;
  const branchesPct = risk.coverage?.branchesPct;
  const functionsPct = risk.coverage?.functionsPct;
  const nearZero = linesPct !== undefined && linesPct < 5;
  const lowLines = linesPct !== undefined && linesPct < 50;
  const signals = new Set(risk.signals);
  const baseEvidence = buildBaseEvidence(risk);

  if (noTests || nearZero) {
    gaps.push({
      title: `${fileName}: core behavior is effectively untested`,
      severity: 'critical',
      reason: noTests
        ? 'No related test file was found for critical source code.'
        : 'A related test may exist, but coverage shows it barely reaches this source file.',
      evidence: baseEvidence,
      suggestedTest: 'Add one happy-path test that imports this source and asserts the user-visible result, then one failure-path test.',
    });
  }

  if ((signals.has('async/error handling') || signals.has('API/data flow')) && (noTests || lowLines || (branchesPct ?? 100) < 80)) {
    gaps.push({
      title: `${fileName}: failure path needs a test`,
      severity: noTests || nearZero ? 'critical' : 'important',
      reason: 'Async/API code usually has success and failure outcomes; the current evidence does not show enough branch coverage for the failure side.',
      evidence: [...baseEvidence, ...coverageEvidence('branches', branchesPct)],
      suggestedTest: suggestedTestFor(risk, 'failure'),
    });
  }

  if ((signals.has('form/validation logic') || signals.has('permission logic') || signals.has('auth/session logic')) && (noTests || lowLines || (branchesPct ?? 100) < 80)) {
    gaps.push({
      title: `${fileName}: guard/validation cases are missing`,
      severity: noTests || nearZero ? 'critical' : 'important',
      reason: 'Guard code is where invalid input, permissions, and auth state are accepted or rejected.',
      evidence: [...baseEvidence, ...coverageEvidence('branches', branchesPct)],
      suggestedTest: suggestedTestFor(risk, 'guard'),
    });
  }

  if (signals.has('branching behavior') && (branchesPct === undefined || branchesPct < 80)) {
    gaps.push({
      title: `${fileName}: alternate branches are not proven`,
      severity: branchesPct !== undefined && branchesPct < 50 ? 'important' : 'useful',
      reason: 'The source contains decision paths, but branch coverage says not enough of those choices ran during tests.',
      evidence: [...baseEvidence, ...coverageEvidence('branches', branchesPct)],
      suggestedTest: suggestedTestFor(risk, 'branch'),
    });
  }

  if (functionsPct !== undefined && functionsPct < 80 && !noTests) {
    gaps.push({
      title: `${fileName}: exported functions are not all reached`,
      severity: functionsPct < 50 ? 'important' : 'useful',
      reason: 'Some functions in this file did not run during the latest coverage pass.',
      evidence: [...baseEvidence, ...coverageEvidence('functions', functionsPct)],
      suggestedTest: suggestedTestFor(risk, 'function'),
    });
  }

  return dedupeByTitle(gaps).slice(0, 4);
}

function suggestedTestFor(risk: SourceFileRisk, kind: 'failure' | 'guard' | 'branch' | 'function'): string {
  const rel = risk.path.split(path.sep).join('/').toLowerCase();
  if (rel.includes('/services/llm/http.')) {
    if (kind === 'failure') return 'Use a local HTTP server to return non-2xx, timeout, and aborted requests; assert the helper rejects or returns the exact status/body.';
    if (kind === 'branch') return 'Cover HTTPS, localhost HTTP, rejected remote HTTP, POST body length, timeout, and abort-signal branches.';
    return 'Add focused tests around request construction, response collection, timeout handling, and abort handling.';
  }
  if (/\/services\/llm\/(openai|claude|gemini)\./.test(rel)) {
    if (kind === 'failure') return 'Mock the provider HTTP response for non-2xx status, malformed JSON, and missing response fields; assert a deterministic error is returned.';
    if (kind === 'guard') return 'Test missing API key/model configuration and ensure no request is sent when configuration is incomplete.';
    if (kind === 'branch') return 'Cover valid response, provider error response, malformed payload, and empty-candidate/content branches.';
    return 'Add tests for every exported provider method: completion, connection test, and configuration checks.';
  }
  if (rel.endsWith('/services/aireviewcontroller.ts')) {
    if (kind === 'failure') return 'Mock provider enrichment failure and unreadable target/related files; assert the AI review returns an error card without changing the deterministic verdict.';
    if (kind === 'guard') return 'Test no provider, unconfigured provider, and user-cancelled confirmation paths.';
    if (kind === 'branch') return 'Cover accepted review, challenged review, provider error, cancelled send, and related-file fallback branches.';
    return 'Add focused tests for configure flow actions and AI review creation paths.';
  }
  if (rel.endsWith('/services/llm/enrich.ts')) {
    if (kind === 'failure') return 'Feed invalid JSON, truncated JSON, fabricated anchors, and provider errors; assert deterministic fallback/error output and dropped-anchor counts.';
    if (kind === 'guard') return 'Test missing explanation, non-object responses, out-of-range line numbers, empty excerpts, and uncertain responses.';
    if (kind === 'branch') return 'Cover direct JSON parse, fenced JSON, prose-wrapped JSON, tolerant truncated explanation extraction, and rejected malformed output.';
    return 'Add focused tests for prompt building, response validation, anchor verification, and provider failure handling.';
  }
  if (rel.endsWith('/extension.ts')) {
    if (kind === 'failure') return 'Mock VS Code flows for untrusted workspace, missing workspace folders, missing coverage plan, failed coverage run, and current-file run failures.';
    if (kind === 'guard') return 'Test activation command guards for untrusted workspaces, no active editor, and files outside detected projects.';
    if (kind === 'branch') return 'Cover command registration branches for scan, coverage, current-file run, report generation, and target publishing.';
    return 'Add activation-level tests that exercise each exported command callback through the mocked VS Code API.';
  }
  if (rel.endsWith('/services/reportcontroller.ts')) {
    if (kind === 'failure') return 'Mock report write and AI review failures; assert deterministic reports still preserve local findings and surface AI errors separately.';
    if (kind === 'guard') return 'Test empty bundles, invalid selected groups, missing workspace root, and unconfigured AI reviewer paths.';
    if (kind === 'branch') return 'Cover deterministic export, AI export, save cancellation, write failure, and partial AI review error branches.';
    return 'Add focused tests for report selection, default report path, Markdown writing, and AI error collection.';
  }
  if (rel.endsWith('/services/targetcontroller.ts')) {
    if (kind === 'failure') return 'Mock catalog refresh/add failures and assert the target tree still publishes a safe empty/error state.';
    if (kind === 'guard') return 'Test untrusted workspace refusal, no selected target, invalid feature query, and missing repo/worktree candidates.';
    if (kind === 'branch') return 'Cover tracked repo add/remove, worktree selection, feature scope changes, raw-bundle filtering, and publish callbacks.';
    return 'Add focused tests for each public target-controller action exposed through the sidebar tree.';
  }
  if (rel.endsWith('/services/workspacecatalog.ts')) {
    if (kind === 'failure') return 'Mock Git failures for repo-root lookup, worktree list, and branch lookup; assert invalid repos are skipped with diagnostics where available.';
    if (kind === 'branch') return 'Cover tracked/workspace/Agentboard candidate precedence, duplicate repo paths, detached worktrees, malformed porcelain blocks, and fallback current-branch worktree.';
    return 'Add focused tests for catalog candidate dedupe, Agentboard expansion, and Git worktree fallback behavior.';
  }
  if (rel.endsWith('/services/runner.ts')) {
    if (kind === 'failure') return 'Mock spawned commands that exit non-zero, emit stderr, fail to spawn, and time out; assert exitCode/stdout/stderr are captured without shell execution.';
    if (kind === 'branch') return 'Cover Node, Python, Flutter, Django, FastAPI, explicit npm coverage command, no coverage command, and parse-error branches.';
    return 'Add focused tests for command construction, relative test-file args, output parsing fallback, timeout handling, and result merging.';
  }
  if (rel.endsWith('/utils/fs.ts')) {
    if (kind === 'failure') return 'Create temporary unreadable/missing paths and invalid JSON files; assert helpers return null/false or propagate JSON parse errors intentionally.';
    if (kind === 'branch') return 'Cover directory walking with excludes, include filters, max-file limit, read failures, and find-up stop-boundary behavior.';
    return 'Add focused filesystem tests using temporary directories for walkFiles, pathExists, readTextIfExists, readJsonIfExists, and findUp.';
  }
  if (/\/views\/.+\/panel\.ts$/.test(rel)) {
    if (kind === 'failure') return 'Mock webview messages that throw or cancel async work; assert the panel posts safe error/progress state and keeps the webview alive.';
    if (kind === 'branch') return 'Cover supported message commands, unknown messages, initial render, dispose/recreate, and progress callback branches.';
    return 'Add focused tests for panel message routing and webview update state.';
  }

  if (kind === 'failure') return 'Simulate a rejected dependency or failed response and assert the controlled error, cleanup, and no partial write/state.';
  if (kind === 'guard') return 'Add negative-path tests for invalid input, missing permission/session, and the expected blocked outcome.';
  if (kind === 'branch') return 'Add table-driven cases for each meaningful if/switch outcome, including the default or fallback path.';
  return 'Add focused tests for the unreached function behavior, starting with public exports and error-returning helpers.';
}

function buildBaseEvidence(risk: SourceFileRisk): string[] {
  const evidence: string[] = [];
  if (risk.relatedTests.length === 0) evidence.push('no related tests found');
  if (risk.coverage?.linesPct !== undefined) evidence.push(`${risk.coverage.linesPct}% line coverage`);
  if (risk.signals.length > 0) evidence.push(`risk signals: ${risk.signals.slice(0, 3).join(', ')}`);
  return evidence;
}

function coverageEvidence(label: string, pct: number | undefined): string[] {
  return pct === undefined ? [`${label} coverage unavailable`] : [`${pct}% ${label} coverage`];
}

function dedupeByTitle(gaps: TestGap[]): TestGap[] {
  const seen = new Set<string>();
  return gaps.filter((gap) => {
    if (seen.has(gap.title)) return false;
    seen.add(gap.title);
    return true;
  });
}
