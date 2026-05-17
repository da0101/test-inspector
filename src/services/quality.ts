import * as path from 'path';
import { promises as fs } from 'fs';
import { QualityFinding, TestFile, TestProject } from '../models';
import { relativePath } from '../utils/path';
import { discoverJsTestCalls, hasJsAssertion, hasLocalJsImport, maskJsCode } from './jsStatic';
import { findFlutterSmells } from './qualityFlutter';

type Pattern = {
  kind: QualityFinding['kind'];
  severity: QualityFinding['severity'];
  regex: RegExp;
  message: string;
};

const JS_PATTERNS: Pattern[] = [
  { kind: 'focused-test', severity: 'error', regex: /\b(?:describe|it|test)\.only\s*\(/, message: 'Focused test committed.' },
  { kind: 'focused-test', severity: 'error', regex: /\bfit\s*\(/, message: 'Focused test committed.' },
  { kind: 'skipped-test', severity: 'warning', regex: /\b(?:describe|it|test)\.skip\s*\(/, message: 'Skipped test found.' },
  { kind: 'skipped-test', severity: 'warning', regex: /\b(?:xit|xtest)\s*\(/, message: 'Skipped test found.' }
];

const PY_PATTERNS: Pattern[] = [
  { kind: 'skipped-test', severity: 'warning', regex: /@pytest\.mark\.skip|@unittest\.skip/, message: 'Skipped test found.' }
];

const DART_PATTERNS: Pattern[] = [
  { kind: 'skipped-test', severity: 'warning', regex: /\bskip\s*:\s*(?:true|['"`])/, message: 'Skipped test found.' }
];

export async function analyzeQuality(project: TestProject, tests: TestFile[]): Promise<QualityFinding[]> {
  const findings: QualityFinding[] = [];
  for (const test of tests) {
    const text = await fs.readFile(test.path, 'utf8').catch(() => null);
    if (!text) {
      findings.push(finding(project, 'parse-error', 'warning', test.path, 'Could not read test file.'));
      continue;
    }
    const isJs = project.framework === 'node' || project.framework === 'react' || project.framework === 'firebase-functions';
    const analysisText = isJs ? maskJsCode(text) : text;
    const patterns = project.framework === 'flutter' ? DART_PATTERNS : project.framework === 'django' || project.framework === 'fastapi' ? PY_PATTERNS : JS_PATTERNS;
    findings.push(...findPatterns(project, test.path, analysisText, patterns));
    findings.push(...findWeakAssertions(project, test.path, text));
    findings.push(...findTestSmells(project, test.path, text));
  }
  return findings;
}

export function discoverTestCases(project: TestProject, filePath: string, text: string) {
  if (project.framework === 'flutter') {
    return discoverByRegex(filePath, text, /\btestWidgets?\s*\(\s*['"`]([^'"`]+)['"`]/g);
  }
  if (project.framework === 'django' || project.framework === 'fastapi') {
    return discoverByRegex(filePath, text, /^\s*def\s+(test_[\w_]+)\s*\(/gm);
  }
  if (project.framework === 'node' || project.framework === 'react' || project.framework === 'firebase-functions') {
    return discoverJsTestCalls(text).map((item) => ({
      id: `${filePath}:${item.index}`,
      name: item.name,
      filePath,
      line: lineOf(text, item.index),
      status: 'unknown' as const
    }));
  }
  return discoverByRegex(filePath, text, /\b(?:it|test)\s*(?:\.\w+)?\s*\(\s*['"`]([^'"`]+)['"`]/g);
}

function discoverByRegex(filePath: string, text: string, regex: RegExp) {
  const cases = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    cases.push({
      id: `${filePath}:${match.index}`,
      name: match[1],
      filePath,
      line: lineOf(text, match.index),
      status: 'unknown' as const
    });
  }
  return cases;
}

function findPatterns(project: TestProject, filePath: string, text: string, patterns: Pattern[]): QualityFinding[] {
  const findings: QualityFinding[] = [];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.regex.source, `${pattern.regex.flags.includes('g') ? pattern.regex.flags : `${pattern.regex.flags}g`}`);
    while ((match = regex.exec(text))) {
      findings.push(finding(project, pattern.kind, pattern.severity, filePath, pattern.message, lineOf(text, match.index)));
    }
  }
  return findings;
}

function findWeakAssertions(project: TestProject, filePath: string, text: string): QualityFinding[] {
  if (project.framework === 'node' || project.framework === 'react' || project.framework === 'firebase-functions') {
    const code = maskJsCode(text);
    if (!hasJsAssertion(text)) {
      return [finding(project, 'no-assertion', 'warning', filePath, 'No obvious assertion found in this test file.')];
    }
    const snapshotRegex = /\btoMatch(?:Inline)?Snapshot\s*\(/;
    if ((project.framework === 'react' || project.framework === 'firebase-functions') && snapshotRegex.test(code)) {
      const withoutSnapshots = code.replace(snapshotRegex, '');
      if (!/\bexpect\s*\(|\bassert(?:\s*\(|\s*\.)|\bscreen\.(?:get|find|query)By/.test(withoutSnapshots)) {
        return [finding(project, 'snapshot-only', 'warning', filePath, 'Test file appears to rely only on snapshots.')];
      }
    }
    return [];
  }
  const assertionRegex =
    project.framework === 'flutter'
      ? /\bexpect\s*\(/
      : project.framework === 'django' || project.framework === 'fastapi'
        ? /\bassert\b|self\.assert\w+\s*\(/
        : /\bexpect\s*\(|\bassert\s*\(|\bscreen\.(?:get|find|query)By|\btoMatchSnapshot\s*\(/;
  const hasAssertion = assertionRegex.test(text);
  if (!hasAssertion) {
    return [finding(project, 'no-assertion', 'warning', filePath, 'No obvious assertion found in this test file.')];
  }
  return [];
}

function findTestSmells(project: TestProject, filePath: string, text: string): QualityFinding[] {
  if (project.framework === 'django' || project.framework === 'fastapi') {
    return [];
  }
  if (project.framework === 'flutter') {
    return findFlutterSmells(project, filePath, text);
  }

  const findings: QualityFinding[] = [];
  const code = maskJsCode(text);
  const hasLocalImport = hasLocalJsImport(text);
  if (!hasLocalImport) {
    findings.push(
      finding(
        project,
        'orphan-test',
        'warning',
        filePath,
        'Test does not import a local source module, so it may be a setup/helper test or disconnected from app behavior.'
      )
    );
  }

  const trivialPatterns: Array<[RegExp, string]> = [
    [/\bexpect\s*\(\s*true\s*\)\s*\.toBe\s*\(\s*true\s*\)/, 'Assertion is always true.'],
    [/\bexpect\s*\(\s*1\s*\)\s*\.toBe\s*\(\s*1\s*\)/, 'Assertion is always true.'],
    [/\bexpect\s*\([^)]*\)\s*\.toBeDefined\s*\(\s*\)/, 'Only checks that something exists; verify behavior or output instead.'],
    [/\bexpect\s*\([^)]*\)\s*\.toBeTruthy\s*\(\s*\)/, 'Truthy assertion may be too weak; prefer a specific observable outcome.']
  ];
  for (const [regex, message] of trivialPatterns) {
    const match = regex.exec(code);
    if (match) {
      findings.push(finding(project, 'trivial-assertion', 'warning', filePath, message, lineOf(text, match.index)));
    }
  }

  const rendersUi = /\brender\s*\(/.test(code);
  const hasUserInteraction = /\b(userEvent|fireEvent)\.|\b(click|type|selectOptions|keyboard|hover)\s*\(/.test(code);
  const hasAsyncUiAssertion = /\bfindBy|\bwaitFor\s*\(/.test(code);
  if (rendersUi && !hasUserInteraction && !hasAsyncUiAssertion && /\.toBe(InTheDocument|Truthy|Defined)\s*\(/.test(code)) {
    findings.push(
      finding(
        project,
        'weak-test',
        'warning',
        filePath,
        'Render-only test with shallow existence assertions. Add user interaction, state changes, error states, or visible outcome checks.'
      )
    );
  }

  const mocks = (code.match(/\b(jest|vi)\.mock\s*\(/g) ?? []).length;
  const assertions = (code.match(/\bexpect\s*\(/g) ?? []).length;
  if (mocks >= 3 && assertions <= 1) {
    findings.push(finding(project, 'weak-test', 'warning', filePath, 'Heavy mocking with few assertions can hide behavior instead of testing it.'));
  }

  return findings;
}

function finding(
  project: TestProject,
  kind: QualityFinding['kind'],
  severity: QualityFinding['severity'],
  filePath: string,
  message: string,
  line?: number
): QualityFinding {
  const rel = relativePath(project.rootPath, filePath);
  return {
    id: `${project.id}:${kind}:${rel}:${line ?? 0}`,
    kind,
    severity,
    message,
    filePath,
    line
  };
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split(/\r?\n/).length;
}

export function testFileFromPath(project: TestProject, filePath: string, text: string): TestFile {
  return {
    path: filePath,
    projectId: project.id,
    testCases: discoverTestCases(project, filePath, text),
    status: 'unknown',
    qualityFindings: []
  };
}

export function isLikelyTestPath(filePath: string): boolean {
  const base = path.basename(filePath);
  return (
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(base) ||
    /^test_.*\.py$/.test(base) ||
    /_test\.py$/.test(base) ||
    base === 'tests.py' ||
    /_test\.dart$/.test(base)
  );
}
