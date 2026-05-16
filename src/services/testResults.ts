import { TestFile, TestProject } from '../models';

type JestJson = {
  testResults?: Array<{
    name: string;
    status?: string;
    startTime?: number;
    endTime?: number;
    assertionResults?: Array<{
      fullName?: string;
      title?: string;
      status?: string;
      duration?: number;
      failureMessages?: string[];
      location?: { line?: number };
    }>;
  }>;
};

export function parseJestLikeJson(project: TestProject, stdout: string): TestFile[] {
  const json = extractJson(stdout);
  if (!json) {
    return [];
  }
  const parsed = JSON.parse(json) as JestJson;
  return (parsed.testResults ?? []).map((result) => {
    const cases = (result.assertionResults ?? []).map((assertion, index) => ({
      id: `${result.name}:${assertion.fullName ?? assertion.title ?? index}`,
      name: assertion.fullName ?? assertion.title ?? `test ${index + 1}`,
      filePath: result.name,
      line: assertion.location?.line,
      status: mapStatus(assertion.status),
      durationMs: assertion.duration,
      errorMessage: assertion.failureMessages?.join('\n')
    }));
    return {
      path: result.name,
      projectId: project.id,
      testCases: cases,
      status: mapFileStatus(result.status, cases.map((testCase) => testCase.status)),
      durationMs: result.startTime !== undefined && result.endTime !== undefined ? result.endTime - result.startTime : undefined,
      qualityFindings: []
    };
  });
}

function extractJson(stdout: string): string | null {
  const trimmed = stdout.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  return start >= 0 && end > start ? trimmed.slice(start, end + 1) : null;
}

function mapStatus(status?: string) {
  if (status === 'passed' || status === 'success') {
    return 'passed' as const;
  }
  if (status === 'failed' || status === 'failure' || status === 'error') {
    return 'failed' as const;
  }
  if (status === 'pending' || status === 'skipped' || status === 'todo') {
    return 'skipped' as const;
  }
  return 'unknown' as const;
}

function mapFileStatus(status: string | undefined, caseStatuses: Array<'unknown' | 'passed' | 'failed' | 'skipped'>) {
  const direct = mapStatus(status);
  if (direct !== 'unknown') {
    return direct;
  }
  const unique = new Set(caseStatuses);
  return unique.size === 1 ? caseStatuses[0] ?? 'unknown' : 'mixed';
}
